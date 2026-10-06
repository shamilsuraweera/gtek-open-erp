/**
 * Exact decimal arithmetic for DECIMAL(19,4) money columns, which are
 * surfaced as strings by decimalTransformer specifically to avoid float
 * drift. These helpers convert to/from integer ten-thousandths so sums
 * and comparisons never touch floating point.
 */
export function toMinorUnits(value: string): number {
  const trimmed = value.trim();
  const negative = trimmed.startsWith('-');
  const unsigned = trimmed.replace(/^-/, '');
  const [whole, fraction = ''] = unsigned.split('.');
  const paddedFraction = (fraction + '0000').slice(0, 4);
  const minorUnits = parseInt(whole || '0', 10) * 10000 + parseInt(paddedFraction, 10);
  return negative ? -minorUnits : minorUnits;
}

export function fromMinorUnits(minorUnits: number): string {
  const negative = minorUnits < 0;
  const abs = Math.abs(minorUnits);
  const whole = Math.floor(abs / 10000);
  const fraction = String(abs % 10000).padStart(4, '0');
  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

/**
 * Multiplies two exact decimal values expressed as integer minor units
 * (ten-thousandths), returning the product in the same minor-unit scale.
 * Multiplying two already-scaled integers (each x10^4) yields a raw
 * product scaled by x10^8; this rescales back down to x10^4 with standard
 * rounding rather than truncating or reintroducing float math. Note: for
 * extreme values (well beyond any realistic invoice quantity x price) the
 * raw product could exceed Number.MAX_SAFE_INTEGER before rounding; this
 * is not handled with BigInt since no real ERP line item approaches that
 * range.
 */
export function multiplyMinorUnits(aMinor: number, bMinor: number): number {
  return Math.round((aMinor * bMinor) / 10000);
}

/**
 * mssql/tedious hands back SQL Server's DECIMAL SUM as a JS number. The SUM
 * itself is computed exactly by T-SQL's decimal engine (no float involved
 * server-side) — the only float boundary is this single wire conversion.
 * Reformatting to a canonical 4-decimal string here does not (and cannot)
 * recover precision already lost crossing that boundary; for realistic
 * ERP magnitudes (far below the ~15-17 significant digits a JS double can
 * hold exactly) this is a non-issue in practice. A NULL aggregate (no
 * matching rows) is treated as zero rather than surfaced as null/NaN.
 */
export function formatAggregate(value: number | string | null | undefined): string {
  return Number(value ?? 0).toFixed(4);
}
