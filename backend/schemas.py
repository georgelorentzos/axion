from pydantic import BaseModel, EmailStr

class AuthRequest(BaseModel):
    email: EmailStr

class AuthResponse(BaseModel):
    success: bool
    message: str

class SendMail(BaseModel):
    message: str
    recipient: str
    subject: str

class CreateAccount(BaseModel):
    username: str
    email: EmailStr

class CreateToken(BaseModel):
    token: str
    type: str

class ValidateToken(BaseModel):
    token: str

class AllyRequest(BaseModel):
    requester_id: str;
    addressee_id: str;

class MessageRequest(BaseModel):
    sender_id: str;
    recipient_id: str;
    message: str;