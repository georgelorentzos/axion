from fastapi import HTTPException, Request
from dotenv import load_dotenv
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address
from pathlib import Path
import os
import jwt

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
API_ENDPOINT = os.getenv('API_ENDPOINT')
GATEWAY_ENDPOINT = os.getenv('GATEWAY_ENDPOINT')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')

os.makedirs("uploads", exist_ok=True)
UPLOADS_FOLDER = Path("uploads")

limiter = Limiter(key_func=get_remote_address)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

def get_user_id_from_token(request: Request) -> str:
    token = request.headers.get("Authorization", "").split(" ")[-1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token.")
        return user_id
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token.")
