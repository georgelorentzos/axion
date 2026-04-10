from fastapi import APIRouter, HTTPException, Depends, Request
from schemas.community.role import RoleRequest
from utils.database import get_db
from sqlalchemy import or_, cast, String
from sqlalchemy.orm import Session
from models import User, Community, CommunityMember, CommunityRole, MemberRole, CommunityLog
from utils.websocket_manager import manager
from dependencies import limiter, get_user_id_from_token
from constants.permissions import PERMISSIONS
from typing import Dict, Any
import asyncio

router = APIRouter(prefix="/api", tags=["roles"])

@router.post("/community/{community_id}/roles", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def create_role(request: Request,
                community_id: str,
                req: RoleRequest,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db)) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == current_user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    role_name = req.name.strip()
    if len(role_name) < 1:
        raise HTTPException(status_code=400, detail="Role name must be at least 1 characters.")
    if len(role_name) > 20:
        raise HTTPException(status_code=400, detail="Role name can't be longer than 20 characters.")

    if community.owner_id != current_user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for role in community_member_roles:
            all_permissions.extend(role.permissions)

        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        new_role = CommunityRole(
            role_name=role_name,
            color=req.color,
            permissions=req.permissions.split("|") if req.permissions else [],
            community_id=community.id,
        )
        db.add(new_role)
        db.flush()
        new_log = CommunityLog(
            log=f"{current_user.username} created the role {new_role.role_name}",
            description=f"{', '.join(req.permissions.split('|'))}" if req.permissions else "",
            community_id=community.id,
            user_id=current_user.id
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
            CommunityMember.user_id != current_user.id,
            or_(
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.VIEW_LOGS}%'),
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
            )
        ).all()
        log_user_ids = {m.user_id for m in members_with_log_permission}
        log_user_ids.add(community.owner_id)
        if current_user.id != community.owner_id:
            log_user_ids.discard(current_user.id)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newLog",
                "log": new_log.log,
                "description": f"{', '.join(req.permissions.split('|'))}" if req.permissions else "",
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
                "userImgUrl": current_user.profile_image
            })
            for uid in log_user_ids
        ])

        all_community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != current_user.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(m.user_id, {
                "type": "roleCreated",
                "role": {
                    "id": new_role.id,
                    "name": new_role.role_name,
                    "color": new_role.color,
                    "permissions": new_role.permissions
                }
            })
            for m in all_community_members
        ])

        db.commit()
        return {
            "success": True,
            "role": {
                "id": new_role.id,
                "name": new_role.role_name,
                "color": new_role.color,
                "permissions": new_role.permissions
            }
        }
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create role due to an internal server error.")

