@echo off
chcp 65001 > nul
echo ============================================================
echo      بناء برنامج Awn Tv pro كملف تنفيذي مستقل (.exe)
echo ============================================================
echo.

echo [1/3] جاري فحص وتثبيت المكتبات المطلوبة...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [خطأ] فشل تثبيت المكتبات. يرجى التأكد من تثبيت Python و pip بشكل صحيح.
    pause
    exit /b
)

echo.
echo [2/3] جاري تحويل الكود إلى ملف تنفيذي عبر PyInstaller...
pyinstaller --noconsole --onefile --clean --name "Awn_Tv_pro" app.py

if %errorlevel% neq 0 (
    echo [خطأ] حدث خطأ أثناء تجميع الملف التنفيذي.
    pause
    exit /b
)

echo.
echo [3/3] تم بنجاح!
echo ستجد البرنامج الجاهز داخل مجلد: dist\Awn_Tv_pro.exe
echo.
pause
