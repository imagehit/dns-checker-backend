import express from "express";

const router = express.Router();

import dnsCheckRouter from "./dnsCheck.router.js";

// register v1 routers


router.use("/check", dnsCheckRouter);


export default router;

