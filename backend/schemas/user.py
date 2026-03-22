from pydantic import BaseModel, EmailStr

class CreateAccount(BaseModel):
    username: str
    email: EmailStr
