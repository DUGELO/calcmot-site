import fs from 'node:fs/promises';
import {ingest, transition} from './growth/model.mjs';
import {verifyBacklink} from './growth/verify.mjs';
import {fetchPublic} from './growth/network.mjs';
const [command, input, output] = process.argv.slice(2);
const source = JSON.parse(await fs.readFile('docs/growth/prospects.json', 'utf8'));
if (!output) throw Error('Usage: node scripts/growth-engine.mjs ingest|verify|track input.json output.json');
const changes = JSON.parse(await fs.readFile(input, 'utf8'));
let data = structuredClone(source);
if (command === 'ingest') data.targets = ingest(data.targets, changes, {dedupeDomain: process.argv.includes('--dedupe-domain')});
else if (command === 'track') {
  for (const change of changes) {
    const i = data.targets.findIndex(t => t.id === change.id);
    if (i < 0) throw Error(`Unknown prospect: ${change.id}`);
    data.targets[i] = transition(data.targets[i], change.stage, change.evidence);
  }
} else if (command === 'verify') {
  if (!Array.isArray(changes.targets) || changes.targets.length > 50) throw Error('Verification input requires targets, maximum 50');
  data = changes;
  for (const t of data.targets) if (t.publishedUrl) {
    const maxBytes = t.verificationMaxBytes ?? 1024 * 1024;
    if (!Number.isInteger(maxBytes) || maxBytes < 1024 || maxBytes > 8 * 1024 * 1024) throw Error('verificationMaxBytes must be 1024..8388608');
    t.verification = await verifyBacklink(t.publishedUrl, {fetchPage: url => fetchPublic(url, {maxBytes}), previous: t.verification});
    if (t.verification.outcome === 'present') t.stage = 'link_confirmed';
    if (t.verification.lostAt && t.verification.outcome === 'missing') t.stage = 'lost';
  }
} else throw Error('Unknown command');
await fs.writeFile(output, JSON.stringify(data, null, 2) + '\n');
