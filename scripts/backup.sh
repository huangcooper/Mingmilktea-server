#!/bin/bash
# ==============================================================
# 奶茶原材料管理系统 — 数据库定时备份脚本
# 部署到物理机 100.114.225.7，通过 crontab 定时执行
#
# 策略：
#   - 每日凌晨 3 点执行全量备份
#   - 保留最近 7 天每日备份 + 4 周每周备份
#   - 备份文件 .sql 纯文本，可直接 psql 恢复
#
# 部署（在物理机上）：
#   cp scripts/backup.sh /usr/local/bin/milktea-backup.sh
#   chmod +x /usr/local/bin/milktea-backup.sh
#   crontab -e  # 添加：0 3 * * * /usr/local/bin/milktea-backup.sh
# ==============================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/srv/backups/milktea}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-milktea}"
DB_USER="${DB_USER:-milktea}"
# 密码优先从环境变量读取，其次使用默认值
DB_PASS="${PGPASSWORD:-milktea}"
export PGPASSWORD="$DB_PASS"

DATE=$(date +%Y%m%d)
WEEK=$(date +%U)

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/weekly"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始备份 $DB_NAME..."

# 执行备份
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-acl \
  > "$BACKUP_DIR/daily/milktea_${DATE}.sql"

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_DIR/daily/milktea_${DATE}.sql" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份完成 ($SIZE): milktea_${DATE}.sql"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份失败！" >&2
    exit 1
fi

# 轮转：只保留最近 7 份每日备份
ls -t "$BACKUP_DIR/daily/"*.sql 2>/dev/null | tail -n +8 | xargs -r rm -f

# 每周日额外保留一份周备份
if [ "$(date +%u)" = "7" ]; then
    cp "$BACKUP_DIR/daily/milktea_${DATE}.sql" "$BACKUP_DIR/weekly/milktea_week${WEEK}.sql"
    ls -t "$BACKUP_DIR/weekly/"*.sql 2>/dev/null | tail -n +5 | xargs -r rm -f
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 周备份已保存: milktea_week${WEEK}.sql"
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份任务完成"
