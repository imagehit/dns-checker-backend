import express from "express"
import {
    getAllRecords,
    getARecord,
    getAAAARecord,
    getMXRecord,
    getNSRecord,
    getCNAMERecord,
    getSOARecord,
    getTXTRecord,
    getCAARecord,
    getSRVRecord,
    getPTRRecord,
    getSPFRecord,
    getDKIMRecord,
    getDMARCRecord,
} from "../../controllers/dnsCheck.controller.js";

const router = express.Router();


// ─── Fetch ALL records at once ──────────────────────────────────────

router.post("/all", getAllRecords);


// ─── Standard DNS record endpoints ─────────────────────────────────

router.post("/a", getARecord);
router.post("/aaaa", getAAAARecord);
router.post("/mx", getMXRecord);
router.post("/ns", getNSRecord);
router.post("/cname", getCNAMERecord);
router.post("/soa", getSOARecord);
router.post("/txt", getTXTRecord);
router.post("/caa", getCAARecord);
router.post("/srv", getSRVRecord);
router.post("/ptr", getPTRRecord);


// ─── Email-specific record endpoints ────────────────────────────────

router.post("/spf", getSPFRecord);
router.post("/dkim", getDKIMRecord);
router.post("/dmarc", getDMARCRecord);


export default router;
