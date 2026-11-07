import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import SummaryList from "@/components/SummaryList";
import {
  commission,
  COMMISSION_PERCENT,
  FEATURED_KES_PER_WEEK,
  SERVICE_FEE_PERCENT,
  serviceFee,
} from "@/lib/config";
import { kes } from "@/lib/format";

export const metadata: Metadata = { title: "How it works" };

const TICKET_PRICE = 4500;
const buyerFee = serviceFee(TICKET_PRICE);
const organizerCommission = commission(TICKET_PRICE);

export default function HowItWorksPage() {
  return (
    <section className="gutter py-12 nav:py-16">
      <div className="max-w-[720px] mx-auto">
        <h1 className="display m-0 text-[clamp(30px,5vw,54px)] leading-[1.05]">How Prime Pass makes money</h1>
        <p className="m-0 mt-6 text-[18px] leading-[1.6] text-soft">
          Prime Pass sits between people who want a safe ticket and people who want to sell out a night. It earns a small
          cut each time a ticket sells, so it only makes money when organizers do.
        </p>

        <Part title="Who pays">
          <ul className="m-0 pl-6 flex flex-col gap-3 list-disc">
            <li>
              <strong>Buyers</strong> pay a {SERVICE_FEE_PERCENT}% service fee, added at checkout.
            </li>
            <li>
              <strong>Organizers</strong> pay {COMMISSION_PERCENT}% commission on ticket sales. Listing an event is free.
            </li>
            <li>
              <strong>Organizers</strong> can also pay {kes(FEATURED_KES_PER_WEEK)} a week to be featured on the homepage.
            </li>
          </ul>
        </Part>

        <Part title="Why they pay">
          <p className="m-0">
            <strong>Buyers</strong> get verified events, so there are no fake-event scams, and an instant QR ticket on their
            phone.
          </p>
          <p className="m-0 mt-3">
            <strong>Organizers</strong> get M-Pesa checkout, gate scanning and payout without having to build anything.
          </p>
        </Part>

        <Part title="What it costs to run">
          <ul className="m-0 pl-6 flex flex-col gap-3 list-disc">
            <li>M-Pesa transaction charges on every payment.</li>
            <li>Hosting for the website and tickets.</li>
            <li>The time it takes to verify each organizer before their first event goes live.</li>
          </ul>
        </Part>

        <Part title="A worked example">
          <p className="m-0 mb-6">One Ed Sheeran Regular ticket at {kes(TICKET_PRICE)}:</p>
          <SummaryList
            heading="ONE REGULAR TICKET · No. 0101"
            rows={[
              { label: "Ticket price", value: kes(TICKET_PRICE) },
              { label: `Buyer service fee (${SERVICE_FEE_PERCENT}%, rounded up)`, value: kes(buyerFee) },
              { label: "Buyer pays in total", value: kes(TICKET_PRICE + buyerFee) },
              { label: `Organizer commission (${COMMISSION_PERCENT}%)`, value: kes(organizerCommission) },
              { label: "Prime Pass gross revenue", value: kes(buyerFee + organizerCommission), strong: true },
              { label: "Organizer net payout", value: kes(TICKET_PRICE - organizerCommission), strong: true },
            ]}
          />
          <p className="m-0 mt-6">
            Gross revenue is before costs. The M-Pesa charge and a share of hosting and verification come out of the{" "}
            {kes(buyerFee + organizerCommission)}.
          </p>
        </Part>

        <Part title="How real payments would work">
          <p className="m-0">
            This demo doesn&apos;t move any money. A live version would use M-Pesa STK Push through Safaricom&apos;s Daraja
            API. A server would ask Daraja to send a PIN prompt to the buyer&apos;s phone. After the buyer enters their PIN,
            Safaricom would call back a server URL with the result, and only that callback would mark the order paid and
            issue the tickets. That has to happen on a server, because anything running in the browser can be faked.
          </p>
        </Part>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/events" className="btn btn-cta">
            See events
          </Link>
          <Link href="/signup?role=organizer" className="btn btn-ghost">
            Apply as organizer
          </Link>
        </div>
      </div>
    </section>
  );
}

function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-12 text-[17px] leading-[1.6] text-soft">
      <h2 className="display m-0 mb-4 text-[clamp(20px,3vw,26px)] leading-[1.15] text-paper">{title}</h2>
      {children}
    </div>
  );
}
