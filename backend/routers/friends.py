from fastapi import APIRouter, HTTPException, Depends, Request
from schemas.friend import AllyRequest
from utils.database import get_db
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from models import User, Friend
from utils.websocket_manager import manager
from dependencies import limiter, get_user_id_from_token
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["friends"])

@router.post('/ally', status_code=200)
@limiter.limit('220/minute')
async def ally(
    request: Request,
    req: AllyRequest,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    if req.requester_id != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot send as another user.")

    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself.")

    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    addressee = db.query(User).filter(User.id == req.addressee_id).first()
    if not addressee:
        raise HTTPException(status_code=404, detail="Addressee not found.")

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
                "success": True
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
            "username": current_user.username,
            "image": current_user.profile_image,
            "createdAt": current_user.created_at.year
        })

        return {
            "success": True
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send request.")

@router.delete('/ally/cancel', status_code=200)
@limiter.limit('220/minute')
async def cancel_ally(
    request: Request,
    req: AllyRequest,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    if req.requester_id != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot cancel as another user.")

    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot cancel yourself.")

    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if not db.query(User).filter(User.id == req.addressee_id).first():
        raise HTTPException(status_code=404, detail="Addressee not found.")

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
                "username": current_user.username,
                "image": current_user.profile_image
            })

            return {
                "success": True
            }
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to cancel request.")
    else:
        return {
            "success": True
        }

@router.delete("/ally/reject", status_code=200)
@limiter.limit('220/minute')
async def ally_reject(
    request: Request,
    req: AllyRequest,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = db.query(Friend).filter(
        Friend.addressee_id == current_user_id,
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
            "addresseeId": current_user_id
        })

        return {
            "success": True
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to reject ally.")

@router.post('/ally/accept', status_code=200)
@limiter.limit('220/minute')
async def ally_accept(
    request: Request,
    req: AllyRequest,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = db.query(Friend).filter(
        Friend.addressee_id == current_user_id,
        Friend.requester_id == req.requester_id,
        Friend.status == "pending"
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Friend request not found.")

    requester = db.query(User).filter(User.id == req.requester_id).first()
    if not requester:
        raise HTTPException(status_code=404, detail="Requester not found.")

    try:
        existing.status = "friends"
        db.commit()

        await manager.broadcast_to_user(current_user_id, {
            "type": "allyAcceptRequest",
            "id": req.requester_id,
            "username": requester.username,
            "image": requester.profile_image,
            "isOnline": requester.is_online,
            "createdAt": requester.created_at.year
        })

        await manager.broadcast_to_user(req.requester_id, {
            "type": "allyAcceptRequest",
            "id": current_user_id,
            "username": current_user.username,
            "image": current_user.profile_image,
            "isOnline": current_user.is_online,
            "createdAt": current_user.created_at.year
        })

        return {
            "success": True
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to accept friend request.")

@router.get('/my/ally/requests', status_code=200)
@limiter.limit('220/minute')
def my_ally_requests(
    request: Request,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    pending_requests = db.query(Friend).filter(
        and_(Friend.requester_id == current_user.id, Friend.status == "pending")
    ).all()

    return {
        "success": True,
        "pending": [
            {
                "id": req.addressee_id,
                "requesterName": req.requester.username,
                "requesterImage": req.requester.profile_image
            } for req in pending_requests
        ]
    }

@router.get('/my/pending', status_code=200)
@limiter.limit('220/minute')
def get_pending(
    request: Request,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    pending_requests = db.query(Friend).filter(
        and_(Friend.addressee_id == current_user.id, Friend.status == "pending")
    ).all()

    return {
        "success": True,
        "pending": [
            {
                "id": req.requester.id,
                "username": req.requester.username,
                "image": req.requester.profile_image,
                "isOnline": req.requester.is_online,
                "createdAt": req.created_at.year
            } for req in pending_requests
        ]
    }

@router.get('/my/friends/all', status_code=200)
@limiter.limit('220/minute')
def my_friends_all(
    request: Request,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    friends = db.query(Friend, User).join(
        User,
        or_(
            and_(Friend.requester_id == current_user.id, Friend.addressee_id == User.id),
            and_(Friend.addressee_id == current_user.id, Friend.requester_id == User.id)
        )
    ).filter(
        or_(Friend.addressee_id == current_user.id, Friend.requester_id == current_user.id),
        Friend.status == "friends",
        User.id != current_user_id
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

@router.get('/my/friends/online', status_code=200)
@limiter.limit('220/minute')
def my_friends_online(
    request: Request,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    friends = db.query(Friend, User).join(
        User,
        or_(
            and_(Friend.requester_id == current_user.id, Friend.addressee_id == User.id),
            and_(Friend.addressee_id == current_user.id, Friend.requester_id == User.id)
        )
    ).filter(
        or_(Friend.addressee_id == current_user.id, Friend.requester_id == current_user.id),
        Friend.status == "friends",
        User.is_online == True,
        User.id != current_user_id
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

@router.delete('/ally/remove', status_code=200)
@limiter.limit('220/minute')
async def ally_remove(
    request: Request,
    req: AllyRequest,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> dict[str, Any]:
    if req.requester_id != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot remove as another user.")

    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself.")

    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    addressee = db.query(User).filter(User.id == req.addressee_id).first()
    if not addressee:
        raise HTTPException(status_code=404, detail="Addressee not found.")

    existing = db.query(Friend).filter(
        ((Friend.requester_id == req.requester_id) & (Friend.addressee_id == req.addressee_id)) |
        ((Friend.requester_id == req.addressee_id) & (Friend.addressee_id == req.requester_id)),
        Friend.status == "friends"
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Friendship not found.")

    try:
        db.delete(existing)
        db.commit()

        await manager.broadcast_to_user(req.addressee_id, {
            "type": "allyRemoved",
            "id": req.requester_id,
            "username": current_user.username,
            "image": current_user.profile_image
        })

        await manager.broadcast_to_user(current_user_id, {
            "type": "allyRemoved",
            "id": req.addressee_id,
            "username": addressee.username,
            "image": addressee.profile_image
        })

        return {
            "success": True
        }
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to remove friend.")