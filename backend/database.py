import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from models import Base

DATABASE_URL = os.environ["DATABASE_URL"]

# Supabase vereist SSL; asyncpg accepteert deze connect_arg
engine = create_async_engine(DATABASE_URL, connect_args={"ssl": "require"})
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with SessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