@router.patch("/community/{community_id}/roles/{role_id}", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def update_role(request: Request,
                community_id: str,
                role_id: str,
                req: RoleRequest,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db)) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == current_user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    role = db.query(CommunityRole).filter(CommunityRole.id == role_id, CommunityRole.community_id == community_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    role_name = req.name.strip()
    if len(role_name) < 1:
        raise HTTPException(status_code=400, detail="Role name must be at least 1 characters.")
    if len(role_name) > 20:
        raise HTTPException(status_code=400, detail="Role name can't be longer than 20 characters.")

    if community.owner_id != current_user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)

        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        role.role_name = role_name
        role.color = req.color
        role.permissions = req.permissions.split("|") if req.permissions else []

        all_community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != current_user.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(m.user_id, {
                "type": "roleUpdated",
                "role": {
                    "id": role.id,
                    "name": role.role_name,
                    "color": role.color,
                    "permissions": role.permissions
                }
            })
            for m in all_community_members
        ])

        affected_members = db.query(CommunityMember).join(
            MemberRole, MemberRole.member_id == CommunityMember.id
        ).filter(
            MemberRole.role_id == role.id
        ).all()

        for affected in affected_members:
            member_roles = db.query(CommunityRole).join(
                MemberRole, MemberRole.role_id == CommunityRole.id
            ).filter(
                MemberRole.member_id == affected.id
            ).all()
            updated_permissions = set()
            for r in member_roles:
                updated_permissions.update(r.permissions)
            await manager.broadcast_to_user(affected.user_id, {
                "type": "permissionsUpdated",
                "communityId": community_id,
                "permissions": list(updated_permissions),
            })

        db.commit()
        return {
            "success": True,
            "role": {
                "id": role.id,
                "name": role.role_name,
                "color": role.color,
                "permissions": role.permissions
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update role due to an internal server error.")

@router.get("/community/{community_id}/roles", response_model=Dict[str, Any])
@limiter.limit("220/minute")
def fetch_roles(request: Request,
                community_id: str,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db),
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

    community_roles = db.query(CommunityRole).filter(
        CommunityRole.community_id == community.id
    ).all()

    return {
        "success": True,
        "roles": [
            {
                "id": role.id,
                "name": role.role_name,
                "color": role.color,
                "permissions": role.permissions,
            } for role in community_roles
        ]
    }

@router.delete("/community/{community_id}/roles/{role_id}", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def delete_role(request: Request,
                community_id: str,
                role_id: str,
                current_user_id: str = Depends(get_user_id_from_token),
                db: Session = Depends(get_db)) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    community_member = db.query(CommunityMember).filter(CommunityMember.community_id == community_id, CommunityMember.user_id == current_user.id).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Community member not found.")

    role = db.query(CommunityRole).filter(CommunityRole.id == role_id, CommunityRole.community_id == community_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    if community.owner_id != current_user.id:
        community_member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == community_member.id
        ).all()

        all_permissions = []
        for r in community_member_roles:
            all_permissions.extend(r.permissions)

        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        affected_members = db.query(CommunityMember).join(
            MemberRole, MemberRole.member_id == CommunityMember.id
        ).filter(
            MemberRole.role_id == role.id
        ).all()
        affected_member_ids = [(m.id, m.user_id) for m in affected_members]

        db.query(MemberRole).filter(MemberRole.role_id == role.id).delete()
        new_log = CommunityLog(
            log=f"{current_user.username} deleted the role {role.role_name}",
            community_id=community.id,
            user_id=current_user.id
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
            CommunityMember.user_id != current_user.id,
            or_(
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.VIEW_LOGS}%'),
                cast(CommunityRole.permissions, String).like(f'%{PERMISSIONS.ADMINISTRATOR}%')
            )
        ).all()
        log_user_ids = {m.user_id for m in members_with_log_permission}
        log_user_ids.add(community.owner_id)
        if current_user.id != community.owner_id:
            log_user_ids.discard(current_user.id)
        await asyncio.gather(*[
            manager.broadcast_to_user(uid, {
                "type": "newLog",
                "log": new_log.log,
                "description": "",
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
                "userImgUrl": current_user.profile_image
            })
            for uid in log_user_ids
        ])

        all_community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != current_user.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(m.user_id, {
                "type": "roleDeleted",
                "id": role.id
            })
            for m in all_community_members
        ])

        for member_id, member_user_id in affected_member_ids:
            remaining_roles = db.query(CommunityRole).join(
                MemberRole, MemberRole.role_id == CommunityRole.id
            ).filter(
                MemberRole.member_id == member_id
            ).all()
            updated_permissions = set()
            for r in remaining_roles:
                updated_permissions.update(r.permissions)
            await manager.broadcast_to_user(member_user_id, {
                "type": "permissionsUpdated",
                "communityId": community_id,
                "permissions": list(updated_permissions),
            })

        db.delete(role)
        db.commit()
        return {
            "success": True,
            "id": role.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete role due to an internal server error.")

@router.patch("/community/{community_id}/members/{user_id}/roles/{role_id}", response_model=Dict[str, Any])
@limiter.limit("120/minute")
async def toggle_role(
    request: Request,
    community_id: str,
    user_id: str,
    role_id: str,
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
        CommunityMember.user_id == user_id,
        CommunityMember.community_id == community_id
    ).first()
    if not community_member:
        raise HTTPException(status_code=404, detail="Member not found.")
    
    community_role = db.query(CommunityRole).filter(
        CommunityRole.id == role_id,
        CommunityRole.community_id == community_id
    ).first()
    if not community_role:
        raise HTTPException(status_code=404, detail="Community role not found.")
    
    if current_user.id != community.owner_id:
        current_member = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id == current_user_id
        ).first()
        if not current_member:
            raise HTTPException(status_code=403, detail="You are not a member of this community.")

        member_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            MemberRole.member_id == current_member.id
        ).all()
                
        all_permissions = set()
        for role in member_roles:
            all_permissions.update(role.permissions)
        
        if PERMISSIONS.MANAGE_ROLES not in all_permissions and PERMISSIONS.ADMINISTRATOR not in all_permissions:
            raise HTTPException(status_code=403, detail="You don't have permissions.")

    try:
        existing = db.query(MemberRole).filter(
            MemberRole.member_id == community_member.id,
            MemberRole.role_id == community_role.id
        ).first()

        if existing:
            db.delete(existing)
            action = "removed"
        else:
            new_member_role = MemberRole(
                member_id=community_member.id,
                role_id=community_role.id
            )
            db.add(new_member_role)
            action = "added"

        db.flush()

        updated_roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            MemberRole.member_id == community_member.id
        ).all()

        updated_permissions = set()
        for r in updated_roles:
            updated_permissions.update(r.permissions)

        await manager.broadcast_to_user(community_member.user_id, {
            "type": "permissionsUpdated",
            "communityId": community_id,
            "permissions": list(updated_permissions),
        })

        updated_role_list = [
            {"id": r.id, "name": r.role_name}
            for r in updated_roles
        ]
        all_community_members = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != current_user.id
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(m.user_id, {
                "type": "memberRolesUpdated",
                "memberId": user_id,
                "roles": updated_role_list,
            })
            for m in all_community_members
        ])

        db.commit()
        return {
            "success": True,
            "action": action,
            "member_id": community_member.id,
            "role_id": community_role.id
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to manage role due to an internal server error.")