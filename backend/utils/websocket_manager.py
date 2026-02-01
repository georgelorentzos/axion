from fastapi import WebSocket, APIRouter, Depends
from typing import Dict, Set
import jwt
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import json
from sqlalchemy.orm import Session
from sqlalchemy import or_
from utils.database import get_db
from models import User, Friend
import asyncio
from collections import defaultdict

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.connection_attempts: Dict[str, list] = defaultdict(list)
        self.max_connections_per_user = 5
        self.max_connection_attempts = 12

    def can_connect(self, user_id: str) -> bool:
        now = datetime.utcnow()
        self.connection_attempts[user_id] = [
            attempt_time for attempt_time in self.connection_attempts[user_id]
            if now - attempt_time < timedelta(seconds=60)
        ]
        if len(self.connection_attempts[user_id]) >= self.max_connection_attempts:
            return False
        if user_id in self.active_connections and len(self.active_connections[user_id]) >= self.max_connections_per_user:
            return False
        self.connection_attempts[user_id].append(now)
        return True

    async def connect(self, websocket: WebSocket, user_id: str, db: Session):
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_online = True
            user.last_seen = datetime.utcnow()
            db.commit()
        
        if not self.can_connect(user_id):
            await websocket.close(code=1008)
            return False
        
        await websocket.accept()

        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)

        friends = db.query(Friend).filter(
            or_(Friend.addressee_id == user_id, Friend.requester_id == user_id),
            Friend.status == "friends"
        ).all()
        
        for friend in friends:
            f_id = friend.addressee_id if friend.addressee_id != user_id else friend.requester_id
            f_user = db.query(User).filter(User.id == f_id).first()
            if f_user:
                asyncio.create_task(self.broadcast_to_user(f_id, {
                    "type": "user_online",
                    "user_id": user.id,
                    "username": user.username,
                    "profile_image": user.profile_image,
                    "created_at": user.created_at.year
                }))
                if f_user.is_online:
                    await websocket.send_text(json.dumps({
                        "type": "user_online",
                        "user_id": f_user.id,
                        "username": f_user.username,
                        "profile_image": f_user.profile_image,
                        "created_at": f_user.created_at.year
                    }))

        pendings = db.query(Friend).filter(
            or_(Friend.addressee_id == user_id, Friend.requester_id == user_id),
            Friend.status == "pending"
        ).all()

        for p in pendings:
            p_id = p.addressee_id if p.addressee_id != user_id else p.requester_id
            p_user = db.query(User).filter(User.id == p_id).first()
            if p_user:
                asyncio.create_task(self.broadcast_to_user(p_id, {
                    "type": "pending_online",
                    "user_id": user.id,
                    "username": user.username,
                    "profile_image": user.profile_image,
                    "created_at": user.created_at.year
                }))
                if p_user.is_online:
                    await websocket.send_text(json.dumps({
                        "type": "pending_online",
                        "user_id": p_user.id,
                        "username": p_user.username,
                        "profile_image": p_user.profile_image,
                        "created_at": p_user.created_at.year
                    }))
        return True

    async def disconnect(self, websocket: WebSocket, user_id: str, db: Session):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.is_online = False
                    user.last_seen = datetime.utcnow()
                    db.commit()

                    friends = db.query(Friend).filter(
                        or_(Friend.addressee_id == user_id, Friend.requester_id == user_id),
                        Friend.status == "friends"
                    ).all()
                    for f in friends:
                        f_id = f.addressee_id if f.addressee_id != user_id else f.requester_id
                        asyncio.create_task(self.broadcast_to_user(f_id, {
                            "type": "user_offline",
                            "user_id": user.id
                        }))

                    pendings = db.query(Friend).filter(
                        or_(Friend.addressee_id == user_id, Friend.requester_id == user_id),
                        Friend.status == "pending"
                    ).all()
                    for p in pendings:
                        p_id = p.addressee_id if p.addressee_id != user_id else p.requester_id
                        asyncio.create_task(self.broadcast_to_user(p_id, {
                            "type": "pending_offline",
                            "user_id": user.id
                        }))

    async def broadcast_to_user(self, user_id: str, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except:
                    pass

manager = ConnectionManager()

@router.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    token = websocket.query_params.get("token", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            await websocket.close(code=1008)
            return
    except:
        await websocket.close(code=1008)
        return

    if await manager.connect(websocket, user_id, db):
        try:
            while True:
                await websocket.receive_text()
        except:
            pass
        finally:
            await manager.disconnect(websocket, user_id, db)