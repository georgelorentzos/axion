from pydantic import BaseModel

class CreateChannel(BaseModel):
    channel_name: str
    category_id: str | None = None