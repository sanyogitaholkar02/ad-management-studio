from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ctr_api.db.database import Base


class UserContextData(Base):
    """
    Stores the full request payload from the ctr/predict/ API.
    Maps the CTRRequestSerializer fields into the user_context_data table.
    """
    __tablename__ = "user_context_data"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # User ID
    user_id = Column(String(100), nullable=False, index=True)

    # Profile fields
    age_group = Column(String(50), nullable=True)
    interests = Column(Text, nullable=True)                # JSON array as string
    search_history = Column(Text, nullable=True)            # JSON array as string
    preferred_topics = Column(Text, nullable=True)          # JSON array as string
    background_info = Column(Text, nullable=True)           # JSON array as string
    price_preferences = Column(Text, nullable=True)         # JSON array as string
    influencers_followed = Column(Text, nullable=True)      # JSON array as string
    current_interests = Column(Text, nullable=True)         # JSON array as string
    recent_ads = Column(Text, nullable=True)                # JSON array as string

    # Context fields
    device_type = Column(String(50), nullable=True)
    country = Column(String(10), nullable=True)
    currency = Column(String(10), nullable=True)
    time_of_day = Column(String(10), nullable=True)
    day_of_week = Column(String(20), nullable=True)

    # Prediction result
    chosen_ad = Column(String(100), nullable=True)
    total_latency_ms = Column(Integer, nullable=True)

    # Metadata
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<UserContextData(id={self.id}, user_id='{self.user_id}', device='{self.device_type}')>"


class UserAdPrediction(Base):
    """
    Stores the prediction response for a user.
    One user_ad_prediction has many ad_prediction records (one-to-many).
    """
    __tablename__ = "user_ad_prediction"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    chosen_ad = Column(String(100), nullable=True)
    total_latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # One-to-many relationship: one UserAdPrediction -> many AdPrediction
    predictions = relationship("AdPrediction", back_populates="user_ad_prediction", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UserAdPrediction(id={self.id}, user_id='{self.user_id}', chosen_ad='{self.chosen_ad}')>"


class AdPrediction(Base):
    """
    Stores individual ad prediction results.
    Many ad_prediction records belong to one user_ad_prediction (many-to-one).
    """
    __tablename__ = "ad_prediction"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prediction_id = Column(Integer, ForeignKey("user_ad_prediction.id"), nullable=False, index=True)
    ad_id = Column(String(100), nullable=False)
    title = Column(String(255), nullable=True)
    ctr = Column(Float, nullable=True)
    category = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Many-to-one relationship back to UserAdPrediction
    user_ad_prediction = relationship("UserAdPrediction", back_populates="predictions")

    def __repr__(self):
        return f"<AdPrediction(id={self.id}, ad_id='{self.ad_id}', ctr={self.ctr})>"
