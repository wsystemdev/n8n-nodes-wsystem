// Simulates n8n declarative routing for the E-Invoice resource and calls the live API.
// Usage: node test/routing_smoke.mjs <ubl.xml> <pdf.b64>   (after npm run build)
import { createRequire } from 'module'; import fs from 'fs';
const require = createRequire(import.meta.url);
const { WSystem } = require('../dist/nodes/WSystem/WSystem.node.js');
const d = new WSystem().description;
const visible = (p, params) => !p.displayOptions?.show || Object.entries(p.displayOptions.show).every(([k, v]) => v.includes(params[k]));
function build(params) {
  const req = { method: 'GET', url: '', qs: {}, body: {} };
  for (const p of d.properties) {
    if (!visible(p, params)) continue;
    if (p.name === 'operation') { const o = p.options.find(o => o.value === params.operation); Object.assign(req, o.routing.request); continue; }
    const s = p.routing?.send; if (!s) continue;
    const v = params[p.name] ?? p.default; (s.type === 'query' ? req.qs : req.body)[s.property] = v;
  }
  return req;
}
const xml = fs.readFileSync(process.argv[2] || '/tmp/ubl.xml', 'utf8'), b64 = fs.readFileSync(process.argv[3] || '/tmp/zf.b64', 'utf8');
const cases = [
  [{ resource: 'einvoice', operation: 'parse', inputType: 'xml', xml }, j => j.invoice.totals.amount_due, '250.33'],
  [{ resource: 'einvoice', operation: 'parse', inputType: 'base64', base64: b64 }, j => j.invoice.totals.total_with_vat, '529.87'],
  [{ resource: 'einvoice', operation: 'validate', inputType: 'xml', xml }, j => String(j.valid), 'true'],
];
let ok = 0;
for (const [params, get, want] of cases) {
  const r = build(params);
  if (Object.keys(r.body).length !== 1) throw new Error('body must have exactly one of xml/base64: ' + Object.keys(r.body));
  const url = 'https://api.wsystem.dev' + r.url + (Object.keys(r.qs).length ? '?' + new URLSearchParams(r.qs) : '');
  const res = await fetch(url, { method: r.method, headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(r.body) });
  const j = await res.json(); const got = res.ok ? get(j) : JSON.stringify(j).slice(0, 200);
  console.log(params.operation, params.inputType, r.method, r.url, JSON.stringify(r.qs), res.status, got);
  if (got === want) ok++;
}
console.log(`${ok}/${cases.length} ok`); process.exit(ok === cases.length ? 0 : 1);
