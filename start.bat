@echo off
chcp 65001 >nul
echo 🧋 奶茶原材料管理系统
echo ========================
echo.
echo 正在安装依赖...
pip install -r requirements.txt -q
echo.
echo 正在启动服务...
python backend/main.py
pause
