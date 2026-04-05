from pydantic import BaseModel

class RoleRequest(BaseModel):
    name: str
    permissions: str