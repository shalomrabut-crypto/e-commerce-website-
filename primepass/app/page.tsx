"use client";

import Link from "next/link";
import EventCard from "@/components/EventCard";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import { COMMISSION_PERCENT, FEATURED_KES_PER_WEEK } from "@/lib/config";
import { kes } from "@/lib/format";
import { useQuery } from "@/lib/hooks";
import { seedPublicEvents } from "@/lib/seed";
import { listEvents } from "@/lib/store";

const PRICING = [
  { label: "Listing an event", value: "Free" },
  { label: "Platform fee", value: `${COMMISSION_PERCENT}% per ticket` },
  { label: "Featured on homepage", value: `${kes(FEATURED_KES_PER_WEEK)} / week` },
  { label: "Payout to M-Pesa", value: "24h after event" },
];

export default function HomePage() {
  const { data: events = [] } = useQuery(() => listEvents(), [], seedPublicEvents());

  return (
    <>
      <Hero />
      <Ticker events={events} />

      <section id="events" className="gutter py-16 nav:py-24">
        <div className="max-w-[1180px] mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
            <h2 className="display m-0 text-[clamp(30px,4vw,44px)]">Upcoming</h2>
            <Link href="/events" className="inline-flex items-center min-h-11">
              All events →
            </Link>
          </div>
          <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      <section id="organizers" className="gutter py-16 nav:py-24 bg-plum">
        <div className="max-w-[1180px] mx-auto flex flex-wrap items-center gap-12">
          <div className="flex-[1_1_320px] min-w-0">
            <p className="m-0 mb-3 font-mono text-[14px] text-peach tracking-[2px]">FOR ORGANIZERS</p>
            <h2 className="display m-0 text-[clamp(30px,4.5vw,54px)] leading-[1.05]">
              Sell out
              <br />
              your night.
            </h2>
            <p className="m-0 mt-6 mb-8 max-w-[440px] text-[17px] leading-[1.6] text-soft">
              List for free, sell through M-Pesa, scan tickets at the gate from your phone. You only pay when you sell.
            </p>
            <Link href="/signup?role=organizer" className="btn btn-cta min-h-12">
              Apply as organizer
            </Link>
          </div>
          <div className="flex-[1_1_320px] min-w-0 p-6 nav:p-8 rounded-[14px] bg-paper text-ink text-[15px] shadow-[0_24px_48px_rgba(0,0,0,.35)]">
            <p className="m-0 mb-4 font-mono text-[14px] text-muted-ink">PRICING · No. 0000</p>
            {PRICING.map((row, i) => (
              <div
                key={row.label}
                className={`flex flex-wrap justify-between gap-x-4 gap-y-1 py-3 ${
                  i < PRICING.length - 1 ? "border-b-2 border-dashed border-perf" : ""
                }`}
              >
                <span className="font-extrabold">{row.label}</span>
                <span className="font-mono">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
