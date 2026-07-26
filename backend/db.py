"""数据库引擎与会话管理 — 支持 SQLite（本地开发）和 PostgreSQL（生产）
对 PG 自动使用 pg8000 纯 Python 驱动，无需 gcc/libpq-dev 编译。
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL, IS_SQLITE

# PG 默认使用 pg8000 纯 Python 驱动（避免 psycopg2 编译依赖）
_pg_url = DATABASE_URL
if not IS_SQLITE and "+" not in _pg_url:
    _pg_url = _pg_url.replace("postgresql://", "postgresql+pg8000://", 1)

if IS_SQLITE:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(_pg_url, pool_size=10, max_overflow=20)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
