"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import Poster from "@/components/Poster";
import QrCode from "@/components/QrCode";
import { clockTime, kes, longDate } from "@/lib/format";
import { useCurrentUser, useQuery, useRequireRole } from "@/lib/hooks";
import { getTicket } from "@/lib/store";
import { qrPayload } from "@/lib/ticket";

export default function PrintableTicketPage() {
  const { code } = useParams<{ code: string }>();
  // Only attendees hold tickets. getTicket then checks this user owns this one.
  const guarded = useRequireRole("attendee");
  const { user } = useCurrentUser();
  const { data, loading } = useQuery(() => getTicket(code), [code, user?.id]);

  if (!guarded || loading) return <div className="flex-1" />;

  if (!data) {
    return (
      <section className="gutter py-24">
        <h1 className="display m-0 text-[32px]">Ticket not found</h1>
        <p className="m-0 mt-3 mb-6 text-muted">This ticket may belong to another account.</p>
        <Link href="/tickets" className="btn btn-cta">
          My Tickets
        </Link>
      </section>
    );
  }

  const { ticket, event, tier } = data;
  const payload = qrPayload(ticket);

  return (
    <section className="ticket-page gutter py-8 nav:py-12">
      <div className="max-w-[868px] mx-auto flex flex-col gap-6">
        <div className="noprint flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/tickets" className="inline-flex items-center min-h-11 no-underline">
              ← My Tickets
            </Link>
            <h1 className="display m-0 mt-1 text-[clamp(28px,4vw,34px)]">Your ticket</h1>
          </div>
          <span className="px-3 py-2 rounded-full border-2 border-dashed border-peach text-peach font-mono text-[12px] tracking-[1px]">
            DEMO · SAMPLE EVENT
          </span>
        </div>

        <article className="printable-ticket flex flex-col min-[860px]:flex-row min-[860px]:min-h-[340px] overflow-hidden rounded-[14px] bg-paper text-ink shadow-[0_32px_64px_rgba(0,0,0,.5)]">
          <div className="ticket-photo relative h-[140px] min-[860px]:h-auto min-[860px]:flex-[0_0_190px] bg-ink">
            <Poster src={event.poster} alt="" sizes="190px" priority className="object-[45%_60%] grayscale contrast-[1.1]" />
            <div className="absolute inset-x-0 bottom-0 h-3 bg-orange" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between gap-6 p-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="display text-[14px] tracking-[0.5px]">Prime Pass</span>
                <span className="font-mono text-[12px] text-muted-ink">ADMIT ONE</span>
              </div>
              <h2 className="display m-0 mt-3 text-[clamp(28px,5vw,40px)] leading-none break-words">{event.title}</h2>
              <p className="m-0 mt-2 font-extrabold text-body-ink">Live at {event.venue}</p>
            </div>
            <div className="grid grid-cols-2 min-[520px]:grid-cols-3 gap-x-4 gap-y-3">
              <Fact label="DATE">{event.startsAt ? longDate(event.startsAt) : "To be announced"}</Fact>
              <Fact label="GATES OPEN">{event.startsAt ? clockTime(event.startsAt) : "To be announced"}</Fact>
              <Fact label="TIER">{ticket.tierName}</Fact>
              <Fact label="VENUE">
                {event.venue}, {event.city}
              </Fact>
              <Fact label="HOLDER">{ticket.holderName}</Fact>
              <Fact label="PAID" mono>
                {kes(tier.priceKes)}
              </Fact>
            </div>
          </div>

          <div aria-hidden="true" className="perf min-[860px]:hidden" />
          <div aria-hidden="true" className="perf-v hidden min-[860px]:block" />

          <div className="ticket-qr flex flex-col items-center justify-center gap-3 p-6 min-[860px]:flex-[0_0_236px]">
            <QrCode value={payload} size={174} label={`QR code for ticket ${ticket.code}`} />
            <p className="m-0 font-mono text-[16px] tracking-[1px]">{ticket.code}</p>
            <p className="m-0 text-[12px] font-extrabold text-muted-ink">Scan at gate · single entry</p>
          </div>
        </article>

        <div className="noprint flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-cta min-h-[52px] px-8" onClick={() => window.print()}>
            Print ticket
          </button>
        </div>

        <div className="noprint px-4 py-4 rounded-xl border border-line bg-panel">
          <p className="m-0 text-[14px] font-extrabold text-muted tracking-[1px]">THIS QR CODE ENCODES</p>
          <p className="m-0 mt-2 font-mono text-[15px] text-peach break-all">{payload}</p>
          <p className="m-0 mt-2 text-[14px] text-muted">
            Every ticket gets its own ID, so every QR is different. Scan it with your phone camera to check.
          </p>
        </div>
      </div>
    </section>
  );
}

function Fact({ label, mono = false, children }: { label: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="m-0 text-[12px] font-extrabold text-muted-ink tracking-[1px]">{label}</p>
      <p className={`m-0 mt-1 break-words ${mono ? "font-mono" : "font-extrabold"}`}>{children}</p>
    </div>
  );
}
