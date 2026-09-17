// Exact decimal arithmetic for monetary values, mirroring the backend's
// DECIMAL(19,4) handling (server/src/finance/utils/money.ts). Duplicated
// here — rather than imported — because the client and server are separate,
// unlinked npm packages with no shared module between them. Debit/Credit
// values are kept as strings end-to-end (never parsed into a JS number),
// so this file is the only place that ever touches their digits, and it
// only ever does so via integer ten-thousandths — never parseFloat/+/-.
export const DECIMAL_PATTERN = /^\d+(\.\d{1,4})?$/;

export function toMinorUnits(value) {
  const trimmed = String(value ?? "").trim();
  if (trimmed === "") {
    return 0;
  }
  const negative = trimmed.startsWith("-");
  const unsigned = trimmed.replace(/^-/, "");
  const [whole, fraction = ""] = unsigned.split(".");
  const paddedFraction = (fraction + "0000").slice(0, 4);
  const minorUnits = parseInt(whole || "0", 10) * 10000 + parseInt(paddedFraction, 10);
  return negative ? -minorUnits : minorUnits;
}

export function fromMinorUnits(minorUnits) {
  const negative = minorUnits < 0;
  const abs = Math.abs(minorUnits);
  const whole = Math.floor(abs / 10000);
  const fraction = String(abs % 10000).padStart(4, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}
