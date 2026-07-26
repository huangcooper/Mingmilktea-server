"""应用配置 — 通过环境变量切换数据库（本地 SQLite / 生产 PostgreSQL）"""
import os

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "sqlite:///./milk_tea.db"  # 默认：本地开发用 SQLite
)

IS_SQLITE = DATABASE_URL.startswith("sqlite")
