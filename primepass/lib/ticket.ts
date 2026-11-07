import type { Ticket } from "./types";

export function qrPayload(ticket: Pick<Ticket, "code" | "eventId" | "tierName">): string {
  return `PRIMEPASS|${ticket.code}|${ticket.eventId}|${ticket.tierName}`;
}
