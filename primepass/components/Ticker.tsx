import { shortDate } from "@/lib/format";
import type { Event } from "@/lib/types";

function line(event: Event): string {
  const when = event.startsAt ? shortDate(event.startsAt) : "Coming soon";
  const place = event.comingSoon ? event.venue : `${event.venue}, ${event.city}`;
  return `${when} · ${event.title} · ${place} ★ `.toUpperCase();
}

export default function Ticker({ events }: { events: Event[] }) {
  const text = `${events.map(line).join("")}VERIFIED ORGANIZERS ONLY ★ `;
  // One half of the track must be wider than the screen so the loop has no visible gap.
  const half = text.repeat(4);

  return (
    <div aria-hidden="true" className="overflow-hidden py-3 bg-orange text-ink font-mono text-[14px] tracking-[1px] whitespace-pre">
      <div className="ticker-track">
        <span>{half}</span>
        <span>{half}</span>
      </div>
    </div>
  );
}
