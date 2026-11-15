@echo off
chcp 65001 > nul
echo ============================================================
echo           تشغيل برنامج Awn Tv pro مباشرة عبر بايثون
echo ============================================================
echo.
pip install -r requirements.txt
python app.py
pause
