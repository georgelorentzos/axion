from fastapi import APIRouter, HTTPException, Depends, Request
from schemas.community.category import CategoryCreate
from utils.database import get_db
from sqlalchemy.orm import Session
from models import User, Community, CommunityMember, CommunityCategory, CommunityRole, MemberRole
from dependencies import limiter, get_user_id_from_token
from typing import Dict, Any
from constants.permissions import PERMISSIONS
import asyncio
from utils.websocket_manager import manager

router = APIRouter(prefix="/api", tags=["categories"])

@router.get("/community/{community_id}/categories", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def fetch_categories(
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
    
    categories = db.query(CommunityCategory).filter(
        CommunityCategory.community_id == community.id
    ).all()

    return {
        "success": True,
        "categories": [
            {
                "id": category.id,
                "name": category.category_name
            } for category in categories
        ]
    }

@router.post("/community/{community_id}/categories", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def create_category(
    request: Request,
    community_id: str,
    req: CategoryCreate,
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

        all_permissions = []
        for role in member_roles:
            all_permissions.append(role.permissions)
        
        if not (PERMISSIONS.ADMINISTRATOR in all_permissions or PERMISSIONS.MANAGE_CHANNELS in all_permissions):
            raise HTTPException(status_code=404, detail="You dont have permissions.")
        
    try:
        new_category = CommunityCategory(
            category_name=req.category_name,
            community_id=community.id
        )
        db.add(new_category)
        db.flush()
        community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id != user.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(community_member.user_id, {
                "type": "categoryCreated",
                "id": new_category.id,
                "name": new_category.category_name,
            })
            for community_member in community_members
        ])
        db.commit()
        return {
            "success": True,
            "id": new_category.id,
            "name": new_category.category_name,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to manage category due to internal server error.")
    
@router.delete("/community/{community_id}/categories/{category_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def delete_category(
    request: Request,
    community_id: str,
    category_id: str,
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

        all_permissions = []
        for role in member_roles:
            all_permissions.append(role.permissions)
        
        if not (PERMISSIONS.ADMINISTRATOR in all_permissions or PERMISSIONS.MANAGE_CHANNELS in all_permissions):
            raise HTTPException(status_code=404, detail="You dont have permissions.")
        
    try:
        existing = db.query(CommunityCategory).filter(
            CommunityCategory.id == category_id
        ).first()
        if existing:
            db.delete(existing)
            db.commit()
        return {
            "success": True
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to manage category due to internal server error.")
