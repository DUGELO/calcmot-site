import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {verifyBacklink} from './verify.mjs';
import {fetchPublic} from './network.mjs';
import {report, markdown} from './report.mjs';

// State is reconstructed from the checked-in inventory plus the latest Action artifact.
// Never turn a transient network failure into a lost backlink or re-send submissions.
export function reconcile(inventory, previous) {
  const prior = new Map((previous?.targets || []).map(t => [t.id, t]));
  const merged = inventory.targets.map(t => {
    const old = prior.get(t.id);
    if (!old || !t.publishedUrl || t.publishedUrl !== old.publishedUrl) return structuredClone(t);
    return {...structuredClone(t), verification: old.verification || t.verification,
      lastAttempt: old.lastAttempt || null,
      stage: old.stage === 'lost' || old.stage === 'link_confirmed' ? old.stage : t.stage};
  });
  // Preserve verified external links discovered in the previous cycle; leave all other
  // new entries to the versioned inventory and human-reviewed additions.
  const ids = new Set(merged.map(t => t.id));
  for (const t of prior.values()) if (!ids.has(t.id) && t.publishedUrl && t.verification) {
    merged.push(structuredClone(t)); ids.add(t.id);
  }
  return {...structuredClone(inventory), targets: merged};
}

export async function runCycle(inventory, previous, {
  check = (url, old, maxBytes) => verifyBacklink(url, {
    previous: old,
    fetchPage: next => fetchPublic(next, {maxBytes})
  })
} = {}) {
  const data = reconcile(inventory, previous);
  const outcomes = {present: 0, missing: 0, temporary_error: 0, not_checked: 0};
  for (const t of data.targets) {
    if (!t.publishedUrl) {outcomes.not_checked++; continue;}
    const maxBytes = t.verificationMaxBytes ?? 1024 * 1024;
    if (!Number.isInteger(maxBytes) || maxBytes < 1024 || maxBytes > 8388608) {
      outcomes.temporary_error++;
      t.lastAttempt = {outcome:'temporary_error', error:'Invalid maxBytes configuration', checkedAt:new Date().toISOString()};
      continue;
    }
    let attempt;
    try {attempt = await check(t.publishedUrl, t.verification ?? null, maxBytes);}
    catch (error) {attempt = {outcome:'temporary_error', error:String(error.message || error), checkedAt:new Date().toISOString()};}
    if (!['present','missing','temporary_error'].includes(attempt.outcome)) {
      attempt = {outcome:'temporary_error', error:'Unknown verification outcome', checkedAt:new Date().toISOString()};
    }
    outcomes[attempt.outcome]++;
    t.lastAttempt = {outcome:attempt.outcome, error:attempt.error ?? null, checkedAt:attempt.checkedAt ?? new Date().toISOString()};
    if (attempt.outcome === 'temporary_error') continue;
    t.verification = attempt;
    if (attempt.outcome === 'present') t.stage = 'link_confirmed';
    else if (attempt.lostAt) t.stage = 'lost';
    else if (t.stage === 'link_confirmed') t.stage = 'published';
  }
  data.lastCycle = {finishedAt:new Date().toISOString(), outcomes, persistentState:'artifact'};
  return data;
}

export async function main(argv = process.argv.slice(2)) {
  const [inventoryPath, checkpointPath, statePath, reportPath] = argv;
  if (!inventoryPath || !checkpointPath || !statePath || !reportPath)
    throw Error('Usage: persistent-cycle.mjs inventory.json prior-state.json state.json report.md');
  const inventory = JSON.parse(await fs.readFile(inventoryPath, 'utf8'));
  let previous;
  try {previous = JSON.parse(await fs.readFile(checkpointPath, 'utf8'));}
  catch (error) {if (error.code !== 'ENOENT') throw error;}
  const state = await runCycle(inventory, previous);
  await fs.writeFile(statePath, JSON.stringify(state, null, 2) + '\n');
  let ledger;
  try {ledger = JSON.parse(await fs.readFile('docs/growth/execution-log.json','utf8'));}
  catch (error) {if (error.code !== 'ENOENT') throw error;}
  const result = report(state,ledger);
  result.cycle = state.lastCycle;
  result.note = 'Links = last successful verification, possibly from an earlier cycle if current check failed; review lastAttempt timestamps.';
  await fs.writeFile(reportPath, markdown(result) + '\n\n## Persistência\n' +
    'Falhas transitórias não apagam a última comprovação; confirme lastAttempt e checkedAt antes de descrever como verificado agora.\n' +
    JSON.stringify(state.lastCycle, null, 2) + '\n');
  await fs.writeFile(reportPath.replace(/\.md$/, '') + '.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({verifiedLastKnown: result.verifiedLinks, domainsLastKnown: result.referringDomains, cycle:state.lastCycle},null,2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(err=>{console.error(err);process.exitCode=1;});
