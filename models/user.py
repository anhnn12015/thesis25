from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from crt_db import database

class User(database.Model):
    __name__    = "user"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    username    = Column(String(50), unique=True, nullable=False)
    password    = Column(String(300), nullable=False)
    firstname   = Column(String(50), nullable=False)
    lastname    = Column(String(50), nullable=False)
    DoB         = Column(String(50), nullable=False)
    phone       = Column(String(50), nullable=False)
    email       = Column(String(100))
    # is_logged_in = Column(Boolean, default=False)
    address     = Column(String(200), nullable=False)
    roleID      = Column(Integer, nullable=False)
    id_chat        = relationship("Conversation", backref="user", lazy= False)
    is_online = Column(Boolean, default=False)
