from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request, Query, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from schemas import *
from utils.database import get_db, Session as SessionLocal
from sqlalchemy import and_, or_, func, cast, String
from sqlalchemy.orm import Session, joinedload
from models import *
from utils.mail import send_mail
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime, timedelta
import jwt
import secrets
from typing import Dict, Any, Optional
from schedulers.token_cleanup import token_cleanup_scheduler
from schedulers.online_cleanup import forgotten_online_users_scheduler
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from utils.websocket_manager import router, manager
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, FileResponse
import asyncio
import uuid
import shutil
from constants.permissions import PERMISSIONS



load_dotenv()

app = FastAPI()

SECRET_KEY = os.getenv('SECRET_KEY')
API_ENDPOINT = os.getenv('API_ENDPOINT')
GATEWAY_ENDPOINT = os.getenv('GATEWAY_ENDPOINT')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
BUILD_NUMBER = datetime.now().strftime('%Y%m%d%H%M%S')

os.makedirs("uploads", exist_ok=True)
UPLOADS_FOLDER = Path("uploads")

templates = Jinja2Templates(directory="dist")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Too many sign-in attempts. Please try again later."}
))

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

def get_user_id_from_token(request: Request) -> str:
    token = request.headers.get("Authorization", "").split(" ")[-1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token.")
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
    
@app.on_event('startup')
def startup():
    token_cleanup_scheduler()
    forgotten_online_users_scheduler()

app.include_router(router, prefix="/api")

@app.post('/api/auth', response_model=AuthResponse)
@limiter.limit("5/minute")
def auth(request: Request, req: AuthRequest, background_tasks:BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if not user:

        new_user = User(
            username=req.email.split("@")[0],
            email=req.email,
            is_verified=False
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user

    db.query(Token).filter(
        Token.user_id == user.id,
        Token.type == "Auth"
    ).delete()
    db.commit()

    token: str = secrets.token_urlsafe(64)
    new_token: Token = Token(
        token=token,
        type="Auth",
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(new_token)
    db.commit()

    template_path: Path = Path("templates/mail/sign-in.html") if user.is_verified else Path("templates/mail/sign-up.html")
    html: str = template_path.read_text()
    html = html.replace("{token}", token)

    mail_data: SendMail = SendMail(
        recipient=req.email,
        subject="Sign In Link" if user.is_verified else "Sign Up Link",
        message=html
    )

    background_tasks.add_task(send_mail, mail_data)

    return AuthResponse(
        success=True,
        message="Email sent successfully"
    )

@app.post('/api/verify-token', response_model=Dict[str, Any])
@limiter.limit("5/minute")
def verify_token(request: Request, req: CreateToken, db: Session = Depends(get_db)) -> Dict[str, Any]:
    token_record: Token | None = db.query(Token).filter(Token.token == req.token).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    if token_record.type != 'Auth':
        raise HTTPException(status_code=400, detail="Invalid or expired token.")
    
    token_age: timedelta = datetime.utcnow() - token_record.created_at
    if token_age > timedelta(minutes=15):
        db.delete(token_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Token has expired.")
    
    user: User | None = db.query(User).filter(User.id == token_record.user_id).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")
    
    user.is_verified = True
    db.add(user)
    db.delete(token_record)
    db.commit()

    payload: Dict[str, Any] = {
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    token: str = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    return {
        "success": True,
        "message": "Sign in successful",
        "token": token
    }

@app.post('/api/validate-token', response_model=Dict[str, Any])
@limiter.limit("120/minute")
def validate_token(request: Request, req: ValidateToken, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found.")
        
        return {
            "success": True,
            "message": "Token is valid",
            "id": user.id,
            "username": user.username,
            "email": user.email
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
    
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token validation failed.")
    
@app.get('/api/me', response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def get_current_user(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return {
        "success": True,
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "image": user.profile_image
    }

@app.get('/api/users/search', response_model=Dict[str, Any])
@limiter.limit('50/minute')
def search_user(request: Request, search: str = Query(..., alias="search"), user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:    
    users = db.query(User).filter(User.username.ilike(f"%{search}%"), User.id != user_id).limit(20).all()
    return {
        "success": True,
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "image": user.profile_image,
                "isOnline": user.is_online,
                "createdAt": user.created_at.year
            } for user in users
        ]
    }

@app.get('/api/users/{user_id}', response_model=Dict[str, Any])
@limiter.limit('120/minute')
def get_user_profile(request: Request, user_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    return {
        "success": True,
        "id": user.id,
        "username": user.username,
        "image": user.profile_image,
        "isOnline": user.is_online,
        "joinedAt": user.created_at.year
    }

@app.post('/api/ally', response_model=Dict[str, Any])
@limiter.limit('120/minute')
async def ally(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token) ,db: Session = Depends(get_db)) -> Dict[str, Any]:
    if req.requester_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot send as another user.")
    
    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself.")
    
    requester = db.query(User).filter(User.id == req.requester_id).first()
    addressee = db.query(User).filter(User.id == req.addressee_id).first()
    
    if not addressee:
        raise HTTPException(status_code=404, detail="User not found.")
    
    existing = db.query(Friend).filter(
        ((Friend.requester_id == req.requester_id) & (Friend.addressee_id == req.addressee_id)) |
        ((Friend.requester_id == req.addressee_id) & (Friend.addressee_id == req.requester_id))
    ).first()
    
    if existing:
        if existing.status == "friends":
            raise HTTPException(status_code=400, detail="Request already exists.")
    
        if existing.requester_id == req.addressee_id and existing.status == "pending":
            existing.status = "friends"
            db.commit()
            return {
                "success": True, 
                "message": "Friend request accepted"
                }
        else:
            raise HTTPException(status_code=400, detail="Request already exists.")
    
    try:
        new_friend = Friend(requester_id=req.requester_id, addressee_id=req.addressee_id)
        db.add(new_friend)
        db.commit()

        await manager.broadcast_to_user(req.addressee_id, {
            "type": "allyRequest",
            "id": req.requester_id,
            "username": requester.username,
            "image": requester.profile_image,
            "createdAt": requester.created_at.year
        })

        return {
            "success": True, 
            "message": "Friend request sent"
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send request.")
    
@app.delete('/api/ally/cancel', response_model=Dict[str, Any])
@limiter.limit('120/minute')
async def cancel_ally(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    if req.requester_id != user_id:
        raise HTTPException(status_code=403, )
    
    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot cancel yourself.")
    
    requester = db.query(User).filter(User.id == req.requester_id).first()
    if not db.query(User).filter(User.id == req.addressee_id).first():
        raise HTTPException(status_code=404, detail="User not found.")

    existing = db.query(Friend).filter(
        ((Friend.requester_id == req.requester_id) & (Friend.addressee_id == req.addressee_id)) |
        ((Friend.requester_id == req.addressee_id) & (Friend.addressee_id == req.requester_id)),
        Friend.status == "pending"
    ).first()
    
    if existing:
        try:
            db.delete(existing)
            db.commit()

            await manager.broadcast_to_user(req.addressee_id, {
                "type": "allyCancelRequest",
                "id": req.requester_id,
                "username": requester.username,
                "image": requester.profile_image
            })
            
            return {
                "success": True, 
                "message": "Friend request canceled"
                }
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to cancel request.")
    else:
        return {
            "success": True, 
            "message": "Request already canceled"
            }

@app.delete("/api/ally/reject", response_model=Dict[str, Any])
@limiter.limit('120/minute')
async def ally_reject(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    existing = db.query(Friend).filter(
        Friend.addressee_id == user_id,
        Friend.requester_id == req.requester_id,
        Friend.status == "pending"
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Friend request not found.")

    try:
        db.delete(existing)
        db.commit()

        await manager.broadcast_to_user(req.requester_id, {
            "type": "allyRejected",
            "addresseeId": user_id
        })

        return {
            "success": True,
            "message": "Friend request rejected"
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reject ally.")

@app.post('/api/ally/accept', response_model=Dict[str, Any])
@limiter.limit('120/minute')
async def ally_accept(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)):
    existing = db.query(Friend).filter(
        Friend.addressee_id == user_id,
        Friend.requester_id == req.requester_id,
        Friend.status == "pending"
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Friend request not found.")
    
    requester = db.query(User).filter(User.id == req.requester_id).first()
    addressee = db.query(User).filter(User.id == user_id).first()
    
    try:
        existing.status = "friends"
        db.commit()

        await manager.broadcast_to_user(user_id, {
            "type": "allyAcceptRequest",
            "id": req.requester_id,
            "username": requester.username,
            "image": requester.profile_image,
            "isOnline": requester.is_online,
            "createdAt": requester.created_at.year
        })

        await manager.broadcast_to_user(req.requester_id, {
            "type": "allyAcceptRequest",
            "id": user_id,
            "username": addressee.username,
            "image": addressee.profile_image,
            "isOnline": addressee.is_online,
            "createdAt": addressee.created_at.year
        })

        return {
            "success": True, 
            "message": "Friend request accepted."
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to accept friend request.")

@app.get('/api/my/ally/requests', response_model=Dict[str, Any])
@limiter.limit('120/minute')
def my_ally_requests(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    pending = db.query(Friend).filter(
        and_(Friend.requester_id == user.id, Friend.status == "pending")
    ).all()

    return {
        "success": True,
        "pending": [
            {
                "id": pending.addressee_id,
                "requesterName": pending.requester.username,
                "requesterImage": pending.requester.profile_image
            } for pending in pending
        ]
    }

@app.get('/api/my/pending', response_model=Dict[str, Any])
@limiter.limit('120/minute')
def get_pending(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    pendigs = db.query(Friend).filter(
        and_(Friend.addressee_id == user.id, Friend.status == "pending")
    ).all()

    return {
        "success": True,
        "pending": [
            {
                "id": pending.requester.id,
                "username": pending.requester.username,
                "image": pending.requester.profile_image,
                "isOnline": pending.requester.is_online,
                "createdAt": pending.created_at.year
            } for pending in pendigs
        ]
    }

@app.get('/api/my/friends/all', response_model=Dict[str, Any])
@limiter.limit('120/minute')
def my_friends_all(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    friends = db.query(Friend, User).join(
        User, 
        or_(
            and_(Friend.requester_id == user.id, Friend.addressee_id == User.id),
            and_(Friend.addressee_id == user.id, Friend.requester_id == User.id)
        )
    ).filter(
        or_(Friend.addressee_id == user.id, Friend.requester_id == user.id),
        Friend.status == "friends",
        User.id != user_id
    ).all()
    
    friends_list = [
        {
            "id": friend.User.id,
            "username": friend.User.username,
            "image": friend.User.profile_image,
            "isOnline": friend.User.is_online,
            "createdAt": friend.User.created_at.year
        } for friend in friends
    ]
    
    return {
        "success": True,
        "friends": friends_list
    }
        
@app.get('/api/my/friends/online', response_model=Dict[str, Any])
@limiter.limit('120/minute')
def my_friends_online(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    friends = db.query(Friend, User).join(
        User, 
        or_(
            and_(Friend.requester_id == user.id, Friend.addressee_id == User.id),
            and_(Friend.addressee_id == user.id, Friend.requester_id == User.id)
        )
    ).filter(
        or_(Friend.addressee_id == user.id, Friend.requester_id == user.id),
        Friend.status == "friends",
        User.is_online == True,
        User.id != user_id
    ).all()

    friends_list = [
        {
            "id": friend.User.id,
            "username": friend.User.username,
            "image": friend.User.profile_image,
            "createdAt": friend.User.created_at.year
        } for friend in friends
    ]

    return {
        "success": True,
        "friends": friends_list
    }

@app.delete('/api/ally/remove', response_model=Dict[str, Any])
@limiter.limit('120/minute')
async def ally_remove(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    if req.requester_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot remove as another user.")
    
    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself.")

    requester = db.query(User).filter(
        User.id == req.requester_id
    ).first()

    addressee = db.query(User).filter(User.id == req.addressee_id).first()
    
    if not db.query(User).filter(User.id == req.addressee_id).first():
        raise HTTPException(status_code=404, detail="User not found.")
    
    existing = db.query(Friend).filter(
        ((Friend.requester_id == req.requester_id) & (Friend.addressee_id == req.addressee_id)) |
        ((Friend.requester_id == req.addressee_id) & (Friend.addressee_id == req.requester_id)),
        Friend.status == "friends"
    ).first()

    if existing:
        try:
            db.delete(existing)
            db.commit()

            await manager.broadcast_to_user(req.addressee_id, {
                "type": "allyRemoved",
                "id": req.requester_id,
                "username": requester.username,
                "image": requester.profile_image
            })

            await manager.broadcast_to_user(user_id, {
                "type": "allyRemoved",
                "id": req.addressee_id,
                "username": addressee.username,
                "image": addressee.profile_image
            })

            return {
                "success": True, 
                "message": "Friend request removed."
                }
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to cancel request.")

@app.post('/api/send/message', response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def send_message(request: Request, req: MessageRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    
    if req.sender_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot send as another user.")

    recipient = db.query(User).filter(User.id == req.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient Not Found.")
    
    if req.sender_id == req.recipient_id:
        raise HTTPException(status_code=400, detail="Cannot send yourself.")
    
    sender = db.query(User).filter(User.id == user_id).first()
    
    new_direct_message = DirectMessage(
        sender_id=sender.id,
        recipient_id=recipient.id,
        message=req.message
    )

    existing_conversation = db.query(ConversationHistory).filter(
        ((ConversationHistory.sender_id == sender.id) & 
         (ConversationHistory.recipient_id == recipient.id)) |
        ((ConversationHistory.sender_id == recipient.id) & 
         (ConversationHistory.recipient_id == sender.id))
    ).first()

    try:
        db.add(new_direct_message)
        
        if not existing_conversation:
            new_conversation_history = ConversationHistory(
                sender_id=sender.id,
                recipient_id=recipient.id,
                message=req.message
            )
            db.add(new_conversation_history)
        else:
            existing_conversation.message = req.message
            existing_conversation.hidden_by_sender = False
            existing_conversation.hidden_by_recipient = False

        db.commit()

        await manager.broadcast_to_user(user_id, {
            "type": "messageSent",
            "id": new_direct_message.id,
            "senderId": user_id,
            "recipientId": req.recipient_id,
            "message": req.message,
            "createdAt": datetime.now().strftime("%H:%M"),
        })

        await manager.broadcast_to_user(req.recipient_id, {
            "type": "newDirectMessage",
            "id": sender.id,
            "username": sender.username,
            "image": sender.profile_image,
            "isOnline": sender.is_online,
            "latestMessage": req.message,
            "createdAt": sender.created_at.year,
        })

        await manager.broadcast_to_user(req.recipient_id, {
            "type": "messageSent",
            "id": new_direct_message.id,
            "senderId": user_id,
            "recipientId": req.recipient_id,
            "message": req.message,
            "createdAt": datetime.now().strftime("%H:%M"),
        })

        await manager.broadcast_to_user(user_id, {
            "type": "newDirectMessage",
            "id": recipient.id,
            "username": recipient.username,
            "image": recipient.profile_image,
            "isOnline": recipient.is_online,
            "latestMessage": req.message,
            "createdAt": recipient.created_at.year,
        })

        return {
            "success": True, 
            "message": "Message send successfuly!"
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send message.")

@app.get('/api/messages/{user_id}', response_model=Dict[str, Any])
@limiter.limit("120/minute")
def get_messages(
    request: Request, 
    user_id: str,
    limit: int = Query(30, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_user_id_from_token), 
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    total_count = db.query(DirectMessage).filter(
        or_(
            and_(DirectMessage.sender_id == current_user_id, DirectMessage.recipient_id == user_id),
            and_(DirectMessage.sender_id == user_id, DirectMessage.recipient_id == current_user_id)
        )
    ).filter(
        ~and_(
            DirectMessage.sender_id == current_user_id,
            DirectMessage.hidden_by_sender == True
        ),
        ~and_(
            DirectMessage.recipient_id == current_user_id,
            DirectMessage.hidden_by_recipient == True
        )
    ).count()
    
    messages = db.query(DirectMessage).filter(
        or_(
            and_(DirectMessage.sender_id == current_user_id, DirectMessage.recipient_id == user_id),
            and_(DirectMessage.sender_id == user_id, DirectMessage.recipient_id == current_user_id),
        )
    ).filter(
        ~and_(
            DirectMessage.sender_id == current_user_id,
            DirectMessage.hidden_by_sender == True
        ),
        ~and_(
            DirectMessage.recipient_id == current_user_id,
            DirectMessage.hidden_by_recipient == True
        )
    ).order_by(DirectMessage.created_at.desc()).offset(offset).limit(limit).all()
    
    messages.reverse()
    
    messages_list = [
        {
            "id": message.id,
            "senderId": message.sender_id,
            "recipientId": message.recipient_id,
            "message": message.message,
            "createdAt": message.created_at.strftime("%H:%M")
        } for message in messages
    ]
    
    return {
        "success": True,
        "messages": messages_list,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "hasMore": (offset + limit) < total_count
    }

@app.get('/api/my/conversations', response_model=Dict[str, Any])
@limiter.limit('120/minute')
def my_conversations(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    messages = db.query(ConversationHistory).filter(
        or_(
            ConversationHistory.recipient_id == user_id,
            ConversationHistory.sender_id == user_id
        )
    ).order_by(ConversationHistory.created_at.desc()).all()
    
    seen_users = {} 
    for message in messages:
        other_user_id = message.sender_id if message.recipient_id == user_id else message.recipient_id
        
        is_hidden = False
        if message.recipient_id == user_id and message.hidden_by_recipient:
            is_hidden = True
        elif message.sender_id == user_id and message.hidden_by_sender:
            is_hidden = True
        
        if is_hidden:
            continue
        
        if other_user_id not in seen_users:
            other_user = db.query(User).filter(User.id == other_user_id).first()
            if other_user:
                seen_users[other_user_id] = {
                    "id": other_user.id,
                    "username": other_user.username,
                    "image": other_user.profile_image,
                    "isOnline": other_user.is_online,
                    "createdAt": other_user.created_at.year,
                    "latestMessage": message.message
                }
    
    conversation_list = list(seen_users.values())
    
    return {
        "success": True,
        "conversations": conversation_list
    }

@app.delete('/api/conversation/{user_id}', response_model=Dict[str, Any])
@limiter.limit('120/minute')
async def delete_conversation(request: Request, user_id: str, current_user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    other_user = db.query(User).filter(User.id == user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    conversation = db.query(ConversationHistory).filter(
        (
            (ConversationHistory.sender_id == current_user_id) &
            (ConversationHistory.recipient_id == user_id)
        ) |
        (
            (ConversationHistory.sender_id == user_id) &
            (ConversationHistory.recipient_id == current_user_id)
        )
    ).first()

    messages = db.query(DirectMessage).filter(
        (
            (DirectMessage.sender_id == current_user_id) &
            (DirectMessage.recipient_id == user_id)
        ) |
        (
            (DirectMessage.sender_id == user_id) &
            (DirectMessage.recipient_id == current_user_id)
        )
    ).all()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    if not messages:
        raise HTTPException(status_code=404, detail="Messages not found.")
    
    try:
        if conversation.sender_id == current_user_id:
            conversation.hidden_by_sender = True
        else:
            conversation.hidden_by_recipient = True

        for message in messages:
            if message.sender_id == current_user_id:
                message.hidden_by_sender = True
            else:
                message.hidden_by_recipient = True

            if message.hidden_by_sender and message.hidden_by_recipient:
                db.delete(message)
        
        db.commit()

        await manager.broadcast_to_user(current_user_id, {
            "type": "conversationDeleted",
            "conversationId": user_id
        })

        return {"success": True, "message": "Conversation deleted."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete conversation.")

@app.post("/api/community/create", response_model=Dict[str, Any])
@limiter.limit("50/minute")
def create_community(
    request: Request,
    community_name: str = Form(...),
    community_image: UploadFile | None = File(None),
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    community_name = community_name.strip()
    if not community_name:
        raise HTTPException(status_code=400, detail="Community name required.")
    if len(community_name) < 4:
        raise HTTPException(status_code=400, detail="Community name must be at least 4 characters.")
    if len(community_name) > 20:
        raise HTTPException(status_code=400, detail="Community name can't be bigger than 20 characters.")

    image_path = None
    image_url: str | None = None
    if community_image and community_image.filename:
        ext = os.path.splitext(community_image.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        image_path = os.path.join(UPLOADS_FOLDER, filename)
        with open(image_path, "wb") as f:
            shutil.copyfileobj(community_image.file, f)
        base = (os.getenv("MEDIA_CDN_URL") or "/api/serve/image").rstrip("/")
        image_url = f"{base}/{filename}"
    else:
        image_url = None

    try:
        new_community = Community(
            community_name=community_name,
            community_image=image_url,
            owner_id=user.id,
        )
        db.add(new_community)
        db.flush()

        db.add(CommunityMember(user_id=user.id, community_id=new_community.id))
        new_log = CommunityLog(
            log=f"Community created by {user.username}",
            community_id=new_community.id,
            user_id=user.id
        )
        db.add(new_log)
        db.flush()
        db.refresh(new_log)

        db.commit()
        return {"success": True,
                "id": new_community.id,
                "name": new_community.community_name,
                "image": new_community.community_image
                }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create community due to an internal server error.")

@app.get("/api/my/communities", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def my_communities(request: Request, current_user_id: str = Depends(get_user_id_from_token) ,db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    communities = (
        db.query(CommunityMember, Community).join(
            Community,
            Community.id == CommunityMember.community_id
        ).filter(
            CommunityMember.user_id == current_user_id
        ).all()
    )

    community_ids = [community.id for _, community in communities]

    return {
        "success": True,
        "communities": [
            {
                "id": community.id,
                "name": community.community_name,
                "image": community.community_image,
                "ownerId": community.owner_id,
            } for member, community in communities
        ]
    }

@app.get("/api/serve/image/{image_name}")
def serve_image(image_name: str):
    file_path = UPLOADS_FOLDER / image_name

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Image not found.")

    return FileResponse(path=str(file_path))

@app.post("/api/category/create", response_model=Dict[str, Any])
@limiter.limit("50/minute")
def create_category(request: Request, req: CategoryRequest, user_id: str = Depends(get_user_id_from_token) ,db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(Community.id == req.community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    member = db.query(CommunityMember).filter(
        CommunityMember.user_id == user_id,
        CommunityMember.community_id == req.community_id,
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this community.")

    roles = db.query(CommunityRole).join(
        MemberRole, MemberRole.role_id == CommunityRole.id
    ).filter(
        CommunityRole.community_id == req.community_id,
        MemberRole.member_id == member.id
    ).all()

    has_permission = any("CREATE_CATEGORY" in role.permissions for role in roles)

    if not has_permission:
        raise HTTPException(
            status_code=403, 
            detail="You don't have permission to create a category."
        )
    
    category = CommunityCategory(
        category_name=req.category_name,
        community_id=req.community_id
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return {"id": category.id, "name": category.category_name}

@app.patch("/api/community/{community_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def update_community(
    request: Request,
    community_id: str,
    community_name: str = Form(...),
    community_image: UploadFile | None = File(None),
    remove_image: str | None = Form(None),
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    is_owner = community.owner_id == user.id

    has_permissions = False
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == user.id
    ).first()
    
    if member:
        roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == member.id
        ).all()

    if not is_owner and not has_permissions:
        raise HTTPException(status_code=403, detail="You don't have permission to make changes")

    community_name = community_name.strip()
    if not community_name:
        raise HTTPException(status_code=400, detail="Community name required.")
    if len(community_name) < 4:
        raise HTTPException(status_code=400, detail="Community name must be at least 4 characters.")
    if len(community_name) > 20:
        raise HTTPException(status_code=400, detail="Community name can't be bigger than 20 characters.")

    image_url = None
    old_image_path = None
    should_remove_image = remove_image == "true"

    if should_remove_image and community.community_image:
        old_image_filename = community.community_image.split("/")[-1]
        old_image_path = UPLOADS_FOLDER / old_image_filename
        image_url = None

    if community_image and community_image.filename:
        if community.community_image and community.community_image != None:
            old_image_filename = community.community_image.split("/")[-1]
            old_image_path = UPLOADS_FOLDER / old_image_filename
        
        ext = os.path.splitext(community_image.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        new_image_path = UPLOADS_FOLDER / filename
        with open(new_image_path, "wb") as f:
            shutil.copyfileobj(community_image.file, f)
        base = (os.getenv("MEDIA_CDN_URL") or "/api/serve/image").rstrip("/")
        image_url = f"{base}/{filename}"

    try:
        name_changed = community.community_name != community_name
        image_changed = image_url is not None or should_remove_image

        community.community_name = community_name
        if should_remove_image:
            community.community_image = None
        elif image_url:
            community.community_image = image_url

        if name_changed and image_changed:
            log_message = f"{user.username} updated community image and name to {community_name}"
        elif name_changed:
            log_message = f"{user.username} updated community name to {community_name}"
        elif image_changed:
            log_message = f"{user.username} updated community image"
        else:
            log_message = None

        if log_message:
            new_log = CommunityLog(
                log=log_message,
                community_id=community.id,
                user_id=user.id
            )
            db.add(new_log)
            db.flush()
            db.refresh(new_log)

            members_with_log_permission = db.query(CommunityMember).join(
                MemberRole, MemberRole.member_id == CommunityMember.id
            ).join(
                CommunityRole, CommunityRole.id == MemberRole.role_id
            ).filter(
                CommunityMember.community_id == community.id,
                CommunityMember.user_id != user.id,
                or_(
                    cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.VIEW_LOGS}%'),
                    cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
                )
            ).all()
            log_user_ids = {m.user_id for m in members_with_log_permission}
            log_user_ids.add(community.owner_id)
            if user.id != community.owner_id:
                log_user_ids.discard(user.id)
            await asyncio.gather(*[
                manager.broadcast_to_user(uid, {
                    "type": "newLog",
                    "log": new_log.log,
                    "description": "",
                    "createdAt": new_log.created_at.strftime("%D %H:%M"),
                    "userImgUrl": user.profile_image
                })
                for uid in log_user_ids
            ])

        db.commit()
        db.flush()
        
        if old_image_path and old_image_path.exists() and old_image_path.is_file():
            try:
                old_image_path.unlink()
            except Exception:
                pass
        
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id != community.owner_id
        ).all()

        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "communityUpdated",
                "id": community.id,
                "name": community.community_name,
                "image": community.community_image,
            })
            for member in members_to_notify
        ])
        
        return {
            "success": True,
            "id": community.id,
            "name": community.community_name,
            "image": community.community_image,
            "ownerId": community.owner_id,
            "createdAt": community.created_at.year,
        }
    except Exception as e:
        db.rollback()
        if image_url:
            new_file = UPLOADS_FOLDER / filename
            if new_file.exists():
                try:
                    new_file.unlink()
                except Exception:
                    pass
        raise HTTPException(status_code=500, detail="Failed to update community due to an internal server error.")

@app.get("/api/community/{community_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def fetch_community(request: Request, community_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    total_members = db.query(func.count(CommunityMember.id)).filter(
        CommunityMember.community_id == community_id
    ).scalar()

    online_members = db.query(func.count(CommunityMember.id)).join(
        User, User.id == CommunityMember.user_id
    ).filter(
        CommunityMember.community_id == community_id,
        User.is_online.is_(True)
    ).scalar()

    return {
        "id": community.id,
        "name": community.community_name,
        "image": community.community_image,
        "ownerId": community.owner_id,
        "onlineMembers": online_members or 0,
        "totalMembers": total_members or 0,
        "createdAt": community.created_at.year,
    }

@app.patch("/api/community/{community_id}/join", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def join_community(request: Request, 
                   community_id: str, 
                   current_user_id: str = Depends(get_user_id_from_token),
                   db: Session = Depends(get_db
                   )) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    existing_member = db.query(CommunityMember).filter(
        CommunityMember.user_id == user.id,
        CommunityMember.community_id == community.id
    ).first()

    if existing_member:
        return {
            "success": False, 
            "message": "Already a member",
            "status": "existing_member"
        }
    
    try:
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user.id,
        ).all()
        new_community_member = CommunityMember(
            user_id=user.id,
            community_id=community.id,
        )
        db.add(new_community_member)
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "userJoined",
                "id": user.id,
                "username": user.username,
                "image": user.profile_image,
                "isOnline": user.is_online,
                "createdAt": user.created_at.year,
            })
            for member in members_to_notify
        ])
        new_log = CommunityLog(
            log=f"{user.username} joined",
            community_id=community.id,
            user_id=user.id,
        )
        db.add(new_log)
        db.flush()
        db.refresh(new_log)

        members_with_log_permission = db.query(CommunityMember).join(
            MemberRole, MemberRole.member_id == CommunityMember.id
        ).join(
            CommunityRole, CommunityRole.id == MemberRole.role_id
        ).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user.id,
            or_(
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.VIEW_LOGS}%'),
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
            )
        ).all()
        log_user_ids = {m.user_id for m in members_with_log_permission}
        log_user_ids.add(community.owner_id)
        if user.id != community.owner_id:
            log_user_ids.discard(user.id)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newLog",
                "log": new_log.log,
                "description": "",
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
                "userImgUrl": user.profile_image
            })
            for uid in log_user_ids
        ])
        db.commit()
        return { 
            "success": True,
            "id": community.id,
            "name": community.community_name,
            "image": community.community_image,
            "createdAt": community.created_at,
            "ownerId": community.owner_id,
            }
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to join community due to an internal server error.")

@app.delete("/api/community/{community_id}/leave", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def leave_community(request: Request, 
                    community_id: str, 
                    current_user_id: str = Depends(get_user_id_from_token),
                    db: Session = Depends(get_db
                    )) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    if user.id == community.owner_id:
        raise HTTPException(status_code=403, detail="Community owners cannot leave their own community. Please delete the community instead.")
    
    community_member = db.query(CommunityMember).filter(
        CommunityMember.user_id == current_user_id,
        CommunityMember.community_id == community_id
    ).first()

    if not community_member:
        raise HTTPException(status_code=409, detail="You are not a member of this community.")

    try:
        db.delete(community_member)
        db.commit()
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user.id,
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "userLeft",
                "memberId": user.id,
            })
            for member in members_to_notify
        ])
        return {
            "success": True,
            "status": "left"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred while leaving the community.",)

@app.get("/api/community/{community_id}/members", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def get_community_members(request: Request, 
                          community_id: str,
                          current_user_id: str = Depends(get_user_id_from_token),
                          db: Session = Depends(get_db) 
                          ) -> Dict[str, Any]:
    
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_members = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id
    ).options(joinedload(CommunityMember.user)).all()

    return {
        "success": True,
        "members": [
            {
                "id": community_member.user_id,
                "username": community_member.user.username,
                "image": community_member.user.profile_image,
                "isOnline": community_member.user.is_online,
                "createdAt": community_member.user.created_at.year,
            } for community_member in community_members
        ]
    }

@app.delete("/api/community/{community_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def delete_community(request: Request,
                    community_id: str,
                    community_name: str,
                    current_user_id: str = Depends(get_user_id_from_token),
                    db: Session = Depends(get_db)
                    ) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    if community.community_name != community_name:
        raise HTTPException(status_code=400, detail="Community name does not match.")
    
    if community.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the community owner is authorized to delete this community.")
    
    try:
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id != community.owner_id
        ).all()
        member_ids = [m.id for m in db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id).all()]
        db.query(MemberRole).filter(MemberRole.member_id.in_(member_ids)).delete(synchronize_session=False)
        db.query(CommunityLog).filter(CommunityLog.community_id == community_id).delete()
        db.query(CommunityMember).filter(CommunityMember.community_id == community_id).delete()
        db.query(CommunityChannel).filter(CommunityChannel.community_id == community_id).delete()
        db.query(CommunityCategory).filter(CommunityCategory.community_id == community_id).delete()
        db.query(CommunityRole).filter(CommunityRole.community_id == community_id).delete()
        db.query(Community).filter(Community.id == community_id).delete()
        db.commit()
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "communityDeleted",
                "id": community.id,
            })
            for member in members_to_notify
        ])
        return {
            "success": True,
            "id": community.id
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete community due to an internal server error.")
        
@app.post("/api/community/{community_id}/roles", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def create_role(request: Request,
                community_id: str,
                req: RoleRequest,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    role_name = req.name.strip()
    if len(role_name) < 1:
        raise HTTPException(status_code=400, detail="Role name must be at least 1 characters.")
    if len(role_name) > 20:
        raise HTTPException(status_code=400, detail="Role name can't be longer than 20 characters.")

    if community.owner_id != user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for role in community_member_roles:
            all_permissions.extend(role.permissions)

        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")
    
    try:
        new_role = CommunityRole(
            role_name=role_name,
            permissions=req.permissions.split("|") if req.permissions else [],
            community_id=community.id,
        )
        db.add(new_role)
        db.flush()
        new_log = CommunityLog(
            log=f"{user.username} created the role {new_role.role_name}",
            description=f"With permissions: {', '.join(req.permissions.split('|'))}" if req.permissions else "",
            community_id=community.id,
            user_id=user.id
        )
        db.add(new_log)
        db.flush()
        db.refresh(new_log)

        members_with_log_permission = db.query(CommunityMember).join(
            MemberRole, MemberRole.member_id == CommunityMember.id
        ).join(
            CommunityRole, CommunityRole.id == MemberRole.role_id
        ).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user.id,
            or_(
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.VIEW_LOGS}%'),
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
            )
        ).all()
        log_user_ids = {m.user_id for m in members_with_log_permission}
        log_user_ids.add(community.owner_id)
        if user.id != community.owner_id:
            log_user_ids.discard(user.id)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newLog",
                "log": new_log.log,
                "description": f"With permissions: {', '.join(req.permissions.split('|'))}" if req.permissions else "",
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
                "userImgUrl": user.profile_image
            })
            for uid in log_user_ids
        ])
        db.commit()
        return {
            "success": True,
            "role": {
                "id": new_role.id,
                "name": new_role.role_name,
                "permissions": new_role.permissions
            }
        }
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create role due to an internal server error.")

@app.patch("/api/community/{community_id}/roles/{role_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def update_role(request: Request,
                community_id: str,
                role_id: str,
                req: RoleRequest,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    role = db.query(CommunityRole).filter(CommunityRole.id == role_id, CommunityRole.community_id == community_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    role_name = req.name.strip()
    if len(role_name) < 1:
        raise HTTPException(status_code=400, detail="Role name must be at least 1 characters.")
    if len(role_name) > 20:
        raise HTTPException(status_code=400, detail="Role name can't be longer than 20 characters.")

    if community.owner_id != user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)

        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        role.role_name = role_name
        role.permissions = req.permissions.split("|") if req.permissions else []
        db.commit()
        return {
            "success": True,
            "role": {
                "id": role.id,
                "name": role.role_name,
                "permissions": role.permissions
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update role due to an internal server error.")

@app.get("/api/community/{community_id}/roles", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def fetch_roles(request: Request,
                community_id: str,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db),
                ) -> Dict[str, Any]:
    
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")
    
    if community.owner_id != user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for role in community_member_roles:
            all_permissions.extend(role.permissions)

        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    community_roles = db.query(CommunityRole).filter(
        CommunityRole.community_id == community.id
    ).all()

    return {
        "success": True,
        "roles": [
            {
                "id": role.id,
                "name": role.role_name,
                "permissions": role.permissions,
            } for role in community_roles
        ]
    }

@app.delete("/api/community/{community_id}/roles/{role_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def delete_role(request: Request,
                community_id: str,
                role_id: str,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    role = db.query(CommunityRole).filter(CommunityRole.id == role_id, CommunityRole.community_id == community_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    if community.owner_id != user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)

        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        db.query(MemberRole).filter(MemberRole.role_id == role.id).delete()
        new_log = CommunityLog(
            log=f"{user.username} deleted the role {role.role_name}",
            community_id=community.id,
            user_id=user.id
        )
        db.add(new_log)
        db.flush()
        db.refresh(new_log)

        members_with_log_permission = db.query(CommunityMember).join(
            MemberRole, MemberRole.member_id == CommunityMember.id
        ).join(
            CommunityRole, CommunityRole.id == MemberRole.role_id
        ).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user.id,
            or_(
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.VIEW_LOGS}%'),
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
            )
        ).all()
        log_user_ids = {m.user_id for m in members_with_log_permission}
        log_user_ids.add(community.owner_id)
        if user.id != community.owner_id:
            log_user_ids.discard(user.id)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newLog",
                "log": new_log.log,
                "description": "",
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
                "userImgUrl": user.profile_image
            })
            for uid in log_user_ids
        ])
        db.delete(role)
        db.commit()
        return {
            "success": True,
            "id": role.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete role due to an internal server error.")

@app.delete("/api/community/{community_id}/members/{member_id}/kick", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def kick_member_from_community(request: Request,
                               community_id: str,
                               member_id: str,
                               reason: str = Body(default="No Reason", embed=True),
                               current_user_id: str = Depends(get_user_id_from_token),
                               db: Session = Depends(get_db)
                               ) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user_to_kick = db.query(User).filter(User.id == member_id).first()
    if not user_to_kick:
        raise HTTPException(status_code=404, detail="User to kick not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    community_member_to_kick = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user_to_kick.id).first()
    if not community_member_to_kick:
        raise HTTPException(status_code=404, detail="Member not found in this community.")

    if len(reason) > 100:
        raise HTTPException(status_code=400, detail=f"Reason exceeds maximum length: {len(reason)} characters provided, but limit is 100.")

    if community.owner_id == user_to_kick.id:
        raise HTTPException(status_code=404, detail="you cant kick the owner")

    if community.owner_id != user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community.id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)
        
        if PERMISSIONS.KICK not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        db.query(CommunityMember).filter(CommunityMember.id == community_member_to_kick.id).delete()
        await manager.broadcast_to_user(community_member_to_kick.user_id, {
            "type": "memberKicked",
            "id": community.id,
        })
        new_log = CommunityLog(
            log=f"{community_member.user.username} kicked {community_member_to_kick.user.username}",
            description=f"With reason: {reason}",
            community_id=community_member_to_kick.community_id,
            user_id=user.id,
        )
        db.add(new_log)
        db.flush()
        db.refresh(new_log)

        members_with_log_permission = db.query(CommunityMember).join(
            MemberRole, MemberRole.member_id == CommunityMember.id
        ).join(
            CommunityRole, CommunityRole.id == MemberRole.role_id
        ).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user.id,
            or_(
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.VIEW_LOGS}%'),
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
            )
        ).all()
        log_user_ids = {m.user_id for m in members_with_log_permission}
        log_user_ids.add(community.owner_id)
        if user.id != community.owner_id:
            log_user_ids.discard(user.id)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newLog",
                "log": new_log.log,
                "description": f"With reason: {reason}",
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
                "userImgUrl": user.profile_image
            })
            for uid in log_user_ids
        ])
        db.commit()
        return {
            "success": True,
            "message": "user kicked successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete role due to an internal server error.")

@app.get("/api/community/{community_id}/logs", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def fetch_logs(request: Request,
               community_id: str,
               current_user_id: str = Depends(get_user_id_from_token),
               db: Session = Depends(get_db)
               ) -> Dict[str, Any]:
    
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")
    
    if community.owner_id != user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community.id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)
        
        if PERMISSIONS.VIEW_LOGS not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    community_logs = db.query(CommunityLog).filter(
        CommunityLog.community_id == community.id
    ).all()

    return {
        "success": True,
        "logs": [
            {
                "log": log.log,
                "description": log.description,
                "createdAt": log.created_at.strftime("%D %H:%M"),
                "userImgUrl": log.user.profile_image,
            } for log in community_logs
        ]
    }

# if os.path.exists("dist/assets"):
#     app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# @app.get("/", response_class=HTMLResponse)
# @app.get("/{full_path:path}", response_class=HTMLResponse)
# def serve_app(request: Request, full_path: str = ""):
#     nonce = secrets.token_urlsafe(16)
    
#     html_path = "dist/index.html"
#     if not os.path.exists(html_path):
#         return HTMLResponse(
#             content="<h1>Error: React build not found</h1><p>Run 'npm run build' first</p>",
#             status_code=500
#         )
    
#     context = {
#         "request": request,
#         "nonce": nonce,
#         "api_endpoint": API_ENDPOINT,
#         "gateway_endpoint": GATEWAY_ENDPOINT,
#         "build_number": BUILD_NUMBER,
#         "environment": ENVIRONMENT,
#     }
    
#     response = templates.TemplateResponse("index.html", context)
    
#     csp = (
#         f"default-src 'self'; "
#         f"script-src 'nonce-{nonce}' https://cdn.tailwindcss.com https://cdn.jsdelivr.net 'self' https:; "
#         f"style-src 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; "
#         f"font-src https://fonts.gstatic.com; "
#         f"connect-src * data:; "
#         f"img-src 'self' data: https:; "
#         f"media-src 'self' https:;"
#     )
#     response.headers["Content-Security-Policy"] = csp
    
#     response.headers["X-Content-Type-Options"] = "nosniff"
#     response.headers["X-Frame-Options"] = "SAMEORIGIN"
#     response.headers["X-XSS-Protection"] = "1; mode=block"
#     response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
#     return response