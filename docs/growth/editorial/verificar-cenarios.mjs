import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

// Fixture editorial original; não altera ou testa o motor de produção.
const csv = readFileSync(new URL('./cenarios-hipoteticos.csv', import.meta.url), 'utf8').trim().split(/\r?\n/);
const headers = csv.shift().split(',');
for (const line of csv) {
  const values = line.split(',');
  const row = Object.fromEntries(headers.map((key, i) => [key, i ? Number(values[i]) : values[i]]));
  const distance = row.busca_km + row.viagem_km + row.retorno_km;
  const minutes = row.busca_min + row.viagem_min + row.espera_min + row.retorno_min;
  assert(distance > 0 && minutes > 0);
  assert(Object.values(row).every(value => typeof value === 'string' || Number.isFinite(value)));
  const cost = Math.round(distance * row.custo_reais_km * 100) + row.extras_centavos;
  assert.equal(cost, row.custo_esperado_centavos, `Custo ${row.cenario}`);
  assert.equal(row.receita_centavos - cost, row.saldo_esperado_centavos, `Saldo ${row.cenario}`);
  assert.equal(Math.round(cost + row.meta_reais_h * 100 * minutes / 60), row.minimo_esperado_centavos, `Mínimo ${row.cenario}`);
  console.log(`${row.cenario}: ${distance} km; ${minutes} min; saldo R$ ${((row.receita_centavos - cost) / 100).toFixed(2)}`);
}
assert.equal(csv.length, 4);
console.log('4 cenários hipotéticos verificados.');
