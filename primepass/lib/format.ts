const TZ = "Africa/Nairobi";

function parts(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...options }).formatToParts(new Date(iso));
}

function pick(list: Intl.DateTimeFormatPart[], type: string) {
  return list.find((p) => p.type === type)?.value ?? "";
}

/** "Sat 14 Nov" */
export function shortDate(iso: string): string {
  const p = parts(iso, { weekday: "short", day: "numeric", month: "short" });
  return `${pick(p, "weekday")} ${pick(p, "day")} ${pick(p, "month")}`;
}

/** "Sat 14 Nov 2026" */
export function longDate(iso: string): string {
  const p = parts(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `${pick(p, "weekday")} ${pick(p, "day")} ${pick(p, "month")} ${pick(p, "year")}`;
}

/** "4:00 PM" */
export function clockTime(iso: string): string {
  const p = parts(iso, { hour: "numeric", minute: "2-digit", hour12: true });
  return `${pick(p, "hour")}:${pick(p, "minute")} ${pick(p, "dayPeriod").toUpperCase()}`;
}

/** "4PM", or "4:30PM" when the minutes matter. */
export function compactTime(iso: string): string {
  const p = parts(iso, { hour: "numeric", minute: "2-digit", hour12: true });
  const minute = pick(p, "minute");
  return `${pick(p, "hour")}${minute === "00" ? "" : `:${minute}`}${pick(p, "dayPeriod").toUpperCase()}`;
}

/** "14 Nov 2026, 4:00 PM" for order tables. */
export function dateTime(iso: string): string {
  const p = parts(iso, { day: "numeric", month: "short", year: "numeric" });
  return `${pick(p, "day")} ${pick(p, "month")} ${pick(p, "year")}, ${clockTime(iso)}`;
}

export function kes(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function num(amount: number): string {
  return amount.toLocaleString("en-KE");
}

/** "No. 0101" from an event id such as "EVT-0101". */
export function serial(eventId: string): string {
  return `No. ${eventId.replace(/^EVT-/, "")}`;
}
