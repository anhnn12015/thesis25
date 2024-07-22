from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from crt_db import database

class ActivityLog(database.Model):
    __tablename__ = 'activity_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    # admin_id = Column(Integer, ForeignKey('user.id'), nullable=False)  # Assuming 'user.id' is the ForeignKey
    pdf_id = Column(Integer, ForeignKey('pdf_documents.id'), nullable=False)  # Foreign key to PDFDocument

    # admin = relationship('User', backref='activities')
    pdf = relationship('PDFDocument', backref='activity_logs')  # Relationship to PDFDocument

