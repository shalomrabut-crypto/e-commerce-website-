"use client";

import Link from "next/link";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import SummaryList from "@/components/SummaryList";
import { COMMISSION_PERCENT } from "@/lib/config";
import { clockTime, kes, longDate, num, serial } from "@/lib/format";
import { useQuery, useRequireRole } from "@/lib/hooks";
import { listMyEvents, type OrganizerEvent } from "@/lib/store";
import CreateEventForm from "./CreateEventForm";

export default function OrganizerPage() {
  const user = useRequireRole("organizer");
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { data: events } = useQuery(
    () => (user?.orgStatus === "approved" ? listMyEvents() : Promise.resolve([])),
    [user?.id, user?.orgStatus],
  );

  if (!user || !events) return <div className="flex-1" />;

  const heading = (
    <div>
      <p className="m-0 font-mono text-[14px] text-peach tracking-[2px] uppercase">{user.orgName}</p>
      <h1 className="display m-0 mt-2 text-[clamp(30px,5vw,54px)]">Dashboard</h1>
    </div>
  );

  if (user.orgStatus !== "approved") {
    return (
      <section className="gutter py-12 nav:py-16">
        <div className="max-w-[1180px] mx-auto flex flex-col gap-6">
          {heading}
          <div className="max-w-[560px] p-6 rounded-[14px] bg-plum">
            <StatusPill status={user.orgStatus ?? "pending"} />
            <p className="m-0 mt-3 text-[18px] font-extrabold">
              {user.orgStatus === "rejected" ? "Your application was not approved." : "We're checking your organization."}
            </p>
            <p className="m-0 mt-2 text-soft leading-[1.6]">
              {user.orgStatus === "rejected"
                ? "You can't create events with this account. Contact the Prime Pass team if you think this is a mistake."
                : "You can create events as soon as an admin approves your account. To see it happen in this demo, sign in as the admin and approve it."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const gross = events.reduce((sum, e) => sum + e.grossKes, 0);
  const commissionTotal = events.reduce((sum, e) => sum + e.commissionKes, 0);
  const net = events.reduce((sum, e) => sum + e.netKes, 0);

  return (
    <section className="gutter py-12 nav:py-16">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {heading}
          {!creating && (
            <button
              type="button"
              className="btn btn-cta"
              onClick={() => {
                setCreating(true);
                setNotice(null);
              }}
            >
              Create event
            </button>
          )}
        </div>

        {notice && (
          <p role="status" className="enter m-0 p-4 rounded-xl border-2 border-dashed border-peach text-peach">
            {notice}
          </p>
        )}

        {creating && (
          <CreateEventForm
            onCancel={() => setCreating(false)}
            onCreated={(message) => {
              setCreating(false);
              setNotice(message);
            }}
          />
        )}

        <div className="max-w-[560px]">
          <SummaryList
            heading="ALL EVENTS · PAID ORDERS"
            rows={[
              { label: "Ticket sales", value: kes(gross) },
              { label: `Commission (${COMMISSION_PERCENT}%)`, value: `- ${kes(commissionTotal)}` },
              { label: "Net payout", value: kes(net), strong: true },
            ]}
          />
        </div>

        <div>
          <h2 className="display m-0 mb-6 text-[clamp(22px,3vw,30px)]">Your events</h2>
          {events.length === 0 ? (
            <p className="m-0 text-muted">No events yet. Create your first one above.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-6">
              {events.map((item) => (
                <EventRow key={item.event.id} item={item} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function EventRow({ item }: { item: OrganizerEvent }) {
  const { event, tiers, netKes } = item;
  return (
    <li className="p-6 rounded-[14px] border border-line bg-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 font-mono text-[14px] text-peach">{serial(event.id)}</p>
          <h3 className="display m-0 mt-1 text-[22px] leading-[1.1] break-words">
            <Link href={`/events/${event.id}`} className="inline-flex items-center min-h-11 text-paper hover:text-peach no-underline font-extrabold">
              {event.title}
            </Link>
          </h3>
          <p className="m-0 mt-2 text-muted">
            {event.venue}, {event.city} ·{" "}
            {event.startsAt ? `${longDate(event.startsAt)}, ${clockTime(event.startsAt)}` : "Date to be announced"}
          </p>
        </div>
        <StatusPill status={event.status} />
      </div>

      {tiers.length === 0 ? (
        <p className="m-0 mt-4 text-muted">No tiers yet. Tickets are not on sale.</p>
      ) : (
        <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label={`Sales for ${event.title}`}>
          <table className="w-full min-w-[520px] border-collapse text-[15px]">
            <thead>
              <tr className="text-left text-[12px] text-muted tracking-[1px]">
                <th scope="col" className="py-2 pr-4 font-extrabold">TIER</th>
                <th scope="col" className="py-2 pr-4 font-extrabold text-right">SOLD</th>
                <th scope="col" className="py-2 pr-4 font-extrabold text-right">SALES</th>
                <th scope="col" className="py-2 pr-4 font-extrabold text-right">COMMISSION</th>
                <th scope="col" className="py-2 font-extrabold text-right">NET</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {tiers.map((row) => (
                <tr key={row.tier.id} className="border-t border-line">
                  <td className="py-3 pr-4 font-body font-extrabold">{row.tier.name}</td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">
                    {num(row.soldPaid)} / {num(row.tier.capacity)}
                  </td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">{num(row.grossKes)}</td>
                  <td className="py-3 pr-4 text-right whitespace-nowrap">{num(row.commissionKes)}</td>
                  <td className="py-3 text-right whitespace-nowrap">{num(row.netKes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tiers.length > 0 && (
        <p className="m-0 mt-3 flex flex-wrap justify-between gap-x-4 pt-3 border-t-2 border-dashed border-line">
          <span className="font-extrabold">Net payout</span>
          <span className="font-mono text-orange">{kes(netKes)}</span>
        </p>
      )}
    </li>
  );
}
