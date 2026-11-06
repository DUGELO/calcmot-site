export function parseRequest(payload, workingRef = 'main') {
  if (typeof payload !== 'string' || payload.length > 300_000) throw new Error('Solicitação editorial inválida.');
  const value = JSON.parse(payload);
  const repo = value.repository, context = value.context;
  if (value.source !== 'pages-cms' || repo?.owner?.toLowerCase() !== 'dugelo' || repo?.repo !== 'calcmot-content' || repo.ref !== workingRef || !/^[a-f0-9]{40}$/.test(repo.sha ?? '') || context?.type !== 'entry' || context.name !== 'articles' || !/^articles\/[a-z0-9][a-z0-9-]{0,119}\.md$/.test(context.path ?? '') || !/^[a-f0-9]{40}$/.test(context.data?.sha ?? '') || !['publish','withdraw','recover'].includes(value.action?.name)) throw new Error('A solicitação não corresponde a um artigo salvo neste projeto.');
  const steps = Number(value.inputs?.steps ?? 1);
  if (value.action.name === 'recover' && (!Number.isInteger(steps) || steps < 1 || steps > 10)) throw new Error('Escolha um salvamento anterior válido.');
  return { operation: value.action.name, path: context.path, sourceRevision: repo.sha, sourceBlob: context.data.sha, steps };
}
export function productionGate(env) {
  if (env.CALCMOT_DEPLOY_AUTHORITY !== 'private-actions' || env.CALCMOT_PRODUCTION_ENABLED !== 'true' || env.GITHUB_REPOSITORY?.toLowerCase() !== 'dugelo/calcmot-content' || env.GITHUB_REF !== 'refs/heads/main') throw new Error('Publicação de produção ainda não autorizada. O rascunho está salvo e o site permanece inalterado.');
}
export function cloudflareBuildGate(env) {
  if (env.WORKERS_CI === '1' && env.WORKERS_CI_BRANCH === 'main') throw new Error('O deploy de produção deve ser coordenado pelo repositório editorial privado.');
  if (!env.CALCMOT_CONTENT_ROOT && env.CALCMOT_ALLOW_EMPTY_CONTENT !== '1' && !(env.WORKERS_CI === '1' && env.WORKERS_CI_BRANCH && env.WORKERS_CI_BRANCH !== 'main')) throw new Error('Snapshot publicado obrigatório; para QA vazio use CALCMOT_ALLOW_EMPTY_CONTENT=1.');
}
