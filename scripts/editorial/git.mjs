import { execFileSync } from 'node:child_process';
import { contentPath } from './snapshot.mjs';
export function git(root, args, binary = false) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: binary ? undefined : 'utf8', maxBuffer: 12 * 1024 * 1024, stdio: ['pipe','pipe','pipe'] }); }
  catch { throw new Error('A operação de versão editorial falhou. Nenhum histórico foi sobrescrito.'); }
}
export function isAncestor(root, older, newer) {
  try { execFileSync('git', ['-C', root, 'merge-base', '--is-ancestor', older, newer], { stdio: 'ignore' }); return true; }
  catch { return false; }
}
export function gitRead(root, revision, path) {
  contentPath(path);
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Revisão inválida.');
  const info = git(root, ['ls-tree', revision, '--', path]).trim();
  if (!info.startsWith('100644 blob ') && !info.startsWith('100755 blob ')) throw new Error('Artigo ou imagem ausente ou inseguro na revisão selecionada.');
  return git(root, ['show', revision + ':' + path], true);
}
export function verifyRequestRevision(root, request, branchHead, previousEntry) {
  if (!isAncestor(root, request.sourceRevision, branchHead)) throw new Error('A revisão editorial não pertence ao histórico autorizado.');
  const blob = git(root, ['rev-parse', request.sourceRevision + ':' + request.path]).trim();
  if (blob !== request.sourceBlob) throw new Error('O artigo mudou desde que foi aberto. Reabra o artigo salvo antes de publicar.');
  if (previousEntry && previousEntry.sourceRevision !== request.sourceRevision && isAncestor(root, request.sourceRevision, previousEntry.sourceRevision)) throw new Error('Uma revisão mais recente deste artigo já foi processada.');
}
export function promote(root, commit, expected) {
  const current = git(root, ['ls-remote', 'origin', 'refs/heads/published']).split(/\s/)[0];
  if (current !== expected) throw new Error('Outra publicação avançou. A versão aprovada não foi sobrescrita.');
  // A normal fast-forward push is a second, server-enforced CAS. Never force push.
  git(root, ['push', 'origin', commit + ':refs/heads/published']);
}
