from sqlalchemy import Column, String, Float, Boolean
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Member(Base):
    __tablename__ = "members"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    street = Column(String, default="")
    house_number = Column(String, default="")
    postcode = Column(String, default="")
    city = Column(String, default="")
    role = Column(String, default="")
    team = Column(String, default="")
    category = Column(String, default="")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    geocoded = Column(Boolean, default=False)


class GeoCache(Base):
    __tablename__ = "geocache"

    postcode = Column(String, primary_key=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    cached_at = Column(Float, nullable=False)
