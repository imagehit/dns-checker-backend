import {
    validateSyntax,
    checkDisposable,
    checkDomainDNS,
    checkMailboxExists,
    assessBounceRisk,
    getVerdict
} from "../services/emailValidation.service.js";

export const verifyEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: "error", message: "Email is required" });
        }

        const syntaxValid = validateSyntax(email);
        
        let domainParts = email.split('@');
        const domain = domainParts.length === 2 ? domainParts[1] : "";

        let domainResult = { hasMx: false, hasA: false, isValidDomain: false, mxHosts: [] };
        let isDisposable = false;
        let mailboxResult = { exists: "unknown", reason: "DNS checks failed or skipped" };

        // Only perform DNS checking if we have a valid syntax and parsable domain
        if (syntaxValid && domain) {
            domainResult = await checkDomainDNS(domain);
            isDisposable = checkDisposable(domain);
            
            // SMTP handshake to check if mailbox actually exists
            if (domainResult.isValidDomain && domainResult.mxHosts.length > 0) {
                mailboxResult = await checkMailboxExists(email, domainResult.mxHosts);
            } else if (domainResult.isValidDomain && domainResult.hasA) {
                mailboxResult = { exists: "unknown", reason: "Fallback A record found but no MX, cannot verify mailbox via SMTP" };
            }
        }

        const mailboxExists = mailboxResult.exists;
        const bounceRisk = assessBounceRisk(domainResult.isValidDomain, isDisposable, mailboxExists);
        const verdict = getVerdict(syntaxValid, domainResult.isValidDomain, bounceRisk, mailboxExists);

        const responseData = {
            email,
            syntax: {
                valid: syntaxValid
            },
            domain: {
                hasMx: domainResult.hasMx,
                hasA: domainResult.hasA,
                valid: domainResult.isValidDomain,
                isDisposable
            },
            mailbox: mailboxResult, // contains 'exists' and 'reason'
            bounceRisk, // low, medium, high
            verdict     // valid, risky, invalid
        };

        return res.json({ status: "success", data: responseData });
    } catch (error) {
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};
