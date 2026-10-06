import { fromMinorUnits, multiplyMinorUnits, toMinorUnits } from "./money";

describe("money utils", () => {
  it("round-trips exactly, unlike float arithmetic", () => {
    const a = toMinorUnits("0.10");
    const b = toMinorUnits("0.20");
    expect(fromMinorUnits(a + b)).toBe("0.3000");
  });

  describe("multiplyMinorUnits", () => {
    it("multiplies a quantity by a unit price exactly", () => {
      const quantity = toMinorUnits("3");
      const unitPrice = toMinorUnits("19.99");
      expect(fromMinorUnits(multiplyMinorUnits(quantity, unitPrice))).toBe("59.9700");
    });

    it("multiplies fractional quantities exactly", () => {
      const quantity = toMinorUnits("0.5");
      const unitPrice = toMinorUnits("10");
      expect(fromMinorUnits(multiplyMinorUnits(quantity, unitPrice))).toBe("5.0000");
    });
  });
});
