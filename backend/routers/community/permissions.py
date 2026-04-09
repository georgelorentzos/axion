from fastapi import APIRouter, HTTPException, Depends, Request
from utils.database import get_db
from sqlalchemy.orm import Session
from models import (User, Community, CommunityMember, CommunityRole, MemberRole)
from utils.websocket_manager import manager
from dependencies import limiter, get_user_id_from_token, UPLOADS_FOLDER
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["permissions"])

@router.get("/community/{community_id}/permissions", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def fetch_current_user_permissions(
    request: Request,
    community_id: str,
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
        CommunityMember.community_id == community.id,
        CommunityMember.user_id == current_user.id
    ).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    member_roles = db.query(CommunityRole).join(
    MemberRole, MemberRole.role_id == CommunityRole.id
    ).filter(
        MemberRole.member_id == community_member.id
    ).all()

    all_permissions = set()
    for role in member_roles:
        all_permissions.update(role.permissions)

    return {
        "success": True,
        "community_id": community.id,
        "user_id": current_user.id,
        "permissions": list(all_permissions)
    }