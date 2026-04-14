import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database import get_db
from models import Member
from schemas import MemberCreate, MemberUpdate, MemberOut
from services.geocoding import geocode_postcode

router = APIRouter()


@router.get("/members", response_model=List[MemberOut])
async def list_members(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Member).order_by(Member.name))
    return result.scalars().all()


@router.post("/members/import", response_model=List[MemberOut])
async def import_members(members: List[MemberCreate], db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Member))
    db_members = [Member(id=str(uuid.uuid4()), **m.model_dump()) for m in members]
    db.add_all(db_members)
    await db.commit()
    return db_members


@router.put("/members/{member_id}", response_model=MemberOut)
async def update_member(
    member_id: str, data: MemberUpdate, db: AsyncSession = Depends(get_db)
):
    member = await db.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Lid niet gevonden")

    update_data = data.model_dump(exclude_unset=True)
    address_changed = any(k in update_data for k in ("postcode", "city"))

    for key, val in update_data.items():
        setattr(member, key, val)

    if address_changed:
        coords = await geocode_postcode(member.postcode, member.city, db)
        if coords:
            member.lat, member.lng = coords
            member.geocoded = True
        else:
            member.lat = member.lng = None
            member.geocoded = False

    await db.commit()
    await db.refresh(member)
    return member


@router.delete("/members/{member_id}", status_code=204)
async def delete_member(member_id: str, db: AsyncSession = Depends(get_db)):
    member = await db.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Lid niet gevonden")
    await db.delete(member)
    await db.commit()
