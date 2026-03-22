from fastapi import APIRouter, HTTPException, Depends, Request, Query
from schemas.message import MessageRequest
from utils.database import get_db
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from models import User, DirectMessage, ConversationHistory
from utils.websocket_manager import manager
from dependencies import limiter, get_user_id_from_token
from datetime import datetime
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["messages"])

@router.post('/send/message', response_model=Dict[str, Any])
@limiter.limit("220/minute")
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

        return {
            "success": True,
            "message": "Message send successfuly!"
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send message.")

@router.get('/messages/{user_id}', response_model=Dict[str, Any])
@limiter.limit("220/minute")
def get_messages(
    request: Request,
    user_id: str,
    limit: int = Query(50, ge=1, le=50),
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

@router.get('/my/conversations', response_model=Dict[str, Any])
@limiter.limit('220/minute')
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

@router.delete('/conversation/{user_id}', response_model=Dict[str, Any])
@limiter.limit('220/minute')
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
