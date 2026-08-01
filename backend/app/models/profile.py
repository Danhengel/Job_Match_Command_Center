from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class CareerProfile(Base):
    __tablename__ = "career_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    home_location: Mapped[str] = mapped_column(String(255), default="")
    remote_preferred: Mapped[bool] = mapped_column(Boolean, default=True)
    hybrid_preferred: Mapped[bool] = mapped_column(Boolean, default=True)
    radius_miles: Mapped[int] = mapped_column(Integer, default=50)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_target: Mapped[int | None] = mapped_column(Integer, nullable=True)
    target_titles: Mapped[list] = mapped_column(JSON, default=list)
    priority_keywords: Mapped[list] = mapped_column(JSON, default=list)
    exclusion_keywords: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resumes: Mapped[list["Resume"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
