from fastapi import APIRouter, HTTPException, Depends, Request, Body
from utils.database import get_db
from sqlalchemy import or_, cast, String
from sqlalchemy.orm import Session, joinedload
from models import (User, Community, CommunityMember, CommunityRole, MemberRole,
                    CommunityLog, CommunityBan)
from utils.websocket_manager import manager
from dependencies import limiter, get_user_id_from_token
from constants.permissions import PERMISSIONS
from typing import Dict, Any
import asyncio

router = APIRouter(prefix="/api", tags=["members"])

@router.get("/community/{community_id}/members", response_model=Dict[str, Any])
@limiter.limit("220/minute")
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
    ).options(
        joinedload(CommunityMember.user),
        joinedload(CommunityMember.member_roles).joinedload(MemberRole.role)
    )

    return {
        "success": True,
        "members": [
            {
                "id": community_member.user_id,
                "username": community_member.user.username,
                "image": community_member.user.profile_image,
                "isOnline": community_member.user.is_online,
                "createdAt": community_member.user.created_at.year,
                "roles": [
                    {
                        "id": member_role.role.id,
                        "name": member_role.role.role_name,
                    } for member_role in community_member.member_roles
                ]
            } for community_member in community_members
        ]
    }

@router.delete("/community/{community_id}/members/{member_id}/kick", response_model=Dict[str, Any])
@limiter.limit("220/minute")
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
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user_to_kick.id,
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "userLeft",
                "memberId": user_to_kick.id,
            })
            for member in members_to_notify
        ])
        new_log = CommunityLog(
            log=f"{community_member.user.username} kicked {community_member_to_kick.user.username}",
            description=f"{reason}",
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
                "description": f"{reason}",
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
        raise HTTPException(status_code=500, detail="Failed to kick user due to an internal server error.")

@router.delete("/community/{community_id}/members/{member_id}/ban", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def ban_member_from_community(request: Request,
                               community_id: str,
                               member_id: str,
                               reason: str = Body(default="No Reason", embed=True),
                               current_user_id: str = Depends(get_user_id_from_token),
                               db: Session = Depends(get_db)
                               ) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user_to_ban = db.query(User).filter(User.id == member_id).first()
    if not user_to_ban:
        raise HTTPException(status_code=404, detail="User to ban not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    community_member_to_ban = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == user_to_ban.id).first()
    if not community_member_to_ban:
        raise HTTPException(status_code=404, detail="Member not found in this community.")

    existing_ban = db.query(CommunityBan).filter(
        CommunityBan.user_id == user_to_ban.id,
        CommunityBan.community_id == community_id
    ).first()
    if existing_ban:
        raise HTTPException(status_code=400, detail="User is already banned from this community.")

    if len(reason) > 100:
        raise HTTPException(status_code=400, detail=f"Reason exceeds maximum length: {len(reason)} characters provided, but limit is 100.")

    if community.owner_id == user_to_ban.id:
        raise HTTPException(status_code=404, detail="you cant ban the owner")

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

        if PERMISSIONS.BAN not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        db.query(CommunityMember).filter(CommunityMember.id == community_member_to_ban.id).delete()
        await manager.broadcast_to_user(community_member_to_ban.user_id, {
            "type": "memberBanned",
            "id": community.id,
        })
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user_to_ban.id,
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "userLeft",
                "memberId": user_to_ban.id,
            })
            for member in members_to_notify
        ])
        new_log = CommunityLog(
            log=f"{community_member.user.username} banned {community_member_to_ban.user.username}",
            description=f"{reason}",
            community_id=community_member_to_ban.community_id,
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
        members_with_ban_permission = db.query(CommunityMember).join(
            MemberRole, MemberRole.member_id == CommunityMember.id
        ).join(
            CommunityRole, CommunityRole.id == MemberRole.role_id
        ).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != user.id,
            or_(
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.BAN}%'),
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
            )
        ).all()

        log_user_ids = {m.user_id for m in members_with_log_permission}
        log_user_ids.add(community.owner_id)
        ban_users_ids = {m.user_id for m in members_with_ban_permission}
        ban_users_ids.add(community.owner_id)

        if user.id != community.owner_id:
            log_user_ids.discard(user.id)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newLog",
                "log": new_log.log,
                "description": f"{reason}",
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
                "userImgUrl": user.profile_image
            })
            for uid in log_user_ids
        ])
        new_ban = CommunityBan(
            log=f"{community_member.user.username} banned {community_member_to_ban.user.username}",
            reason=f"{reason}",
            user_id=user_to_ban.id,
            community_id=community.id
        )
        db.add(new_ban)
        db.flush()
        db.refresh(new_ban)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newBan",
                "id": user_to_ban.id,
                "username": user_to_ban.username,
                "description": f"{reason}",
                "createdAt": new_ban.created_at.strftime("%D %H:%M"),
                "userImgUrl": user_to_ban.profile_image
            })
            for uid in ban_users_ids
        ])
        db.commit()
        return {
            "success": True,
            "message": "user banned successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to ban user due to an internal server error.")
