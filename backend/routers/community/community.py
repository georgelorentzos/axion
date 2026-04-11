from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
from utils.database import get_db
from sqlalchemy import or_, cast, String, func
from sqlalchemy.orm import Session
from models import (User, Community, CommunityMember, CommunityCategory, CommunityChannel,
                    CommunityRole, MemberRole, CommunityLog, CommunityBan)
from utils.websocket_manager import manager
from dependencies import limiter, get_user_id_from_token, UPLOADS_FOLDER
from constants.permissions import PERMISSIONS
from typing import Dict, Any
import asyncio
import uuid
import shutil
import os
from constants.channel_types import CHANNEL_TYPES

router = APIRouter(prefix="/api", tags=["communities"])

@router.post("/community/create", response_model=Dict[str, Any])
@limiter.limit("50/minute")
def create_community(
    request: Request,
    community_name: str = Form(...),
    community_image: UploadFile | None = File(None),
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community_name = community_name.strip()
    if not community_name:
        raise HTTPException(status_code=400, detail="Community name required.")
    if len(community_name) < 4:
        raise HTTPException(status_code=400, detail="Community name must be at least 4 characters.")
    if len(community_name) > 20:
        raise HTTPException(status_code=400, detail="Community name can't be bigger than 20 characters.")

    image_path = None
    image_url: str | None = None
    if community_image and community_image.filename:
        ext = os.path.splitext(community_image.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        image_path = os.path.join(UPLOADS_FOLDER, filename)
        with open(image_path, "wb") as f:
            shutil.copyfileobj(community_image.file, f)
        base = (os.getenv("MEDIA_CDN_URL") or "/api/serve/image").rstrip("/")
        image_url = f"{base}/{filename}"
    else:
        image_url = None

    try:
        new_community = Community(
            community_name=community_name,
            community_image=image_url,
            owner_id=current_user.id,
        )
        db.add(new_community)
        db.flush()

        db.add(CommunityMember(user_id=current_user.id, community_id=new_community.id))
        new_log = CommunityLog(
            log=f"Community created by {current_user.username}",
            community_id=new_community.id,
            user_id=current_user.id
        )
        db.add(new_log)
        db.flush()
        db.refresh(new_log)

        new_category = CommunityCategory(
            category_name="Text Channels",
            community_id=new_community.id
        )
        db.add(new_category)
        db.flush()
        
        new_channel = CommunityChannel(
            channel_name="general",
            type=CHANNEL_TYPES.TEXT,
            community_id=new_community.id,
            category_id=new_category.id
        )
        db.add(new_channel)
        db.flush()

        db.commit()
        return {"success": True,
                "id": new_community.id,
                "name": new_community.community_name,
                "image": new_community.community_image
                }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create community due to an internal server error.")

@router.get("/my/communities", response_model=Dict[str, Any])
@limiter.limit("220/minute")
def my_communities(request: Request, current_user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")
    communities = (
        db.query(CommunityMember, Community).join(
            Community,
            Community.id == CommunityMember.community_id
        ).filter(
            CommunityMember.user_id == current_user_id
        ).all()
    )

    community_ids = [community.id for _, community in communities]

    return {
        "success": True,
        "communities": [
            {
                "id": community.id,
                "name": community.community_name,
                "image": community.community_image,
                "ownerId": community.owner_id,
            } for member, community in communities
        ]
    }

@router.get("/community/{community_id}", response_model=Dict[str, Any])
@limiter.limit("220/minute")
def fetch_community(request: Request, community_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    total_members = db.query(func.count(CommunityMember.id)).filter(
        CommunityMember.community_id == community_id
    ).scalar()

    online_members = db.query(func.count(CommunityMember.id)).join(
        User, User.id == CommunityMember.user_id
    ).filter(
        CommunityMember.community_id == community_id,
        User.is_online.is_(True)
    ).scalar()

    return {
        "id": community.id,
        "name": community.community_name,
        "image": community.community_image,
        "ownerId": community.owner_id,
        "onlineMembers": online_members or 0,
        "totalMembers": total_members or 0,
        "createdAt": community.created_at.year,
    }

@router.patch("/community/{community_id}", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def update_community(
    request: Request,
    community_id: str,
    community_name: str = Form(...),
    community_image: UploadFile | None = File(None),
    remove_image: str | None = Form(None),
    current_user_id: str = Depends(get_user_id_from_token),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    is_owner = community.owner_id == current_user.id

    has_permissions = False
    member = db.query(CommunityMember).filter(
        CommunityMember.community_id == community_id,
        CommunityMember.user_id == current_user.id
    ).first()

    if member:
        roles = db.query(CommunityRole).join(
            MemberRole, MemberRole.role_id == CommunityRole.id
        ).filter(
            CommunityRole.community_id == community_id,
            MemberRole.member_id == member.id
        ).all()

        all_permissions = []
        for r in roles:
            all_permissions.extend(r.permissions)

        has_permissions = PERMISSIONS.MANAGE_COMMUNITY in all_permissions or PERMISSIONS.ADMINISTRATOR in all_permissions

    if not is_owner and not has_permissions:
        raise HTTPException(status_code=403, detail="You don't have permission to make changes")

    community_name = community_name.strip()
    if not community_name:
        raise HTTPException(status_code=400, detail="Community name required.")
    if len(community_name) < 4:
        raise HTTPException(status_code=400, detail="Community name must be at least 4 characters.")
    if len(community_name) > 20:
        raise HTTPException(status_code=400, detail="Community name can't be bigger than 20 characters.")

    image_url = None
    old_image_path = None
    should_remove_image = remove_image == "true"

    if should_remove_image and community.community_image:
        old_image_filename = community.community_image.split("/")[-1]
        old_image_path = UPLOADS_FOLDER / old_image_filename
        image_url = None

    if community_image and community_image.filename:
        if community.community_image and community.community_image != None:
            old_image_filename = community.community_image.split("/")[-1]
            old_image_path = UPLOADS_FOLDER / old_image_filename

        ext = os.path.splitext(community_image.filename)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        new_image_path = UPLOADS_FOLDER / filename
        with open(new_image_path, "wb") as f:
            shutil.copyfileobj(community_image.file, f)
        base = (os.getenv("MEDIA_CDN_URL") or "/api/serve/image").rstrip("/")
        image_url = f"{base}/{filename}"

    try:
        name_changed = community.community_name != community_name
        image_changed = image_url is not None or should_remove_image

        community.community_name = community_name
        if should_remove_image:
            community.community_image = None
        elif image_url:
            community.community_image = image_url

        if name_changed and image_changed:
            log_message = f"{current_user.username} updated community image and name to {community_name}"
        elif name_changed:
            log_message = f"{current_user.username} updated community name to {community_name}"
        elif image_changed:
            log_message = f"{current_user.username} updated community image"
        else:
            log_message = None

        if log_message:
            new_log = CommunityLog(
                log=log_message,
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
                    "image": current_user.profile_image,
                    "note": new_log.description,
                    "createdAt": new_log.created_at.strftime("%D %H:%M"),
                })
                for uid in log_user_ids
            ])

        db.commit()
        db.flush()

        if old_image_path and old_image_path.exists() and old_image_path.is_file():
            try:
                old_image_path.unlink()
            except Exception:
                pass

        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id != current_user.id
        ).all()

        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "communityUpdated",
                "id": community.id,
                "name": community.community_name,
                "image": community.community_image,
            })
            for member in members_to_notify
        ])

        return {
            "success": True,
            "id": community.id,
            "name": community.community_name,
            "image": community.community_image,
            "ownerId": community.owner_id,
            "createdAt": community.created_at.year,
        }
    except Exception as e:
        db.rollback()
        if image_url:
            new_file = UPLOADS_FOLDER / filename
            if new_file.exists():
                try:
                    new_file.unlink()
                except Exception:
                    pass
        raise HTTPException(status_code=500, detail="Failed to update community due to an internal server error.")

