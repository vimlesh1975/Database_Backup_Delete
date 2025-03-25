import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { sub } from 'date-fns';
import seven from 'node-7z';
import { format } from 'date-fns-tz';
import cron from 'node-cron';
import { config } from './db.js';

const dbConfig = config;

const backupDir = process.env.BACKUP_DIR || 'C:\\nrcs_backup\\backups';

const createBackup = (dbConfig, backupDir) => {
    const now = new Date();
    const timestamp = format(now, 'yyyyMMdd_HHmmss', { timeZone: 'Asia/Kolkata' });
    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
    const compressedFile = path.join(backupDir, `backup_${timestamp}.7z`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const mysqldumpPath = `"C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump"`;
    const dumpCommand = `${mysqldumpPath} -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} > ${backupFile}`;

    exec(dumpCommand, { windowsHide: true }, (error, stdout, stderr) => {

        if (error) {
            console.error(`Error creating backup: ${error.message}`);
            return;
        }
        console.log(`Backup file created: ${backupFile}`);

        // Compress the backup file
        compressFile(backupFile, compressedFile);

        if (stderr) {
            console.error(`mysqldump stderr: ${stderr}`);
        }
    });
};

const compressFile = (inputFile, outputFile) => {
    const zip = seven.add(outputFile, inputFile, {
        recursive: true,
        $bin: 'C:\\Program Files\\7-Zip\\7z.exe' // Adjust the path to 7z executable if necessary
    });

    zip.on('end', () => {
        console.log(`Compressed file created: ${outputFile}`);
        fs.unlinkSync(inputFile); // Delete the uncompressed SQL file
    });

    zip.on('error', (err) => {
        console.error(`Error compressing file: ${err}`);
    });
};



const deleteOldBackups = async (backupDir, days) => {
    const cutoffDate = sub(new Date(), { days });

    try {
        const files = await fs.promises.readdir(backupDir);
        for (const file of files) {
            const filePath = path.join(backupDir, file);
            const stats = await fs.promises.stat(filePath);

            if (stats.mtime < cutoffDate) {
                await fs.promises.unlink(filePath);
                console.log(`Deleted old backup file: ${filePath}`);
            }
        }
    } catch (err) {
        console.error(`Error processing backup directory: ${err.message}`);
    }
};


createBackup(dbConfig, backupDir);
deleteOldBackups(backupDir, 3); // Delete files older than 3 days


// Schedule the backup and delete tasks


cron.schedule('0 2 * * *', () => {
    // cron.schedule('* * * * *', () => {
    console.log('Running the backup script...');
    createBackup(dbConfig, backupDir);
}, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
});

cron.schedule('0 3 * * *', () => {
    // cron.schedule('* * * * *', () => {

    console.log('Running the delete script...');
    deleteOldBackups(backupDir, 3); // Delete files older than 3 days
}, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
});

console.log('Backup and delete schedulers are running. Press Ctrl+C to exit.');
