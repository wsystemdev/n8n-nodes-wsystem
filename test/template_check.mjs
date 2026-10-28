// Checks examples/*.json: valid structure, connections point at real nodes,
// and runs the Code node + the HTTP call against the live API with official samples.
// Usage: node test/template_check.mjs /path/to/ubl.xml /path/to/zugferd.pdf
import fs from 'node:fs';
const wf = JSON.parse(fs.readFileSync(new URL('../examples/read-incoming-einvoices-from-email.json', import.meta.url)));
const names = new Set(wf.nodes.map((n) => n.name));
let fails = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
ok(names.size === wf.nodes.length, 'unique node names');
for (const [from, c] of Object.entries(wf.connections)) {
  ok(names.has(from), `connection source exists: ${from}`);
  for (const branch of c.main) for (const t of branch) ok(names.has(t.node), `connection target exists: ${t.node}`);
}
const code = wf.nodes.find((n) => n.type === 'n8n-nodes-base.code').parameters.jsCode;
const http = wf.nodes.find((n) => n.type === 'n8n-nodes-base.httpRequest').parameters;
const [xmlPath, pdfPath] = process.argv.slice(2);
const b = (p, mime, fileName) => ({ data: fs.readFileSync(p).toString('base64'), mimeType: mime, fileName });
const input = [{ json: { from: 'ap@example.com', subject: 'Invoice' }, binary: {
  attachment_0: b(xmlPath, 'text/xml', 'invoice.xml'),
  attachment_1: b(pdfPath, 'application/pdf', 'ZUGFeRD.PDF'),
  attachment_2: { data: 'aGk=', mimeType: 'image/png', fileName: 'logo.png' },
} }];
const items = new Function('$input', code)({ all: () => input });
ok(items.length === 2, `code node keeps 2 of 3 attachments (got ${items.length})`);
const expect = ['250.33', '529.87'];
for (const [i, it] of items.entries()) {
  const bin = it.binary[http.inputDataFieldName];
  const r = await fetch(http.url, { method: http.method, headers: { 'content-type': bin.mimeType }, body: Buffer.from(bin.data, 'base64') });
  const j = await r.json();
  const t = j.invoice?.totals || {};
  ok(r.status === 200 && (t.amount_due === expect[i] || t.total_with_vat === expect[i]), `${it.json.fileName}: ${r.status} ${j.invoice?.invoice_number} ${t.amount_due}/${t.total_with_vat}`);
}
process.exit(fails ? 1 : 0);
