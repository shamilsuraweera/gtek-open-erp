import { ValueTransformer } from 'typeorm';

/**
 * mssql/tedious returns DECIMAL columns as JS numbers, reintroducing float
 * imprecision. Surfacing them as strings stops that imprecision from
 * propagating into application-level arithmetic (use a decimal library,
 * never native +/- on these values).
 *
 * That same driver behavior also drops trailing zeros — a stored value of
 * 59.9700 round-trips back as the JS number 59.97, and a naive
 * String(value) would then read back as "59.97" instead of "59.9700".
 * Every column using this transformer is DECIMAL(19,4), so re-formatting
 * via toFixed(4) restores the canonical 4-decimal-place string on every
 * read, not just when a caller happens to reformat it themselves.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: string | number | null) => value,
  from: (value?: string | number | null) =>
    value === null || value === undefined ? value : Number(value).toFixed(4),
};
