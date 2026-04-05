import {
    checkA,
    checkAAAA,
    checkMX,
    checkNS,
    checkCNAME,
    checkSOA,
    checkTXT,
    checkCAA,
    checkSRV,
    checkPTR,
    checkSPF,
    checkDMARC,
    checkDKIM,
    fetchAllRecords,
} from "../services/dnsEngine.service.js";


// ─── Fetch ALL records at once ──────────────────────────────────────

const getAllRecords = async (req, res) => {
    const { domain, dkimSelector } = req.body;
    const data = await fetchAllRecords(domain, dkimSelector);
    res.send({ status: "success", data });
};


// ─── Standard DNS record controllers ────────────────────────────────

const getARecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkA(domain);
    res.send({ status: "success", data });
};

const getAAAARecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkAAAA(domain);
    res.send({ status: "success", data });
};

const getMXRecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkMX(domain);
    res.send({ status: "success", data });
};

const getNSRecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkNS(domain);
    res.send({ status: "success", data });
};

const getCNAMERecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkCNAME(domain);
    res.send({ status: "success", data });
};

const getSOARecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkSOA(domain);
    res.send({ status: "success", data });
};

const getTXTRecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkTXT(domain);
    res.send({ status: "success", data });
};

const getCAARecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkCAA(domain);
    res.send({ status: "success", data });
};

const getSRVRecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkSRV(domain);
    res.send({ status: "success", data });
};

const getPTRRecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkPTR(domain);
    res.send({ status: "success", data });
};


// ─── Email-specific record controllers ──────────────────────────────

const getSPFRecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkSPF(domain);
    res.send({ status: "success", data });
};

const getDKIMRecord = async (req, res) => {
    const { domain, selector } = req.body;
    const data = await checkDKIM(domain, selector);
    res.send({ status: "success", data });
};

const getDMARCRecord = async (req, res) => {
    const { domain } = req.body;
    const data = await checkDMARC(domain);
    res.send({ status: "success", data });
};


export {
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
};
