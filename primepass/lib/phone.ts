/** Number that simulates a cancelled M-Pesa payment. */
export const TEST_FAILURE_PHONE = "254700000000";

/**
 * Accepts 07..., 01..., +2547... and 2547..., ignoring spaces and dashes.
 * Returns the number in 254XXXXXXXXX form, or null for anything else.
 * 07 numbers become 2547XXXXXXXX. 01 numbers keep their real prefix and become
 * 2541XXXXXXXX, because rewriting them to 2547 would point at someone else's line.
 */
export function normalizePhone(input: string): string | null {
  const v = input.replace(/[\s-]/g, "");
  if (/^0[17]\d{8}$/.test(v)) return `254${v.slice(1)}`;
  if (/^\+2547\d{8}$/.test(v)) return v.slice(1);
  if (/^2547\d{8}$/.test(v)) return v;
  return null;
}

export const PHONE_ERROR = "Enter a Kenyan number like 0712 345 678 or +254 712 345 678.";

/** "+254 712 345 678" for prefilling and display. */
export function displayPhone(normalized: string): string {
  return `+254 ${normalized.slice(3, 6)} ${normalized.slice(6, 9)} ${normalized.slice(9)}`;
}
