from pydantic import BaseModel

class MessageRequest(BaseModel):
    sender_id: str
    recipient_id: str
    message: str
