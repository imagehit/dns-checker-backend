import dns from "dns/promises";
import net from "net";
import { disposableDomains } from "../constants/disposableEmails.js";

export const validateSyntax = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const checkDisposable = (domain) => {
    return disposableDomains.has(domain.toLowerCase());
};

export const checkDomainDNS = async (domain) => {
    let hasMx = false;
    let hasA = false;
    let mxHosts = [];
    
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
            hasMx = true;
            mxHosts = mxRecords
                .sort((a, b) => a.priority - b.priority)
                .map(r => r.exchange);
        }
    } catch (error) {
        hasMx = false;
    }

    if (!hasMx) {
        try {
            const aRecords = await dns.resolve(domain, 'A');
            if (aRecords && aRecords.length > 0) {
                hasA = true;
            }
        } catch (error) {
            hasA = false;
        }
    }

    return { hasMx, hasA, isValidDomain: hasMx || hasA, mxHosts };
};

export const checkMailboxExists = async (email, mxHosts) => {
    return new Promise((resolve) => {
        if (!mxHosts || mxHosts.length === 0) {
            return resolve({ exists: "unknown", reason: "No MX hosts provided" });
        }

        const mxHost = mxHosts[0];
        const socket = net.createConnection(25, mxHost);
        socket.setEncoding('utf8');
        socket.setTimeout(5000); // 5 sec timeout

        let step = 0;
        let resultExists = "unknown";
        let lastResponse = "";

        const writeCommand = (cmd) => {
            if (!socket.destroyed) {
                socket.write(cmd + '\r\n');
            }
        };

        socket.on('data', (data) => {
            const lines = data.split('\n');
            for (let line of lines) {
                line = line.trim();
                if (!line || !/^\d{3}/.test(line)) continue;
                lastResponse = line;
                
                const statusCode = parseInt(line.substring(0, 3));
                
                if (step === 0 && statusCode === 220) {
                    step = 1;
                    writeCommand(`HELO validator.local`);
                } else if (step === 1 && statusCode === 250) {
                    step = 2;
                    writeCommand(`MAIL FROM:<hello@validator.local>`);
                } else if (step === 2 && statusCode === 250) {
                    step = 3;
                    writeCommand(`RCPT TO:<${email}>`);
                } else if (step === 3) {
                    if (statusCode === 250 || statusCode === 251) {
                        resultExists = true;
                    } else if (statusCode >= 500) {
                        resultExists = false;
                    } else {
                        resultExists = "unknown";
                    }
                    step = 4;
                    writeCommand(`QUIT`);
                    socket.end();
                    return;
                } else if (statusCode >= 400 && statusCode < 600) {
                    // Unexpected error state during handshake (e.g., 421 Service not available, 554 No SMTP service)
                    resultExists = "unknown";
                    writeCommand(`QUIT`);
                    socket.end();
                    return;
                }
            }
        });

        socket.on('error', (err) => {
            resolve({ exists: "unknown", reason: `Socket error: ${err.message}` });
            socket.destroy();
        });

        socket.on('timeout', () => {
            resolve({ exists: "unknown", reason: `Timeout waiting at step ${step}. Last response: ${lastResponse}` });
            socket.destroy();
        });

        socket.on('end', () => {
            resolve({ exists: resultExists, reason: `Ended at step ${step}. Last response: ${lastResponse}` });
        });
        
        socket.on('close', () => {
            // just in case 'end' hasn't resolved
            resolve({ exists: resultExists, reason: `Connection closed abruptly. Last response: ${lastResponse}` });
        });
    });
};

export const assessBounceRisk = (isValidDomain, isDisposable, mailboxExists) => {
    if (!isValidDomain || mailboxExists === false) return "high";
    if (isDisposable) return "medium"; 
    if (mailboxExists === "unknown") return "medium";
    return "low";
};

export const getVerdict = (isValidSyntax, isValidDomain, bounceRisk, mailboxExists) => {
    if (!isValidSyntax || !isValidDomain || mailboxExists === false) return "invalid";
    if (bounceRisk === "high" || bounceRisk === "medium") return "risky";
    return "valid";
};
