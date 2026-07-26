#!/bin/bash
# ==============================================================
# 奶茶原材料管理系统 — SQLite → PostgreSQL 数据迁移脚本
#
# 前提：物理机上已启动 PostgreSQL（docker-compose up -d db）
# 用法：
#   1. 确保 milk_tea.db 和此脚本在同一目录
#   2. bash scripts/migrate_to_pg.sh
#   3. 脚本自动：导出 SQLite → 清洗 SQL → 导入 PostgreSQL
# ==============================================================
set -euo pipefail

SQLITE_DB="${1:-./milk_tea.db}"
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_DB="${PG_DB:-milktea}"
PG_USER="${PG_USER:-milktea}"
export PGPASSWORD="${PGPASSWORD:-milktea}"

echo "============================================"
echo " SQLite → PostgreSQL 数据迁移"
echo "============================================"
echo ""
echo "源库: $SQLITE_DB"
echo "目标: postgresql://$PG_USER@$PG_HOST:$PG_PORT/$PG_DB"
echo ""

if [ ! -f "$SQLITE_DB" ]; then
    echo "错误: 找不到 SQLite 数据库文件 $SQLITE_DB"
    exit 1
fi

# 检查 pg_dump / sqlite3 可用
command -v sqlite3 >/dev/null 2>&1 || { echo "请先安装 sqlite3"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "请先安装 psql (apt-get install postgresql-client)"; exit 1; }

echo "[1/4] 从 SQLite 导出表结构和数据..."
sqlite3 "$SQLITE_DB" .dump > /tmp/milktea_sqlite_dump.sql
echo "  导出完成: $(wc -l < /tmp/milktea_sqlite_dump.sql) 行"

echo "[2/4] 清洗 SQL 为 PostgreSQL 兼容格式..."
# 移除 SQLite 特有的 PRAGMA / BEGIN TRANSACTION
# 替换 AUTOINCREMENT → PostgreSQL SERIAL (id 列)
# 替换双引号标识符
sed -i.bak \
    -e '/^PRAGMA/d' \
    -e '/^BEGIN TRANSACTION/d' \
    -e '/^COMMIT/d' \
    -e "s/AUTOINCREMENT//g" \
    -e "s/`//g" \
    /tmp/milktea_sqlite_dump.sql
echo "  清洗完成"

echo "[3/4] 清空 PostgreSQL 目标数据库并重新建表..."
# 删除并重建 schema（慎用！确认是迁移目标库）
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -c "
DO \$\$ DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
"
echo "  旧表已清理"

echo "[4/4] 导入数据到 PostgreSQL..."
psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" -f /tmp/milktea_sqlite_dump.sql
echo "  导入完成"

# 清理
rm -f /tmp/milktea_sqlite_dump.sql /tmp/milktea_sqlite_dump.sql.bak

echo ""
echo "============================================"
echo " 迁移完成！下一步："
echo " 1. 验证记录数: psql -h $PG_HOST -U $PG_USER -d $PG_DB -c 'SELECT count(*) FROM ingredients;'"
echo " 2. 更新 Docker 容器环境变量: DATABASE_URL=postgresql://milktea:milktea@db:5432/milktea"
echo " 3. 重启应用: docker compose up -d"
echo "============================================"
