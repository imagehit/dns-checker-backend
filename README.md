# DNS Checker Backend

A Node.js/Express backend API for performing comprehensive DNS record lookups. Query any domain for all standard DNS record types, email authentication records (SPF, DKIM, DMARC), or fetch everything at once.

## Features

- **All DNS Record Types** — A, AAAA, MX, NS, CNAME, SOA, TXT, CAA, SRV, PTR
- **Email Authentication** — SPF, DKIM, DMARC checks
- **DKIM Auto-Discovery** — Automatically tries common selectors (`google`, `selector1`, `selector2`, `default`, `dkim`, `mail`, `k1`, `smtp`) when no selector is provided
- **Fetch All** — Single endpoint to retrieve every record type for a domain in parallel
- **Structured Logging** — Winston-based logger with optional file logging

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express v5
- **Logging:** Winston
- **Architecture:** Routes → Controllers → Services

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm

### Installation

```bash
git clone https://github.com/imagehit/dns-checker-backend.git
cd dns-checker-backend
npm install
```

### Environment Variables

Copy the example env file and configure:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | Log level (`error`, `warn`, `info`, `debug`) |
| `ENABLE_FILE_LOGS` | `false` | Set to `true` to write logs to `logs/` directory |

### Run

```bash
# Development (with hot-reload)
npm run dev
```

## API Reference

Base URL: `http://localhost:3000`

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

### DNS Record Endpoints

All endpoints are `POST` requests under `/api/v1/check/` and accept a JSON body with `{ "domain": "example.com" }`.

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/check/all` | `{ "domain", "dkimSelector?" }` | Fetch all record types at once |
| `POST` | `/api/v1/check/a` | `{ "domain" }` | A records (IPv4) |
| `POST` | `/api/v1/check/aaaa` | `{ "domain" }` | AAAA records (IPv6) |
| `POST` | `/api/v1/check/mx` | `{ "domain" }` | MX records (mail exchange) |
| `POST` | `/api/v1/check/ns` | `{ "domain" }` | NS records (nameservers) |
| `POST` | `/api/v1/check/cname` | `{ "domain" }` | CNAME records |
| `POST` | `/api/v1/check/soa` | `{ "domain" }` | SOA record |
| `POST` | `/api/v1/check/txt` | `{ "domain" }` | TXT records |
| `POST` | `/api/v1/check/caa` | `{ "domain" }` | CAA records |
| `POST` | `/api/v1/check/srv` | `{ "domain" }` | SRV records |
| `POST` | `/api/v1/check/ptr` | `{ "domain" }` | PTR records (reverse DNS) |

### Email Authentication Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/check/spf` | `{ "domain" }` | SPF record check |
| `POST` | `/api/v1/check/dkim` | `{ "domain", "selector?" }` | DKIM check (auto-discovers if no selector) |
| `POST` | `/api/v1/check/dmarc` | `{ "domain" }` | DMARC record check |

### Example Request

```bash
curl -X POST http://localhost:3000/api/v1/check/mx \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com"}'
```

### Example Response

```json
{
  "status": "success",
  "data": {
    "type": "MX",
    "found": true,
    "records": [
      { "exchange": "smtp.google.com", "priority": 10 }
    ]
  }
}
```

## Project Structure

```
src/
├── configuration/
│   └── config.js              # Environment config
├── constants/
│   └── commanSelectors.constants.js  # DKIM common selectors
├── controllers/
│   ├── dnsCheck.controller.js # DNS check request handlers
│   └── health.controller.js   # Health check handler
├── routes/
│   ├── health.route.js        # Health route
│   └── v1/
│       ├── index.js           # V1 route aggregator
│       └── dnsCheck.router.js # DNS check routes
├── services/
│   └── dnsEngine.service.js   # Core DNS lookup logic
├── utils/
│   └── logger.js              # Winston logger setup
└── index.js                   # App entry point
```

## Postman Collection

A ready-to-import Postman collection is available at [`docs/dns-checker.postman_collection.json`](docs/dns-checker.postman_collection.json).

## License

ISC
