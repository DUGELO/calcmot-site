/**
 * Motor financeiro puro da calculadora de corrida.
 * Valores monetários em centavos, distâncias em metros e custo/km em milésimos
 * de real: a entrada decimal nunca é somada como float.
 */
export type RideField =
  | 'fare'
  | 'pickupKm'
  | 'tripKm'
  | 'tripMinutes'
  | 'pickupMinutes'
  | 'costPerKm';

export type RideInputs = Readonly<Record<RideField, string>>;
export type RideErrors = Partial<Record<RideField, string>>;

export interface RideMetrics {
  readonly fareCents: number;
  readonly totalMeters: number;
  readonly totalMinutes: number;
  readonly grossPerKmCents: number;
  readonly grossPerHourCents: number;
  readonly costCents: number | null;
  readonly balanceCents: number | null;
  readonly balancePerHourCents: number | null;
}

export type RideCalculation =
  | { readonly ok: true; readonly metrics: RideMetrics; readonly errors: RideErrors }
  | { readonly ok: false; readonly metrics: null; readonly errors: RideErrors };

const LIMITS = {
  fare: 1_000_000, // R$ 10.000,00 em centavos
  distance: 1_000_000, // 1.000 km em metros
  minutes: 1_440, // 24 horas
  cost: 100_000, // R$ 100,000 por km em milésimos
} as const;

function decimalUnits(raw: string, decimals: number): number | null {
  const value = raw.trim();
  const pattern = decimals === 0 ? /^\d+$/ : new RegExp(`^\\d+(?:[,.]\\d{1,${decimals}})?$`);
  if (!pattern.test(value)) return null;
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const result = Number(whole) * 10 ** decimals + Number(fraction.padEnd(decimals, '0'));
  return Number.isSafeInteger(result) ? result : null;
}

export function calculateRide(inputs: RideInputs): RideCalculation {
  const errors: RideErrors = {};

  function read(
    field: RideField,
    decimals: number,
    max: number,
    required: boolean,
    positive: boolean,
  ): number | null {
    const raw = inputs[field].trim();
    if (!raw) {
      if (required) errors[field] = 'Informe este valor.';
      return required ? null : 0;
    }
    const value = decimalUnits(raw, decimals);
    if (value === null) {
      errors[field] = `Use um número positivo, sem separador de milhar (até ${decimals} casas decimais).`;
      return null;
    }
    if (value > max) {
      errors[field] = 'Valor acima do limite permitido.';
      return null;
    }
    if (positive && value === 0) {
      errors[field] = 'O valor precisa ser maior que zero.';
      return null;
    }
    return value;
  }

  const fareCents = read('fare', 2, LIMITS.fare, true, true);
  const pickupMeters = read('pickupKm', 3, LIMITS.distance, false, false);
  const tripMeters = read('tripKm', 3, LIMITS.distance, true, true);
  const tripMinutes = read('tripMinutes', 0, LIMITS.minutes, true, true);
  const pickupMinutes = read('pickupMinutes', 0, LIMITS.minutes, false, false);
  // Campo vazio significa custo desconhecido; zero explícito é válido.
  const costRaw = inputs.costPerKm.trim();
  const costMillis = costRaw ? read('costPerKm', 3, LIMITS.cost, false, false) : null;

  const totalMeters = pickupMeters !== null && tripMeters !== null ? pickupMeters + tripMeters : null;
  const totalMinutes =
    pickupMinutes !== null && tripMinutes !== null ? pickupMinutes + tripMinutes : null;

  if (totalMeters !== null && totalMeters > LIMITS.distance) {
    errors.pickupKm = 'A soma das distâncias deve ser de até 1.000 km.';
  }
  if (totalMinutes !== null && totalMinutes > LIMITS.minutes) {
    errors.pickupMinutes = 'A soma dos tempos deve ser de até 1.440 minutos.';
  }

  if (
    Object.keys(errors).length ||
    fareCents === null ||
    totalMeters === null ||
    totalMeters <= 0 ||
    totalMinutes === null ||
    totalMinutes <= 0 ||
    (costRaw && costMillis === null)
  ) {
    return { ok: false, metrics: null, errors };
  }

  const costCents =
    costMillis === null ? null : Math.round((totalMeters * costMillis) / 10_000);
  const balanceCents = costCents === null ? null : fareCents - costCents;

  return {
    ok: true,
    errors: {},
    metrics: {
      fareCents,
      totalMeters,
      totalMinutes,
      grossPerKmCents: Math.round((fareCents * 1_000) / totalMeters),
      grossPerHourCents: Math.round((fareCents * 60) / totalMinutes),
      costCents,
      balanceCents,
      balancePerHourCents:
        balanceCents === null ? null : Math.round((balanceCents * 60) / totalMinutes),
    },
  };
}
