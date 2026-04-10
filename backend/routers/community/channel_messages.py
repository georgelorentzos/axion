from fastapi import APIRouter, HTTPException, Depends, Request, Query
from schemas.message import MessageRequest
from utils.database import get_db
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from models import User, Community, CommunityMember, CommunityChannel, ChannelMessage
from utils.websocket_manager import manager
from dependencies import limiter, get_user_id_from_token
from datetime import datetime
from typing import Dict, Any
import asyncio

router = APIRouter(prefix="/api", tags=["channel_messages"])

@router.get("/community/{community_id}/channels/{channel_id}/messages", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def fetch_channel_messages(
    request: Request,
    community_id: str,
    channel_id: str,
    limit: int = Query(50, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    current_user = db.query(User).filter(
        User.id == current_user_id
    ).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    community_member = db.query(CommunityMember).filter(
        CommunityMember.user_id == current_user.id,
        CommunityMember.community_id == community.id
    ).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")
    
    channel = db.query(CommunityChannel).filter(
        CommunityChannel.community_id == community.id,
        CommunityChannel.id == channel_id
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found.")
    
    total_count = db.query(ChannelMessage).filter(
        ChannelMessage.community_id == community.id,
        ChannelMessage.channel_id == channel.id
    ).count()

    messages = db.query(ChannelMessage).filter(
        ChannelMessage.community_id == community.id,
        ChannelMessage.channel_id == channel.id
    ).order_by(ChannelMessage.created_at.desc()).offset(offset).limit(limit).all()

    messages.reverse()

    messages_list = [
        {
            "id": message.id,
            "senderId": message.sender_id,
            "channelId": message.channel_id,
            "message": message.message,
            "isEdited": message.is_edited,
            "createdAt": message.created_at.strftime("%H:%M"),
            "senderUsername": message.sender.username,
            "senderImage": message.sender.profile_image,
            "replyToId": message.reply_to_id,
            "replyToUsername": message.reply_to.sender.username if message.reply_to else None,
            "replyToImage": message.reply_to.sender.profile_image if message.reply_to else None,
            "replyToMessage": message.reply_to.message if message.reply_to else None,
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

@router.post("/community/{community_id}/channels/{channel_id}/messages", status_code=200)
@limiter.limit("120/minute")
async def send_channel_message(
    request: Request,
    community_id: str,
    channel_id: str,
    req: MessageRequest,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, bool]:
    current_user = db.query(User).filter(
        User.id == current_user_id
    ).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    community_member = db.query(CommunityMember).filter(
        CommunityMember.user_id == current_user.id
    ).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found")
    
    channel = db.query(CommunityChannel).filter(
        CommunityChannel.community_id == community.id,
        CommunityChannel.id == channel_id
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found.")
    
    try:
        new_message = ChannelMessage(
            sender_id=community_member.user_id,
            channel_id=channel.id,
            community_id=community.id,
            message=req.message,
            reply_to_id=req.reply_to_id,
        )
        db.add(new_message)
        db.commit()

        community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id
        ).all()

        await asyncio.gather(*[
            manager.broadcast_to_user(community_member.user_id, {
                "type": "newChannelMessage",
                "id": new_message.id,
                "senderId": current_user.id,
                "channelId": new_message.channel_id,
                "message": req.message,
                "createdAt": datetime.now().strftime("%H:%M"),
                "senderUsername": new_message.sender.username,
                "senderImage": new_message.sender.profile_image,
                "replyToId": new_message.reply_to_id,
                "replyToUsername": new_message.reply_to.sender.username if new_message.reply_to else None,
                "replyToImage": new_message.reply_to.sender.profile_image if new_message.reply_to else None,
                "replyToMessage": new_message.reply_to.message if new_message.reply_to else None,
            })
            for community_member in community_members
        ])
        return {
            "success": True
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send message in channel due to internal server error.")

    
@router.delete("/community/{community_id}/channels/{channel_id}/messages/{message_id}", status_code=200)
@limiter.limit("120/minute")
async def delete_channel_message(
    request: Request,
    community_id: str,
    channel_id: str,
    message_id: str,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, bool]:
    current_user = db.query(User).filter(
        User.id == current_user_id
    ).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Detail user not found.")
    
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    channel = db.query(CommunityChannel).filter(
        CommunityChannel.community_id == community.id,
        CommunityChannel.id == channel_id
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found.")
    
    message = db.query(ChannelMessage).filter(
        ChannelMessage.channel_id == channel.id,
        ChannelMessage.id == message_id
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")
    
    if current_user.id != message.sender.id:
        raise HTTPException(status_code=403, detail="You cant delete messages from another user.")

    message_id_to_return = message.id

    try:
        db.delete(message)
        db.commit()

        community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(community_member.user_id, {
                "type": "channelMessageDeleted",
                "id": message_id_to_return
            })
            for community_member in community_members
        ])
        return {
            "success": True
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete message due to internal server error.")

@router.patch("/community/{community_id}/channels/{channel_id}/messages/{message_id}", status_code=200)
@limiter.limit("120/minute")
async def edit_channel_message(
    request: Request,
    community_id: str,
    channel_id: str,
    message_id: str,
    req: MessageRequest,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, bool]:
    current_user = db.query(User).filter(
        User.id == current_user_id
    ).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="Detail user not found.")
    
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    channel = db.query(CommunityChannel).filter(
        CommunityChannel.community_id == community.id,
        CommunityChannel.id == channel_id
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found.")
    
    message = db.query(ChannelMessage).filter(
        ChannelMessage.channel_id == channel.id,
        ChannelMessage.id == message_id
    ).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")
    
    if current_user.id != message.sender.id:
        raise HTTPException(status_code=403, detail="You cant delete messages from another user.")

    try:
        message.message = req.message
        message.is_edited = True
        db.commit()

        community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(community_member.user_id, {
                "type": "channelMessageEdited",
                "id": message.id,
                "message": message.message,
                "isEdited": message.is_edited,
            })
            for community_member in community_members
        ])
        return {
            "success": True
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to edit message due to internal server error.")
