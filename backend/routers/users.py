from fastapi import APIRouter, HTTPException, Depends, Request, Query
from utils.database import get_db
from sqlalchemy.orm import Session
from models import User
from dependencies import limiter, get_user_id_from_token
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["users"])

@router.get('/me', response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def get_current_user(request: Request, current_user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=401, detail="User not found.")

    return {
        "success": True,
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "image": current_user.profile_image
    }

@router.get('/users/search', response_model=Dict[str, Any])
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

@router.get('/users/{user_id}', response_model=Dict[str, Any])
@limiter.limit('220/minute')
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
