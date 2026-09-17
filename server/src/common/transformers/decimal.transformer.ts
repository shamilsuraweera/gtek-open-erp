import { ValueTransformer } from 'typeorm';

/**
 * mssql/tedious returns DECIMAL columns as JS numbers, reintroducing float
 * imprecision. Surfacing them as strings stops that imprecision from
 * propagating into application-level arithmetic (use a decimal library,
 * never native +/- on these values).
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: string | number | null) => value,
  from: (value?: string | number | null) =>
    value === null || value === undefined ? value : String(value),
};
