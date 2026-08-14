"""数据库引擎与会话管理 — 支持 SQLite（本地）/ MySQL（云端）/ PostgreSQL
驱动自动补全：MySQL 用 pymysql，PG 用 pg8000，均无需编译依赖。
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL, IS_SQLITE, IS_MYSQL

_url = DATABASE_URL
if not IS_SQLITE and "+" not in _url:
    if _url.startswith("mysql"):
        _url = _url.replace("mysql://", "mysql+pymysql://", 1)
    elif _url.startswith("postgresql"):
        _url = _url.replace("postgresql://", "postgresql+pg8000://", 1)

if IS_SQLITE:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        _url,
        pool_size=10, max_overflow=20,
        pool_pre_ping=True,        # 断线自动重连（云端 MySQL 空闲超时兜底）
        pool_recycle=1800,         # 30 分钟回收连接，避免被 MySQL 服务端断开
    )

# MySQL 关闭外键检查：模型用 parent_id=0 表示"无父级"（自关联外键），
# 而 SQLite 默认不强制外键，MySQL 强制。为保持跨库行为一致，对 MySQL 关闭 FK 检查。
if IS_MYSQL:
    @event.listens_for(engine, "connect")
    def _set_mysql_fk_off(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("SET FOREIGN_KEY_CHECKS=0")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
