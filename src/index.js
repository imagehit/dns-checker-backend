import express from 'express'
import config from './configuration/config.js'
import logger from './utils/logger.js'


const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// import routes
import healthRouter from './routes/health.route.js';
import v1Router from './routes/v1/index.js';

// register routes
app.use("/health", healthRouter)
app.use("/api/v1", v1Router)



app.listen(config.port, (err, data) => {
    if (err) {
        logger.error("Failed to start server", err);
    }
    logger.info(`Server is running on port ${config.port}`)
})