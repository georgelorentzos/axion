from pydantic import BaseModel

class RoleRequest(BaseModel):
    name: str
    color: str
    permissions: str