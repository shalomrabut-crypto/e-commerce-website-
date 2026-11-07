"use client";

import Link from "next/link";
import { useState } from "react";
import StatusPill from "@/components/StatusPill";
import SummaryList from "@/components/SummaryList";
import { COMMISSION_PERCENT, SERVICE_FEE_PERCENT } from "@/lib/config";
import { clockTime, dateTime, kes, longDate, num, serial } from "@/lib/format";
import { useQuery, useRequireRole } from "@/lib/hooks";
import {
  approveEvent,
  approveOrganizer,
  listAllOrders,
  listPendingEvents,
  listPendingOrganizers,
  platformTotals,
  rejectEvent,
  rejectOrganizer,
} from "@/lib/store";

export default function AdminPage() {
  const user = useRequireRole("admin");
  const { data } = useQuery(
    async () => {
      if (!user) return undefined;
      const [organizers, events, orders, totals] = await Promise.all([
        listPendingOrganizers(),
        listPendingEvents(),
        listAllOrders(),
        platformTotals(),
      ]);
      return { organizers, events, orders, totals };
    },
    [user?.id],
  );
  const [message, setMessage] = useState("");

  if (!user || !data) return <div className="flex-1" />;
  const { organizers, events, orders, totals } = data;

  async function decide(action: () => Promise<void>, text: string) {
    await action();
    setMessage(text);
  }

  return (
    <section className="gutter py-12 nav:py-16">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-12">
        <div>
          <h1 className="display m-0 text-[clamp(30px,5vw,54px)]">Admin</h1>
          <p role="status" className="m-0 mt-3 min-h-6 text-peach">
            {message}
          </p>
        </div>

        <div className="max-w-[560px]">
          <SummaryList
            heading="PLATFORM REVENUE · PAID ORDERS"
            rows={[
              { label: "Tickets sold", value: num(totals.ticketsSold) },
              { label: "Ticket sales", value: kes(totals.ticketSalesKes) },
              { label: `Service fees (${SERVICE_FEE_PERCENT}%)`, value: kes(totals.serviceFeesKes) },
              { label: `Commission (${COMMISSION_PERCENT}%)`, value: kes(totals.commissionKes) },
              { label: "Total platform revenue", value: kes(totals.revenueKes), strong: true },
            ]}
          />
        </div>

        <div>
          <h2 className="display m-0 mb-6 text-[clamp(22px,3vw,30px)]">Pending organizers</h2>
          {organizers.length === 0 ? (
            <p className="m-0 text-muted">Nothing to review.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-4">
              {organizers.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[14px] border border-line bg-panel">
                  <div className="min-w-0">
                    <p className="m-0 text-[18px] font-extrabold break-words">{o.orgName}</p>
                    <p className="m-0 mt-1 text-muted break-words">
                      {o.fullName} · {o.email} · <span className="font-mono">{o.phone}</span>
                    </p>
                  </div>
                  <Decision
                    name={o.orgName ?? o.fullName}
                    onApprove={() => decide(() => approveOrganizer(o.id), `${o.orgName} approved.`)}
                    onReject={() => decide(() => rejectOrganizer(o.id), `${o.orgName} rejected.`)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="display m-0 mb-6 text-[clamp(22px,3vw,30px)]">Pending events</h2>
          {events.length === 0 ? (
            <p className="m-0 text-muted">Nothing to review.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-4">
              {events.map(({ event, organizer }) => (
                <li key={event.id} className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[14px] border border-line bg-panel">
                  <div className="min-w-0">
                    <p className="m-0 font-mono text-[14px] text-peach">{serial(event.id)}</p>
                    <p className="m-0 mt-1 text-[18px] font-extrabold break-words">
                      <Link href={`/events/${event.id}`} className="text-paper hover:text-peach no-underline">
                        {event.title}
                      </Link>
                    </p>
                    <p className="m-0 mt-1 text-muted break-words">
                      {event.venue}, {event.city}
                      {event.startsAt ? ` · ${longDate(event.startsAt)}, ${clockTime(event.startsAt)}` : ""} · by{" "}
                      {organizer?.orgName ?? "Unknown"}
                    </p>
                    <p className="m-0 mt-1 text-muted break-words">
                      {event.tiers.map((t) => `${t.name} ${kes(t.priceKes)} (${num(t.capacity)})`).join(" · ")}
                    </p>
                  </div>
                  <Decision
                    name={event.title}
                    onApprove={() => decide(() => approveEvent(event.id), `${event.title} approved. It is now public.`)}
                    onReject={() => decide(() => rejectEvent(event.id), `${event.title} rejected.`)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="display m-0 mb-6 text-[clamp(22px,3vw,30px)]">All orders</h2>
          {orders.length === 0 ? (
            <p className="m-0 text-muted">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-[14px] border border-line bg-panel" tabIndex={0} role="region" aria-label="All orders">
              <table className="w-full min-w-[840px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[12px] text-muted tracking-[1px]">
                    <th scope="col" className="p-4 font-extrabold">ORDER</th>
                    <th scope="col" className="p-4 font-extrabold">BUYER</th>
                    <th scope="col" className="p-4 font-extrabold">EVENT</th>
                    <th scope="col" className="p-4 font-extrabold text-right">QTY</th>
                    <th scope="col" className="p-4 font-extrabold text-right">TOTAL</th>
                    <th scope="col" className="p-4 font-extrabold">METHOD</th>
                    <th scope="col" className="p-4 font-extrabold">STATUS</th>
                    <th scope="col" className="p-4 font-extrabold">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(({ order, buyerName, eventTitle, tierName }) => (
                    <tr key={order.id} className="border-t border-line">
                      <td className="p-4 font-mono text-[14px] whitespace-nowrap">{order.id}</td>
                      <td className="p-4">{buyerName}</td>
                      <td className="p-4 min-w-[200px]">
                        {eventTitle} · {tierName}
                      </td>
                      <td className="p-4 font-mono text-right">{order.quantity}</td>
                      <td className="p-4 font-mono text-right whitespace-nowrap">{kes(order.totalKes)}</td>
                      <td className="p-4">{order.method === "mpesa" ? "M-Pesa" : "Card"}</td>
                      <td className="p-4">
                        <StatusPill status={order.status} />
                      </td>
                      <td className="p-4 text-muted whitespace-nowrap">{dateTime(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Decision({ name, onApprove, onReject }: { name: string; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn btn-cta" aria-label={`Approve ${name}`} onClick={onApprove}>
        Approve
      </button>
      <button type="button" className="btn btn-ghost" aria-label={`Reject ${name}`} onClick={onReject}>
        Reject
      </button>
    </div>
  );
}