@router.patch("/community/{community_id}/join", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def join_community(request: Request,
                   community_id: str,
                   current_user_id: str = Depends(get_user_id_from_token),
                   db: Session = Depends(get_db
                   )) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    banned_member = db.query(CommunityBan).filter(
        CommunityBan.community_id == community.id,
        CommunityBan.user_id == current_user.id
    ).first()

    if banned_member:
        return {
            "success": False,
            "reason": banned_member.reason
        }

    existing_member = db.query(CommunityMember).filter(
        CommunityMember.user_id == current_user.id,
        CommunityMember.community_id == community.id
    ).first()

    if existing_member:
        return {
            "success": False
        }

    try:
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != current_user.id,
        ).all()
        new_community_member = CommunityMember(
            user_id=current_user.id,
            community_id=community.id,
        )
        db.add(new_community_member)
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "userJoined",
                "id": current_user.id,
                "username": current_user.username,
                "image": current_user.profile_image,
                "isOnline": current_user.is_online,
                "createdAt": current_user.created_at.year,
            })
            for member in members_to_notify
        ])
        new_log = CommunityLog(
            log=f"{current_user.username} joined",
            community_id=community.id,
            user_id=current_user.id,
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
                "image": current_user.profile_image,
                "note": new_log.description,
                "createdAt": new_log.created_at.strftime("%D %H:%M"),
            })
            for uid in log_user_ids
        ])
        db.commit()
        return {
            "success": True,
            "id": community.id,
            "name": community.community_name,
            "image": community.community_image,
            "createdAt": community.created_at,
            "ownerId": community.owner_id,
            }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to join community due to an internal server error.")

