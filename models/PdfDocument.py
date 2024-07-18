from crt_db import database
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime


class PDFDocument(database.Model):
    __tablename__ = 'pdf_documents'

    id = Column(Integer, primary_key=True)
    filename = Column(String(10000), nullable=False)
    typefile = Column(String(50), nullable=False)
    upload_time = Column(DateTime, default=datetime.utcnow)
    doc_len = Column(Integer, nullable=False)
    chunks_len = Column(Integer, nullable=False)