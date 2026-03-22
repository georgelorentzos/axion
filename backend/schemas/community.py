from pydantic import BaseModel

class CategoryRequest(BaseModel):
    community_id: str
    category_name: str

class RoleRequest(BaseModel):
    name: str
    permissions: str
