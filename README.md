# n8n-nodes-wsystem

n8n community node for the [W System EU Business Data API](https://wsystem.dev) (`https://api.wsystem.dev`).

[Installation](#installation) · [Operations](#operations) · [Credentials](#credentials) · [Workflow template](#workflow-template-read-incoming-e-invoices-from-email) · [Compatibility](#compatibility) · [Resources](#resources)

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
| E-Invoice | Parse (UBL, CII, XRechnung, ZUGFeRD/Factur-X PDF → JSON: parties, totals, VAT, IBAN, lines) | `POST /einvoice/parse` |
| E-Invoice | Validate (official EN 16931 + XRechnung rules, with rule IDs and fix hints) | `POST /einvoice/validate` |

E-Invoice input: paste the XML, or pick **Base64 File** and feed it from **Extract From File → Move File to Base64 String** (works for XML and ZUGFeRD/Factur-X PDFs, e.g. invoice attachments from an email trigger).

The node is `usableAsTool`, so AI Agent nodes can call it.

## Workflow template: read incoming e-invoices from email
[`examples/read-incoming-einvoices-from-email.json`](examples/read-incoming-einvoices-from-email.json) needs no community node: import it (**Workflows → Import from File**), set your IMAP credential, and every XML or PDF attachment (XRechnung, ZUGFeRD/Factur-X, UBL, CII) goes to `POST /einvoice/parse` as the raw file. Non-invoice files are skipped, and each invoice becomes one row (number, date, seller, VAT ID, currency, totals, IBAN) you can send on to Google Sheets or your accounting tool. It runs on the free tier; paste a free key into the `X-API-Key` header for more volume.

## Credentials
Optional. Without credentials the node uses the free tier (20 calls/day per IP).
For more volume add a **W System API** credential with your API key (sent as `X-API-Key`).

## Compatibility
Built with `@n8n/node-cli`, n8n Nodes API v1. Tested against n8n 1.x / 2.x.

## Resources
- [API docs / OpenAPI](https://api.wsystem.dev/docs?ref=n8n-github) · [llms.txt](https://wsystem.dev/llms.txt)
- [n8n community nodes docs](https://docs.n8n.io/integrations/#community-nodes)

## License
MIT © W System
