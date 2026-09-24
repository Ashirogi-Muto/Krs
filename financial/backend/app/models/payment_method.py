"""Payment method model."""
import uuid
from sqlalchemy import Column, String, Boolean
from app.database import Base

class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), unique=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
