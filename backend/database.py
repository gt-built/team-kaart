import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from models import Base

_url = os.environ["DATABASE_URL"]

# Railway geeft postgres:// of postgresql://, asyncpg heeft postgresql+asyncpg://
if _url.startswith("postgres://"):
    _url = _url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _url.startswith("postgresql://"):
    _url = _url.replace("postgresql://", "postgresql+asyncpg://", 1)

# SSL alleen voor externe verbindingen (niet intern op Railway)
_ssl = {} if "railway.internal" in _url else {"ssl": "require"}

DATABASE_URL = _url
engine = create_async_engine(DATABASE_URL, connect_args=_ssl)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with SessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
