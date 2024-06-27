from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from crt_db import database
from models.user import User

class Conversation(database.Model):
    __tablename__ = "Conversation"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    user_id       = Column(Integer, ForeignKey(User.id), nullable=False)
    messages      = relationship("Qna", back_populates="conversation")
    created_at    = Column(DateTime, default=datetime.utcnow, nullable=False)

class Qna(database.Model):
    __name__ = "Question&Answer"
    id = Column(Integer, primary_key=True, autoincrement=True)
    Question = Column(String(1000), nullable=False)
    Answer = Column(String(5000), nullable=False)
    conversation_id = Column(Integer, ForeignKey(Conversation.id), nullable=False)
    conversation = relationship("Conversation", back_populates="messages")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Feedback(database.Model):
    __tablename__ = 'feedback'
    id = Column(Integer, primary_key=True)
    Question = Column(String(512), nullable=False)
    Feedback = Column(String(512), nullable=False)
    created_at = Column(DateTime, nullable=False)