"use client";

import Link from "next/link";
import TearTicket from "@/components/TearTicket";
import { useQuery, useRequireRole } from "@/lib/hooks";
import { listMyTickets } from "@/lib/store";

export default function MyTicketsPage() {
  const user = useRequireRole("attendee");
  const { data: tickets } = useQuery(
    () => (user ? listMyTickets() : Promise.resolve(undefined)),
    [user?.id],
  );

  if (!user || !tickets) return <div className="flex-1" />;

  return (
    <section className="gutter py-12 nav:py-16">
      <div className="max-w-[1180px] mx-auto">
        <h1 className="display m-0 text-[clamp(30px,5vw,54px)]">My Tickets</h1>

        {tickets.length === 0 ? (
          <div className="py-12">
            <p className="m-0 text-[18px] font-extrabold">No tickets yet.</p>
            <p className="m-0 mt-2 mb-6 text-muted">When you buy a ticket, it shows up here with its QR code.</p>
            <Link href="/events" className="btn btn-cta">
              Find an event
            </Link>
          </div>
        ) : (
          <>
            <p className="m-0 mt-3 mb-12 text-muted">Tap a ticket to tear it open and show the QR code.</p>
            <ul className="m-0 p-0 list-none grid gap-x-8 gap-y-12 [grid-template-columns:repeat(auto-fill,minmax(280px,300px))] justify-center nav:justify-start">
              {tickets.map(({ ticket, event }) => (
                <li key={ticket.code} className="flex flex-col items-start gap-3">
                  <TearTicket ticket={ticket} event={event} stamped />
                  <Link href={`/tickets/${ticket.code}`} className="inline-flex items-center min-h-11">
                    Printable ticket →
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
