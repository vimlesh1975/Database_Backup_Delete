import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Specify the .env.local file

var mysqlConfig = {};
if (process.env.credentialsfromenv !== '1') {
  const readCredentials = (await import('./readCredentials.js')).default;
  const aa = await readCredentials();
  mysqlConfig=aa.mysqlConfig;
}

const configFromEnvFile = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 20000, // 20 seconds
};
export const config = process.env.credentialsfromenv === '1' ? configFromEnvFile : mysqlConfig;
export const newdatabase = process.env.NEWDATABASE === "true"

console.log(`config loaded from ${process.env.credentialsfromenv === '1' ? 'env file' : 'php file'}`);