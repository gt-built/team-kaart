from pydantic import BaseModel
from typing import Optional


class MemberCreate(BaseModel):
    name: str
    street: str = ""
    house_number: str = ""
    postcode: str = ""
    city: str = ""
    role: str = ""
    team: str = ""
    category: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None
    geocoded: bool = False


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    street: Optional[str] = None
    house_number: Optional[str] = None
    postcode: Optional[str] = None
    city: Optional[str] = None
    role: Optional[str] = None
    team: Optional[str] = None
    category: Optional[str] = None


class MemberOut(MemberCreate):
    id: str

    model_config = {"from_attributes": True}
