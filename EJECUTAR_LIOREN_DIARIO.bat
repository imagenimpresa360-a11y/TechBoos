@echo off
TITLE AGENTE LIOREN - ACTUALIZACION DIARIA ERP
cd /d "c:\Users\DELL\Desktop\TECHEMPRESA\agentes\06_Ingeniero_Datos"
echo 🚀 Iniciando Sincronizacion Automatica Lioren...
echo 📅 Fecha: %date% %time%
echo ----------------------------------------------------

:: Ejecutar el Bot Scraper (Descarga + Inyecta)
python bot_lioren_scraper.py

echo ----------------------------------------------------
echo ✅ Proceso finalizado. 
echo Presiona cualquier tecla para cerrar o programa esto en el Programador de Tareas.
pause
