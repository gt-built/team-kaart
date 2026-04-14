import asyncio
import time
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from models import GeoCache

RATE_LIMIT_S = 1.1
_last_request: float = 0.0


async def geocode_postcode(
    postcode: str, city: str, db: AsyncSession
) -> tuple[float, float] | None:
    key = postcode.replace(" ", "").upper()

    cached = await db.get(GeoCache, key)
    if cached:
        return cached.lat, cached.lng

    global _last_request
    elapsed = time.time() - _last_request
    if elapsed < RATE_LIMIT_S:
        await asyncio.sleep(RATE_LIMIT_S - elapsed)
    _last_request = time.time()

    query = f"{postcode}, {city}, Netherlands"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": query, "format": "json", "limit": 1, "countrycodes": "nl"},
                headers={"User-Agent": "TeamKaart-MoveBeyond/1.0", "Accept-Language": "nl"},
                timeout=10.0,
            )
        if resp.status_code != 200 or not resp.json():
            return None
        data = resp.json()
        lat, lng = float(data[0]["lat"]), float(data[0]["lon"])

        db.add(GeoCache(postcode=key, lat=lat, lng=lng, cached_at=time.time()))
        await db.commit()
        return lat, lng
    except Exception:
        return None
