# n8n-nodes-wsystem

n8n community node for the [W System EU Business Data API](https://wsystem.dev) (`https://api.wsystem.dev`).

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation
In n8n: **Settings → Community Nodes → Install** and enter `n8n-nodes-wsystem`.
See the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Operations
| Resource | Operation | Endpoint |
|---|---|---|
| VAT | Check (VIES, with consultation number) | `GET /verify` |
| VAT | Check Batch (up to 100) | `POST /verify/batch` |
| EORI | Check (EC EOS) | `GET /eori` |
| Company | Look Up (FR, NO, FI, CZ, PL, EE registers; GLEIF elsewhere) | `GET /company` |
| Sanction | Screen (EU, UN, OFAC SDN, UK) | `GET /sanctions/screen` |
| KYB | Check (VAT + registry + sanctions → pass/review/fail) | `POST /kyb/check` |

The node is `usableAsTool`, so AI Agent nodes can call it.

## Credentials
Optional. Without credentials the node uses the free tier (20 calls/day per IP).
For more volume add a **W System API** credential with your API key (sent as `X-API-Key`).

## Compatibility
Built with `@n8n/node-cli`, n8n Nodes API v1. Tested against n8n 1.x / 2.x.

## Resources
- [API docs / OpenAPI](https://api.wsystem.dev/docs) · [llms.txt](https://wsystem.dev/llms.txt)
- [n8n community nodes docs](https://docs.n8n.io/integrations/#community-nodes)

## License
MIT © W System
