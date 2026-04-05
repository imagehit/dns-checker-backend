import dns from "dns/promises"
import { COMMON_SELECTORS } from "../constants/commanSelectors.constants.js"
import logger from "../utils/logger.js"


// ─── Low-level resolvers ────────────────────────────────────────────

const findDnsTXTRecords = async (domain) => {
    try {
        const records = await dns.resolveTxt(domain);
        return records;
    } catch (error) {
        logger.warn(`TXT lookup failed for ${domain}: ${error.message}`);
        return null;
    }
}

const resolve = async (domain, type) => {
    try {
        const records = await dns.resolve(domain, type);
        return records;
    } catch (error) {
        logger.warn(`${type} lookup failed for ${domain}: ${error.message}`);
        return null;
    }
}


// ─── Individual record checkers ─────────────────────────────────────

const checkA = async (domain) => {
    const records = await resolve(domain, "A");
    return {
        type: "A",
        found: !!(records && records.length),
        records: records || [],
    };
}

const checkAAAA = async (domain) => {
    const records = await resolve(domain, "AAAA");
    return {
        type: "AAAA",
        found: !!(records && records.length),
        records: records || [],
    };
}

const checkMX = async (domain) => {
    const records = await resolve(domain, "MX");
    return {
        type: "MX",
        found: !!(records && records.length),
        records: records || [],
    };
}

const checkNS = async (domain) => {
    const records = await resolve(domain, "NS");
    return {
        type: "NS",
        found: !!(records && records.length),
        records: records || [],
    };
}

const checkCNAME = async (domain) => {
    const records = await resolve(domain, "CNAME");
    return {
        type: "CNAME",
        found: !!(records && records.length),
        records: records || [],
    };
}

const checkSOA = async (domain) => {
    try {
        const record = await dns.resolveSoa(domain);
        return {
            type: "SOA",
            found: !!record,
            record: record || null,
        };
    } catch (error) {
        logger.warn(`SOA lookup failed for ${domain}: ${error.message}`);
        return { type: "SOA", found: false, record: null };
    }
}

const checkTXT = async (domain) => {
    const records = await findDnsTXTRecords(domain);
    return {
        type: "TXT",
        found: !!(records && records.length),
        records: records ? records.flat() : [],
    };
}

const checkCAA = async (domain) => {
    const records = await resolve(domain, "CAA");
    return {
        type: "CAA",
        found: !!(records && records.length),
        records: records || [],
    };
}

const checkSRV = async (domain) => {
    const records = await resolve(domain, "SRV");
    return {
        type: "SRV",
        found: !!(records && records.length),
        records: records || [],
    };
}

const checkPTR = async (domain) => {
    const records = await resolve(domain, "PTR");
    return {
        type: "PTR",
        found: !!(records && records.length),
        records: records || [],
    };
}


// ─── Email-specific checkers (SPF / DMARC / DKIM) ──────────────────

const checkSPF = async (domain) => {
    try {
        const records = await findDnsTXTRecords(domain);
        let found = false;

        if (!records || records.length === 0) {
            return {
                found, spfRecord: null
            }
        }

        const spfRecord = records
            .flat()
            .find(r => r.startsWith('v=spf1'));

        if (!spfRecord) {
            return {
                found,
                spfRecord: null,
                message: "No SPF Record Found"
            }
        }

        return {
            found: true,
            spfRecord,
            values: spfRecord.split(" ")
        }
    } catch (error) {
        logger.error("SPF check failed", error);
    }
}

const checkDMARC = async (domain) => {
    try {
        const records = await findDnsTXTRecords(`_dmarc.${domain}`);
        if (!records || records.length == 0) {
            return {
                found: false,
                dmarcRecord: null,
                message: "No DMARC Record Found"
            }
        }
        const dmarcRecord = records.flat().find(r => r.startsWith('v=DMARC1'));

        if (!dmarcRecord) {
            return {
                found: false,
                dmarcRecord: null,
                message: "No DMARC Record Found"
            }
        }

        return {
            found: true,
            dmarcRecord,
            values: dmarcRecord.split(" ")
        }
    } catch (error) {
        logger.error("DMARC check failed", error);
    }
}

const checkDKIM = async (domain, selector) => {
    try {
        // If a specific selector is provided, check only that one
        if (selector) {
            const records = await findDnsTXTRecords(`${selector}._domainkey.${domain}`);

            if (!records || records.length === 0) {
                return { found: false, selector, record: null, message: "No DKIM record found" };
            }

            const dkimRecord = records
                .flat()
                .find(r => r.startsWith('v=DKIM1') || r.includes('p='));

            if (!dkimRecord) {
                return { found: false, selector, record: null, message: "No DKIM record found" };
            }

            return { found: true, selector, record: dkimRecord };
        }

        // No selector provided — try all common selectors
        const results = await Promise.all(
            COMMON_SELECTORS.map(async (sel) => {
                const records = await findDnsTXTRecords(`${sel}._domainkey.${domain}`);
                if (!records || records.length === 0) return null;

                const dkimRecord = records
                    .flat()
                    .find(r => r.startsWith('v=DKIM1') || r.includes('p='));

                return dkimRecord ? { selector: sel, record: dkimRecord } : null;
            })
        );

        const found = results.filter(Boolean);

        return {
            found: found.length > 0,
            selectorsChecked: COMMON_SELECTORS,
            records: found,
        };
    } catch (error) {
        logger.error("DKIM check failed", error);
    }
}


// ─── Fetch ALL records for a domain ─────────────────────────────────

const fetchAllRecords = async (domain, dkimSelector = "google") => {
    const [
        a, aaaa, mx, ns, cname, soa, txt, caa, srv, ptr,
        spf, dmarc, dkim
    ] = await Promise.allSettled([
        checkA(domain),
        checkAAAA(domain),
        checkMX(domain),
        checkNS(domain),
        checkCNAME(domain),
        checkSOA(domain),
        checkTXT(domain),
        checkCAA(domain),
        checkSRV(domain),
        checkPTR(domain),
        checkSPF(domain),
        checkDMARC(domain),
        checkDKIM(domain, dkimSelector),
    ]);

    const unwrap = (result) => result.status === "fulfilled" ? result.value : null;

    return {
        domain,
        a: unwrap(a),
        aaaa: unwrap(aaaa),
        mx: unwrap(mx),
        ns: unwrap(ns),
        cname: unwrap(cname),
        soa: unwrap(soa),
        txt: unwrap(txt),
        caa: unwrap(caa),
        srv: unwrap(srv),
        ptr: unwrap(ptr),
        spf: unwrap(spf),
        dmarc: unwrap(dmarc),
        dkim: unwrap(dkim),
    };
}


export {
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
}