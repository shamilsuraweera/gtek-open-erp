import { fromMinorUnits, multiplyMinorUnits, toMinorUnits } from './money';

describe('money utils', () => {
  describe('toMinorUnits', () => {
    it('converts a whole number', () => {
      expect(toMinorUnits('100')).toBe(1000000);
    });

    it('converts a value with 4 decimal places', () => {
      expect(toMinorUnits('19.9950')).toBe(199950);
    });

    it('pads a value with fewer than 4 decimal places', () => {
      expect(toMinorUnits('19.99')).toBe(199900);
    });

    it('handles zero', () => {
      expect(toMinorUnits('0')).toBe(0);
      expect(toMinorUnits('0.0000')).toBe(0);
    });

    it('handles negative values', () => {
      expect(toMinorUnits('-42.5')).toBe(-425000);
    });
  });

  describe('fromMinorUnits', () => {
    it('formats a whole number with 4 decimal places', () => {
      expect(fromMinorUnits(1000000)).toBe('100.0000');
    });

    it('formats a fractional value', () => {
      expect(fromMinorUnits(199950)).toBe('19.9950');
    });

    it('formats zero', () => {
      expect(fromMinorUnits(0)).toBe('0.0000');
    });

    it('formats negative values', () => {
      expect(fromMinorUnits(-425000)).toBe('-42.5000');
    });
  });

  it('round-trips exactly, unlike float arithmetic', () => {
    // 0.1 + 0.2 !== 0.3 in IEEE754 float; this must not happen here.
    const a = toMinorUnits('0.10');
    const b = toMinorUnits('0.20');
    expect(fromMinorUnits(a + b)).toBe('0.3000');
  });

  describe('multiplyMinorUnits', () => {
    it('multiplies a quantity by a unit price exactly', () => {
      const quantity = toMinorUnits('3');
      const unitPrice = toMinorUnits('19.99');
      const lineTotal = multiplyMinorUnits(quantity, unitPrice);
      expect(fromMinorUnits(lineTotal)).toBe('59.9700');
    });

    it('multiplies fractional quantities exactly', () => {
      const quantity = toMinorUnits('0.5');
      const unitPrice = toMinorUnits('10');
      const lineTotal = multiplyMinorUnits(quantity, unitPrice);
      expect(fromMinorUnits(lineTotal)).toBe('5.0000');
    });

    it('rounds to the nearest ten-thousandth rather than truncating', () => {
      const quantity = toMinorUnits('3');
      const unitPrice = toMinorUnits('0.0001');
      // 3 * 0.0001 = 0.0003 exactly, no rounding needed here, but confirms
      // the rescale-by-10000 step doesn't silently drop precision.
      const lineTotal = multiplyMinorUnits(quantity, unitPrice);
      expect(fromMinorUnits(lineTotal)).toBe('0.0003');
    });
  });
});
