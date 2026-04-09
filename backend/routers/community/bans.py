from fastapi import APIRouter, HTTPException, Depends, Request
from utils.database import get_db
from sqlalchemy.orm import Session
from models import User, Community, CommunityMember, CommunityRole, MemberRole, CommunityBan
from dependencies import limiter, get_user_id_from_token
from constants.permissions import PERMISSIONS
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["bans"])

@router.get("/community/{community_id}/bans", response_model=Dict[str, Any])
@limiter.limit("220/minute")
def fetch_bans(request: Request,
               community_id: str,
               current_user_id: str = Depends(get_user_id_from_token),
               db: Session = Depends(get_db)
               ) -> Dict[str, Any]:

    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == current_user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    if community.owner_id != current_user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community.id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)

        if PERMISSIONS.BAN not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    community_bans = db.query(CommunityBan).filter(
        CommunityBan.community_id == community.id
    ).all()

    return {
        "success": True,
        "bans": [
            {
                "id": ban.user.id,
                "username": ban.user.username,
                "description": ban.reason,
                "createdAt": ban.created_at.strftime("%D %H:%M"),
                "userImgUrl": ban.user.profile_image,
            } for ban in community_bans
        ]
    }

@router.delete("/community/{community_id}/bans/{user_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
def unban_community_member(
    request: Request,
    community_id: str,
    user_id: str,
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

    user_to_unban = db.query(User).filter(
        User.id == user_id
    ).first()
    if not user_to_unban:
        raise HTTPException(status_code=404, detail="User not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == current_user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    community_member_to_unban = db.query(CommunityBan).filter(CommunityBan.community_id == community_id, CommunityBan.user_id == user_to_unban.id).first()
    if not community_member_to_unban:
        raise HTTPException(status_code=404, detail="Member not found in community bans.")

    if community.owner_id != current_user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community.id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)

        if PERMISSIONS.BAN not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        db.query(CommunityBan).filter(
            CommunityBan.community_id == community.id,
            CommunityBan.user_id == user_to_unban.id
        ).delete()
        db.commit()
        return {
            "success": True,
            "id": user_to_unban.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to unban user due to an internal server error.")
