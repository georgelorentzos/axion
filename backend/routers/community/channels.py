from fastapi import APIRouter, HTTPException, Depends, Request
from schemas.community.channel import CreateChannel
from utils.database import get_db
from sqlalchemy.orm import Session
from models import User, Community, CommunityMember, CommunityCategory, CommunityRole, MemberRole, CommunityChannel
from dependencies import limiter, get_user_id_from_token
from typing import Dict, Any
from constants.permissions import PERMISSIONS
from constants.channel_types import CHANNEL_TYPES
import asyncio
from utils.websocket_manager import manager

router = APIRouter(prefix="/api", tags=["channels"])

@router.get("/community/{community_id}/channels", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def fetch_channels(
    request: Request,
    community_id: str,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    user = db.query(User).filter(
        User.id == current_user_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    community_member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == user.id
    ).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")
    
    community_channels = db.query(CommunityChannel).filter(
        CommunityChannel.community_id == community.id
    ).all()

    return {
        "success": True,
        "channels": [
            {
                "id": community_channel.id,
                "name": community_channel.channel_name,
                "categoryId": community_channel.category_id
            } for community_channel in community_channels
        ]
    }

@router.post("/community/{community_id}/channels", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def create_channel(
    request: Request,
    community_id: str,
    req: CreateChannel,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    user = db.query(User).filter(
        User.id == current_user_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    community_member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == user.id
    ).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    try:
        new_channel = CommunityChannel(
            channel_name=req.channel_name,
            type=CHANNEL_TYPES.TEXT,
            community_id=community.id,
            category_id=req.category_id
        )
        db.add(new_channel)
        community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id != user.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(community_member.user_id, {
                "type": "channelCreated",
                "id": new_channel.id,
                "name": new_channel.channel_name,
                "categoryId": new_channel.category_id
            })
            for community_member in community_members
        ])
        db.commit()
        return {
            "success": True,
            "id": new_channel.id,
            "name": new_channel.channel_name,
            "categoryId": new_channel.category_id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create channel due to internal server error.")
    
@router.delete("/community/{community_id}/channels/{channel_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def delete_channel(
    request: Request,
    community_id: str,
    channel_id: str,
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    user = db.query(User).filter(
        User.id == current_user_id
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    community = db.query(Community).filter(
        Community.id == community_id
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")
    
    community_member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == user.id
    ).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")
    
    if community_member.user_id != community.owner_id:
        member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = {p for role in member_roles for p in role.permissions}

        if not (PERMISSIONS.ADMINISTRATOR in all_permissions or PERMISSIONS.MANAGE_CHANNELS in all_permissions):
            raise HTTPException(status_code=403, detail="You don't have permissions.")
    
    community_channel = db.query(CommunityChannel).filter(
        CommunityChannel.community_id == community_id,
        CommunityChannel.id == channel_id
    ).first()
    if not community_channel:
        raise HTTPException(status_code=404, detail="Channel not found.")

    channel_id_to_return = community_channel.id

    try:
        db.delete(community_channel)
        db.flush()
        community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id != user.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(m.user_id, {
                "type": "channelDeleted",
                "id": channel_id_to_return,
            })
            for m in community_members
        ])
        db.commit()
        return {
            "success": True,
            "id": channel_id_to_return,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete channel due to internal server error.")