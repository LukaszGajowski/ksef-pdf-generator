set PM2_HOME=C:\Users\Administrator\.pm2
set filenameKSEF=C:\KSeF\PM2-resurrect-%date:~-4%-%date:~3,2%-%date:~0,2%.txt
"C:\Program Files (x86)\nodejs\node.exe" "C:\Users\Administrator\AppData\Roaming\npm\node_modules\pm2\bin\pm2" resurrect > "%filenameKSEF%"