// Generates a reviewable search plan only. Does not contact or scrape search engines.
import {pathToFileURL} from 'node:url';
export function discoveryPlan() {
  const groups = {
    app_directories: ['"submit app" "Android" "free" directory', '"submit startup" "free" "finance"', '"diretório" "aplicativos" "cadastrar"', '"submit your tool" "calculator" free'],
    driver_editorial: ['"motoristas de aplicativo" "envie sua pauta"', '"custo por km" "contato" redação', '"mobilidade" "sugestão de pauta"', '"motoristas" "ganhos" "imprensa"'],
    resource_pages: ['"motoristas de aplicativo" "ferramentas úteis"', '"motoristas" "recursos" "calculadora"', '"ride share drivers" "resources" calculator', '"mobilidade" "links úteis"'],
    competitor_mentions: ['"Drivvo" "calculadora" "motoristas"', '"Fuelio" "motorista" "custos"', '"GigU" "ferramentas" "motoristas"', '"StopClub" "calculadora" "lucro"']
  };
  return {mode:'plan_only', note:'Execute searches manually or through an approved MCP search tool; no search-engine scraping. Results are unverified leads, not eligible opportunities.', queries:Object.entries(groups).flatMap(([category, queries]) => queries.map(query => ({category, query, searchUrl:`https://www.google.com/search?q=${encodeURIComponent(query)}`})))};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.stdout.write(JSON.stringify(discoveryPlan(), null, 2) + '\n');
