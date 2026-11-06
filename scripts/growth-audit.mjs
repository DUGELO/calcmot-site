import fs from 'node:fs/promises';
import {normalizeUrl, STATES, LEGACY_STATES, normalizeStage, liveVerification} from './growth/model.mjs';
import {report, markdown} from './growth/report.mjs';
const data = JSON.parse(await fs.readFile(process.argv[3] || 'docs/growth/prospects.json', 'utf8'));
const ids = new Set(), urls = new Set();
for (const t of data.targets) {
  const url = normalizeUrl(t.submitUrl);
  if (!t.id || ids.has(t.id) || urls.has(url)) throw Error(`Duplicate identity: ${t.id}`);
  ids.add(t.id); urls.add(url);
  if (!['not_sent', ...STATES, ...LEGACY_STATES].includes(normalizeStage(t.submissionStatus))) throw Error(`Invalid status: ${t.id}`);
  if (t.stage && ![...STATES, ...LEGACY_STATES].includes(normalizeStage(t.stage))) throw Error(`Invalid stage: ${t.id}`);
  if ((t.stage === 'link_confirmed' || t.submissionStatus === 'link_confirmed') && !liveVerification(t.verification)) throw Error(`Unverified link confirmation: ${t.id}`);
  if ((t.submissionStatus === 'published' || t.stage === 'published') && !t.publishedUrl) throw Error(`Missing declared publication URL: ${t.id}`);
  if (t.publishedUrl) normalizeUrl(t.publishedUrl);
}
const output = process.argv[2] || 'growth-outreach-report.md';
let ledger;
try {ledger = JSON.parse(await fs.readFile('docs/growth/execution-log.json', 'utf8'));} catch (error) {if (error.code !== 'ENOENT') throw error;}
const r = report(data, ledger);
await fs.writeFile(output, markdown(r));
await fs.writeFile(output.replace(/\.md$/, '') + '.json', JSON.stringify(r, null, 2) + '\n');
console.log(`Audited ${data.targets.length} prospects: ${output}`);
