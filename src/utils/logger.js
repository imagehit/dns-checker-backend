import winston from "winston";
import config from "../configuration/config.js";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return stack
        ? `${timestamp} [${level}]: ${message}\n${stack}`
        : `${timestamp} [${level}]: ${message}${metaStr}`;
});

const transports = [
    // Console output (colorized)
    new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            logFormat
        ),
    }),
];

// File transports (opt-in via ENABLE_FILE_LOGS=true)
if (config.enableFileLogs) {
    transports.push(
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
        new winston.transports.File({
            filename: "logs/combined.log",
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        })
    );
}

const logger = winston.createLogger({
    level: config.logLevel || "info",
    format: combine(
        errors({ stack: true }),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports,
});

export default logger;
