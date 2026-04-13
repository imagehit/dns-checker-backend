import express from "express";

const router = express.Router();

import dnsCheckRouter from "./dnsCheck.router.js";
import emailValidationRouter from "./emailValidation.router.js";

// register v1 routers


router.use("/check", dnsCheckRouter);
router.use("/email", emailValidationRouter);


export default router;

