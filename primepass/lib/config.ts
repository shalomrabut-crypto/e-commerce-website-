// The real numbers behind the business model. /how-it-works reads from here too.
export const SERVICE_FEE_PERCENT = 3.3;
export const COMMISSION_PERCENT = 5;
export const FEATURED_KES_PER_WEEK = 2000;
export const MAX_TICKETS_PER_ORDER = 10;
export const DEFAULT_POSTER = "/images/hero-hearts.jpg";

/** Unpaid orders hold their seats for this long, then the seats go back on sale. */
export const RESERVATION_MINUTES = 15;

/** Buyer service fee: ceil(subtotal * 0.033). Whole-number maths avoids float rounding errors. */
export function serviceFee(subtotalKes: number): number {
  return Math.ceil((subtotalKes * (SERVICE_FEE_PERCENT * 10)) / 1000);
}

/** Organizer commission on ticket sales, rounded to the nearest shilling. */
export function commission(subtotalKes: number): number {
  return Math.round((subtotalKes * COMMISSION_PERCENT) / 100);
}
