import { decimalTransformer } from './decimal.transformer';

describe('decimalTransformer', () => {
  describe('to', () => {
    it('passes the value through unchanged for the driver to write', () => {
      expect(decimalTransformer.to('59.9700')).toBe('59.9700');
      expect(decimalTransformer.to(undefined)).toBeUndefined();
    });
  });

  describe('from', () => {
    it('renormalizes a driver-returned number to a canonical 4-decimal string', () => {
      // mssql/tedious returns DECIMAL columns as JS numbers, which drop
      // trailing zeros (59.97 instead of 59.9700) on every round-trip
      // through the database — this is the bug a live smoke test caught.
      expect(decimalTransformer.from(59.97)).toBe('59.9700');
      expect(decimalTransformer.from(100)).toBe('100.0000');
      expect(decimalTransformer.from(0)).toBe('0.0000');
    });

    it('renormalizes a string value to the same canonical form', () => {
      expect(decimalTransformer.from('59.97')).toBe('59.9700');
    });

    it('passes through null and undefined without touching them', () => {
      expect(decimalTransformer.from(null)).toBeNull();
      expect(decimalTransformer.from(undefined)).toBeUndefined();
    });

    it('preserves negative values', () => {
      expect(decimalTransformer.from(-42.5)).toBe('-42.5000');
    });
  });
});
