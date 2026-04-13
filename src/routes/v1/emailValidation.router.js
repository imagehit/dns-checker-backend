import express from "express";
import { verifyEmail } from "../../controllers/emailValidation.controller.js";

const router = express.Router();

// ─── Verify Email ──────────────────────────────────────────────────
router.post("/verify", verifyEmail);

export default router;
