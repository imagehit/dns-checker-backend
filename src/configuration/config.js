import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || "info",
  enableFileLogs: process.env.ENABLE_FILE_LOGS === "true",
};


export default config;