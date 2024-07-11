@echo off

rem Start your Node.js script with PM2
pm2 start backup.js --name backup_and_delete

rem Optional: Save the PM2 process list
pm2 save

rem Optional: Set up PM2 to start on system boot
pm2 startup
