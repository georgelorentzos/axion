from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from schemas.auth import AuthRequest, AuthResponse, CreateToken, ValidateToken, SendMail
from utils.database import get_db
from sqlalchemy.orm import Session
from models import User, Token
from utils.mail import send_mail
from dependencies import limiter, SECRET_KEY
from datetime import datetime, timedelta
from typing import Dict, Any
from pathlib import Path
import jwt
import secrets

router = APIRouter(prefix="/api", tags=["auth"])

@router.post('/auth', response_model=AuthResponse)
@limiter.limit("5/minute")
def auth(request: Request, req: AuthRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)) -> AuthResponse:
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

@router.post('/verify-token', response_model=Dict[str, Any])
@limiter.limit("5/minute")
def verify_token(request: Request, req: CreateToken, db: Session = Depends(get_db)) -> Dict[str, Any]:
    token_record: Token | None = db.query(Token).filter(Token.token == req.token).first()

    if not token_record:
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    if token_record.type != 'Auth':
        raise HTTPException(status_code=400, detail="Invalid or expired token.")

    token_age: timedelta = datetime.utcnow() - token_record.created_at
    if token_age > timedelta(minutes=15):
        db.delete(token_record)
        db.commit()
        raise HTTPException(status_code=400, detail="Token has expired.")

    user: User | None = db.query(User).filter(User.id == token_record.user_id).first()

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

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
        "token": token
    }

@router.post('/validate-token', response_model=Dict[str, Any])
@limiter.limit("220/minute")
def validate_token(request: Request, req: ValidateToken, db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        user = db.query(User).filter(User.id == user_id).first()

        if not user:
            raise HTTPException(status_code=401, detail="User not found.")

        return {
            "success": True,
            "id": user.id,
            "username": user.username,
            "email": user.email
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")

    except Exception as e:
        raise HTTPException(status_code=401, detail="Token validation failed.")
