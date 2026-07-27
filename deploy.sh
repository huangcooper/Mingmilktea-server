#!/bin/bash
# 一次性部署脚本：本地 git push → rsync 到服务器 → docker 重建
set -e
HOST=100.114.225.7
REMOTE_DIR=/srv/remote-test/apps/milktea

echo "=== 1/3 推送代码到 GitHub ==="
git push origin main

echo "=== 2/3 同步代码到服务器 ==="
rsync -avz --delete \
  --exclude='.git' --exclude='milk_tea.db' --exclude='__pycache__' --exclude='.venv' \
  . root@$HOST:$REMOTE_DIR/

echo "=== 3/3 重建容器 ==="
ssh root@$HOST "
  cd $REMOTE_DIR
  docker stop rt-milktea 2>/dev/null || true
  docker rm rt-milktea 2>/dev/null || true
  docker run -d \
    --name rt-milktea \
    --network remote-test_default \
    --network-alias milktea \
    --restart unless-stopped \
    -e DATABASE_URL=postgresql+pg8000://milktea:milktea@db:5432/milktea \
    -v $REMOTE_DIR:/app \
    python:3.12-slim \
    bash -c 'pip install --no-cache-dir -r /app/requirements.txt && exec python /app/backend/main.py'
  sleep 5
  STATUS=\$(docker inspect -f '{{.State.Status}}' rt-milktea)
  echo \"容器状态: \$STATUS\"
  curl -s http://localhost:8081/api/health
"
echo ""
echo "=== 部署完成 https://my-server.tail30a311.ts.net/milktea/ ==="
