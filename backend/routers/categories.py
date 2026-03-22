from fastapi import APIRouter, HTTPException, Depends, Request
from schemas.community import CategoryRequest
from utils.database import get_db
from sqlalchemy.orm import Session
from models import User, Community, CommunityMember, CommunityCategory, CommunityRole, MemberRole
from dependencies import limiter, get_user_id_from_token
from typing import Dict, Any

router = APIRouter(prefix="/api", tags=["categories"])

@router.post("/category/create", response_model=Dict[str, Any])
@limiter.limit("50/minute")
def create_category(request: Request, req: CategoryRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    community = db.query(Community).filter(Community.id == req.community_id).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found.")

    member = db.query(CommunityMember).filter(
        CommunityMember.user_id == user_id,
        CommunityMember.community_id == req.community_id,
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this community.")

    roles = db.query(CommunityRole).join(
        MemberRole, MemberRole.role_id == CommunityRole.id
    ).filter(
        CommunityRole.community_id == req.community_id,
        MemberRole.member_id == member.id
    ).all()

    has_permission = any("CREATE_CATEGORY" in role.permissions for role in roles)

    if not has_permission:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to create a category."
        )

    category = CommunityCategory(
        category_name=req.category_name,
        community_id=req.community_id
    )

    db.add(category)
    db.commit()
    db.refresh(category)

    return {"id": category.id, "name": category.category_name}