@router.delete("/community/{community_id}/leave", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def leave_community(request: Request,
                    community_id: str,
                    current_user_id: str = Depends(get_user_id_from_token),
                    db: Session = Depends(get_db
                    )) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    if current_user.id == community.owner_id:
        raise HTTPException(status_code=403, detail="Community owners cannot leave their own community. Please delete the community instead.")

    community_member = db.query(CommunityMember).filter(
        CommunityMember.user_id == current_user_id,
        CommunityMember.community_id == community_id
    ).first()

    if not community_member:
        raise HTTPException(status_code=409, detail="You are not a member of this community.")

    try:
        db.delete(community_member)
        db.commit()
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id != current_user.id,
        ).all()
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "userLeft",
                "memberId": current_user.id,
            })
            for member in members_to_notify
        ])
        return {
            "success": True
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred while leaving the community.",)

@router.delete("/community/{community_id}", response_model=Dict[str, Any])
@limiter.limit("220/minute")
async def delete_community(request: Request,
                    community_id: str,
                    community_name: str,
                    current_user_id: str = Depends(get_user_id_from_token),
                    db: Session = Depends(get_db)
                    ) -> Dict[str, Any]:
    current_user = db.query(User).filter(User.id == current_user_id).first()
    if not current_user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    if community.community_name != community_name:
        raise HTTPException(status_code=400, detail="Community name does not match.")

    if community.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the community owner is authorized to delete this community.")

    try:
        members_to_notify = db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id,
            CommunityMember.user_id != community.owner_id
        ).all()
        member_ids = [m.id for m in db.query(CommunityMember).filter(
            CommunityMember.community_id == community_id).all()]
        db.query(MemberRole).filter(MemberRole.member_id.in_(member_ids)).delete(synchronize_session=False)
        db.query(CommunityLog).filter(CommunityLog.community_id == community_id).delete()
        db.query(CommunityMember).filter(CommunityMember.community_id == community_id).delete()
        db.query(CommunityChannel).filter(CommunityChannel.community_id == community_id).delete()
        db.query(CommunityCategory).filter(CommunityCategory.community_id == community_id).delete()
        db.query(CommunityRole).filter(CommunityRole.community_id == community_id).delete()
        db.query(CommunityBan).filter(CommunityBan.community_id == community_id).delete()
        db.query(Community).filter(Community.id == community_id).delete()
        db.commit()
        await asyncio.gather(*[
            manager.broadcast_to_user(member.user_id, {
                "type": "communityDeleted",
                "id": community.id,
            })
            for member in members_to_notify
        ])
        return {
            "success": True,
            "id": community.id
            }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete community due to an internal server error.")