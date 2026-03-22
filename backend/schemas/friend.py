from pydantic import BaseModel

class AllyRequest(BaseModel):
    requester_id: str
    addressee_id: str
