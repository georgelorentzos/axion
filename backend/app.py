from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from schemas import (
    AuthRequest, 
    AuthResponse, 
    SendMail, 
    CreateAccount, 
    CreateToken,
    ValidateToken,
    AllyRequest
)
from utils.database import get_db, Session as SessionLocal
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from models import User, Token, Friend
from utils.mail import send_mail
from passlib.context import CryptContext
from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import datetime, timedelta
import jwt
import secrets
from typing import Dict, Any
from utils.token_cleanup import token_cleanup_scheduler
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse
from utils.websocket_manager import router, manager
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import asyncio

load_dotenv()

app = FastAPI()

SECRET_KEY = os.getenv('SECRET_KEY')
API_ENDPOINT = os.getenv('API_ENDPOINT')
GATEWAY_ENDPOINT = os.getenv('GATEWAY_ENDPOINT')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
BUILD_NUMBER = datetime.now().strftime('%Y%m%d%H%M%S')

templates = Jinja2Templates(directory="dist")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(
    status_code=429,
    content={"detail": "Too many sign-in attempts. Please try again later."}
))

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)

def get_user_id_from_token(request: Request) -> str:
    token = request.headers.get("Authorization", "").split(" ")[-1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
@app.on_event('startup')
def startup():
    token_cleanup_scheduler()

app.include_router(router, prefix="/api")

@app.post('/api/auth', response_model=AuthResponse)
@limiter.limit("5/minute")
def auth(request: Request, req: AuthRequest, background_tasks:BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == req.email).first()
    if not user:

        new_user = User(
            username=req.email.split("@")[0],
            email=req.email,
            is_verified=False
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user = new_user

    db.query(Token).filter(
        Token.user_id == user.id,
        Token.type == "Auth"
    ).delete()
    db.commit()

    token: str = secrets.token_urlsafe(64)
    new_token: Token = Token(
        token=token,
        type="Auth",
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(new_token)
    db.commit()

    template_path: Path = Path("templates/mail/sign-in.html") if user.is_verified else Path("templates/mail/sign-up.html")
    html: str = template_path.read_text()
    html = html.replace("{token}", token)

    mail_data: SendMail = SendMail(
        recipient=req.email,
        subject="Sign In Link" if user.is_verified else "Sign Up Link",
        message=html
    )

    background_tasks.add_task(send_mail, mail_data)

    return AuthResponse(
        success=True,
        message="Email sent successfully"
    )

@app.post('/api/verify-token', response_model=Dict[str, Any])
@limiter.limit("30/minute")
def verify_token(request: Request, req: CreateToken, db: Session = Depends(get_db)) -> Dict[str, Any]:
    token_record: Token | None = db.query(Token).filter(Token.token == req.token).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if token_record.type != 'Auth':
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    token_age: timedelta = datetime.utcnow() - token_record.created_at
    if token_age > timedelta(minutes=15):
        db.delete(token_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Token has expired")
    
    user: User | None = db.query(User).filter(User.id == token_record.user_id).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    user.is_verified = True
    db.add(user)
    db.delete(token_record)
    db.commit()

    payload: Dict[str, Any] = {
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }
    token: str = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    return {
        "success": True,
        "message": "Sign in successful",
        "token": token
    }

@app.post('/api/validate-token', response_model=Dict[str, Any])
@limiter.limit("200/minute")
def validate_token(request: Request, req: ValidateToken, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return {
            "success": True,
            "message": "Token is valid",
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token validation failed")
    
@app.get('/api/me', response_model=Dict[str, Any])
@limiter.limit("300/minute")
async def get_current_user(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
        "success": True,
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "profile_image": user.profile_image
    }

@app.get('/api/users/search', response_model=Dict[str, Any])
@limiter.limit('30/minute')
def search_user(request: Request, search: str = Query(..., alias="search"), user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:    
    users = db.query(User).filter(User.username.ilike(f"%{search}%"), User.id != user_id).limit(20).all()

    return {
        "success": True,
        "users": [
            {
                "user_id": user.id,
                "username": user.username,
                "profile_image": user.profile_image,
                "is_online": user.is_online,
            } for user in users
        ]
    }

@app.post('/api/ally', response_model=Dict[str, Any])
@limiter.limit('15/minute')
async def ally(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token) ,db: Session = Depends(get_db)) -> Dict[str, Any]:
    if req.requester_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot send as another user")
    
    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot friend yourself")
    
    requester = db.query(User).filter(User.id == req.requester_id).first()
    addressee = db.query(User).filter(User.id == req.addressee_id).first()
    
    if not addressee:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = db.query(Friend).filter(
        ((Friend.requester_id == req.requester_id) & (Friend.addressee_id == req.addressee_id)) |
        ((Friend.requester_id == req.addressee_id) & (Friend.addressee_id == req.requester_id))
    ).first()
    
    if existing:
        if existing.status == "friends":
            raise HTTPException(status_code=400, detail="Request already exists")
    
        if existing.requester_id == req.addressee_id and existing.status == "pending":
            existing.status = "friends"
            db.commit()
            return {"success": True, "message": "Friend request accepted"}
        else:
            raise HTTPException(status_code=400, detail="Request already exists")
    
    try:
        new_friend = Friend(requester_id=req.requester_id, addressee_id=req.addressee_id)
        db.add(new_friend)
        db.commit()

        await manager.broadcast_to_user(req.addressee_id, {
            "type": "ally_request",
            "requester_id": req.requester_id,
            "requester_username": requester.username,
            "requester_profile_image": requester.profile_image
        })

        return {"success": True, "message": "Friend request sent"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send request")
    
@app.delete('/api/ally/cancel', response_model=Dict[str, Any])
@limiter.limit('15/minute')
async def cancel_ally(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    if req.requester_id != user_id:
        raise HTTPException(status_code=403, )
    
    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot cancel yourself")
    
    requester = db.query(User).filter(User.id == req.requester_id).first()
    if not db.query(User).filter(User.id == req.addressee_id).first():
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(Friend).filter(
        ((Friend.requester_id == req.requester_id) & (Friend.addressee_id == req.addressee_id)) |
        ((Friend.requester_id == req.addressee_id) & (Friend.addressee_id == req.requester_id)),
        Friend.status == "pending"
    ).first()
    
    if existing:
        try:
            db.delete(existing)
            db.commit()

            await manager.broadcast_to_user(req.addressee_id, {
                "type": "ally_cancel_request",
                "requester_id": req.requester_id,
                "requester_username": requester.username,
                "requester_profile_image": requester.profile_image
            })
            
            return {"success": True, "message": "Friend request canceled"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to cancel request")
    else:
        return {"success": True, "message": "Request already canceled"}

@app.delete("/api/ally/decline", response_model=Dict[str, Any])
@limiter.limit('30/minute')
def ally_decline(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    existing = db.query(Friend).filter(
        Friend.addressee_id == user_id,
        Friend.requester_id == req.requester_id,
        Friend.status == "pending"
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Friend request not found")

    try:
        db.delete(existing)
        db.commit()
        return {"success": True, "message": "Friend request declined"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to decline request")

@app.post('/api/ally/accept', response_model=Dict[str, Any])
@limiter.limit('30/minute')
async def ally_accept(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)):
    existing = db.query(Friend).filter(
        Friend.addressee_id == user_id,
        Friend.requester_id == req.requester_id,
        Friend.status == "pending"
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    requester = db.query(User).filter(User.id == req.requester_id).first()
    addressee = db.query(User).filter(User.id == user_id).first()
    
    try:
        existing.status = "friends"
        db.commit()

        await manager.broadcast_to_user(user_id, {
            "type": "ally_accept_request",
            "requester_id": req.requester_id,
            "requester_username": requester.username,
            "requester_profile_image": requester.profile_image,
            "is_online": requester.is_online
        })

        await manager.broadcast_to_user(req.requester_id, {
            "type": "ally_accept_request",
            "requester_id": user_id,
            "requester_username": addressee.username,
            "requester_profile_image": addressee.profile_image,
            "is_online": addressee.is_online
        })

        return {"success": True, "message": "Friend request accepted"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to accept friend request")

@app.get('/api/my/ally/requests', response_model=Dict[str, Any])
@limiter.limit('30/minute')
def my_ally_requests(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    pendings = db.query(Friend).filter(
        and_(Friend.requester_id == user_id, Friend.status == "pending")
    ).all()

    return {
        "success": True,
        "pendings": [
            {
                "pending_user_id": pending.addressee_id,
                "requester_username": pending.requester.username,
                "requester_profile_image": pending.requester.profile_image
            } for pending in pendings
        ]
    }

@app.get('/api/my/pendings', response_model=Dict[str, Any])
@limiter.limit('30/minute')
def get_pendings(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    pendigs = db.query(Friend).filter(
        and_(Friend.addressee_id == user_id, Friend.status == "pending")
    ).all()

    return {
        "success": True,
        "pendings": [
            {
                "user_id": pending.requester.id,
                "username": pending.requester.username,
                "profile_image": pending.requester.profile_image,
                "is_online": pending.requester.is_online,
            } for pending in pendigs
        ]
    }

@app.get('/api/my/friends/all', response_model=Dict[str, Any])
@limiter.limit('30/minute')
def my_friends_all(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    friends = db.query(Friend, User).join(
        User, 
        or_(
            and_(Friend.requester_id == user.id, Friend.addressee_id == User.id),
            and_(Friend.addressee_id == user.id, Friend.requester_id == User.id)
        )
    ).filter(
        or_(Friend.addressee_id == user.id, Friend.requester_id == user.id),
        Friend.status == "friends",
        User.id != user_id
    ).all()
    
    friends_list = [
        {
            "user_id": friend.User.id,
            "username": friend.User.username,
            "profile_image": friend.User.profile_image,
            "is_online": friend.User.is_online,
        } for friend in friends
    ]
    
    return {
        "success": True,
        "friends": friends_list
    }
        
@app.get('/api/my/friends/online', response_model=Dict[str, Any])
@limiter.limit('30/minute')
def my_friends_online(request: Request, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    friends = db.query(Friend, User).join(
        User, 
        or_(
            and_(Friend.requester_id == user.id, Friend.addressee_id == User.id),
            and_(Friend.addressee_id == user.id, Friend.requester_id == User.id)
        )
    ).filter(
        or_(Friend.addressee_id == user.id, Friend.requester_id == user.id),
        Friend.status == "friends",
        User.is_online == True,
        User.id != user_id
    ).all()

    friends_list = [
        {
            "user_id": friend.User.id,
            "username": friend.User.username,
            "profile_image": friend.User.profile_image
        } for friend in friends
    ]

    return {
        "success": True,
        "friends": friends_list
    }

@app.delete('/api/ally/remove', response_model=Dict[str, Any])
@limiter.limit('30/minute')
async def ally_remove(request: Request, req: AllyRequest, user_id: str = Depends(get_user_id_from_token), db: Session = Depends(get_db)) -> Dict[str, Any]:
    if req.requester_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot remove as another user")
    
    if req.requester_id == req.addressee_id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    requester = db.query(User).filter(
        User.id == req.requester_id
    ).first()

    addressee = db.query(User).filter(User.id == user_id).first()
    
    if not db.query(User).filter(User.id == req.addressee_id).first():
        raise HTTPException(status_code=404, detail="User not found")
    
    existing = db.query(Friend).filter(
        ((Friend.requester_id == req.requester_id) & (Friend.addressee_id == req.addressee_id)) |
        ((Friend.requester_id == req.addressee_id) & (Friend.addressee_id == req.requester_id)),
        Friend.status == "friends"
    ).first()

    if existing:
        try:
            db.delete(existing)
            db.commit()

            await manager.broadcast_to_user(req.addressee_id, {
                "type": "ally_removed",
                "requester_id": req.requester_id,
                "requester_username": requester.username,
                "requester_profile_image": requester.profile_image
            })

            await manager.broadcast_to_user(user_id, {
                "type": "ally_removed",
                "requester_id": req.addressee_id,
                "requester_username": addressee.username,
                "requester_profile_image": addressee.profile_image
            })

            return {"success": True, "message": "Friend request removed"}
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to cancel request")

if os.path.exists("dist/assets"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")
    
@app.get("/", response_class=HTMLResponse)
@app.get("/{full_path:path}", response_class=HTMLResponse)
def serve_app(request: Request, full_path: str = ""):
    nonce = secrets.token_urlsafe(16)
    
    html_path = "dist/index.html"
    if not os.path.exists(html_path):
        return HTMLResponse(
            content="<h1>Error: React build not found</h1><p>Run 'npm run build' first</p>",
            status_code=500
        )
    
    context = {
        "request": request,
        "nonce": nonce,
        "api_endpoint": API_ENDPOINT,
        "gateway_endpoint": GATEWAY_ENDPOINT,
        "build_number": BUILD_NUMBER,
        "environment": ENVIRONMENT,
    }
    
    response = templates.TemplateResponse("index.html", context)
    
    csp = (
        f"default-src 'self'; "
        f"script-src 'nonce-{nonce}' https://cdn.tailwindcss.com https://cdn.jsdelivr.net 'self' https:; "
        f"style-src 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; "
        f"font-src https://fonts.gstatic.com; "
        f"connect-src * data:; "
        f"img-src 'self' data: https:; "
        f"media-src 'self' https:;"
    )
    response.headers["Content-Security-Policy"] = csp
    
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response