from pydantic import BaseModel

class MessageRequest(BaseModel):
    message: str
    reply_to_id: str | None = None
