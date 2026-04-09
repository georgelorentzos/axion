from fastapi import APIRouter, HTTPException, Depends, Request
from utils.database import get_db
from sqlalchemy.orm import Session
from models import User, Community, CommunityMember, CommunityRole, MemberRole, CommunityLog
from dependencies import limiter, get_user_id_from_token
from constants.permissions import PERMISSIONS
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["logs"])

@router.get("/community/{community_id}/logs", response_model=Dict[str, Any])
@limiter.limit("220/minute")
def fetch_logs(request: Request,
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
