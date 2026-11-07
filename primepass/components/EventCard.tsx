import Link from "next/link";
import { compactTime, kes, serial, shortDate } from "@/lib/format";
import type { Event } from "@/lib/types";
import NotifyButton from "./NotifyButton";
import Poster, { posterAlt, posterPosition } from "./Poster";

function lowestPrice(event: Event): number | null {
  return event.tiers.length > 0 ? Math.min(...event.tiers.map((t) => t.priceKes)) : null;
}

export default function EventCard({ event }: { event: Event }) {
  const price = lowestPrice(event);
  const soldOut = event.tiers.length > 0 && event.tiers.every((t) => t.sold >= t.capacity);
  const when = event.startsAt ? `GATES OPEN ${compactTime(event.startsAt)}` : "DATE TO BE ANNOUNCED";

  return (
    <article className="stub relative overflow-hidden w-full max-w-[600px] rounded-[14px] bg-paper text-ink">
      <div className="relative h-[340px] overflow-hidden bg-ink">
        <Poster
          src={event.poster}
          alt={posterAlt(event.poster, event.title)}
          sizes="(max-width: 720px) 100vw, 600px"
          className={`pic ${posterPosition(event.poster)}`}
        />
        {event.comingSoon ? (
          <span className="display absolute right-4 top-6 px-3 py-1 rounded-lg border-[3px] border-orange bg-ink text-orange text-[16px] tracking-[1px] -rotate-[8deg]">
            Coming soon
          </span>
        ) : (
          event.startsAt && (
            <span className="absolute left-4 top-4 px-3 py-2 rounded-full bg-orange text-ink font-mono text-[14px] uppercase">
              {shortDate(event.startsAt)}
            </span>
          )
        )}
      </div>

      <div className="px-6 pt-6 pb-4">
        <p className="m-0 font-mono text-[14px] text-muted-ink">
          {serial(event.id)} · {when}
        </p>
        <h3 className="display m-0 mt-2 mb-2 text-[28px] leading-[1.1] break-words">{event.title}</h3>
        <p className="m-0 text-[15px] font-semibold text-body-ink">
          {event.venue}, {event.city}
        </p>
      </div>

      <div className="perf" />

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-4 pb-6">
        {event.comingSoon ? (
          <>
            <div>
              <p className="m-0 text-[14px] font-extrabold text-muted-ink">TICKETS</p>
              <p className="m-0 font-mono text-[20px]">Drop soon</p>
            </div>
            <NotifyButton eventId={event.id} />
          </>
        ) : (
          <>
            <div>
              <p className="m-0 text-[14px] font-extrabold text-muted-ink">FROM</p>
              <p className="m-0 font-mono text-[20px]">{price === null ? "TBA" : kes(price)}</p>
            </div>
            <Link href={`/events/${event.id}`} className="btn btn-cta">
              {soldOut ? "Sold out" : "Get tickets"}
              <span className="sr-only"> for {event.title}</span>
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
