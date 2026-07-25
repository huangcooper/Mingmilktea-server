#!/bin/bash
cd "$(dirname "$0")"
echo "🧋 奶茶原材料管理系统"
echo "========================"
echo ""
echo "正在安装依赖..."
pip3 install -r requirements.txt -q
echo ""
echo "正在启动服务..."
python3 backend/main.py
