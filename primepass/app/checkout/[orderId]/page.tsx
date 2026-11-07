"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import Poster, { posterPosition } from "@/components/Poster";
import TearTicket from "@/components/TearTicket";
import { clockTime, kes, num, serial, shortDate } from "@/lib/format";
import { useQuery, useRequireRole } from "@/lib/hooks";
import { displayPhone, normalizePhone, PHONE_ERROR, TEST_FAILURE_PHONE } from "@/lib/phone";
import { getOrder, payOrder, type OrderDetails, StoreError } from "@/lib/store";
import type { PaymentMethod } from "@/lib/types";

const WAIT_SECONDS = 3;

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const user = useRequireRole("attendee");
  const { data, loading } = useQuery(() => getOrder(orderId), [orderId, user?.id]);

  if (!user || loading) return <div className="flex-1" />;

  return (
    <section className="gutter py-8 nav:py-12">
      <div className="max-w-[960px] mx-auto flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/events" className="inline-flex items-center min-h-11 no-underline">
              ← Events
            </Link>
            <h1 className="display m-0 mt-1 text-[clamp(28px,4vw,34px)]">Checkout</h1>
          </div>
          <span className="px-3 py-2 rounded-full border-2 border-dashed border-peach text-peach font-mono text-[12px] tracking-[1px]">
            DEMO MODE · NO REAL CHARGES
          </span>
        </div>

        {data ? (
          <Checkout details={data} defaultPhone={displayPhone(user.phone)} />
        ) : (
          <div className="py-12">
            <p className="m-0 text-[18px] font-extrabold">We can&apos;t find that order.</p>
            <p className="m-0 mt-2 mb-6 text-muted">It may belong to another account.</p>
            <Link href="/events" className="btn btn-cta">
              See all events
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function Checkout({ details, defaultPhone }: { details: OrderDetails; defaultPhone: string }) {
  const { order, event, tier, tickets } = details;

  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [phone, setPhone] = useState(defaultPhone);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  // "retry" shows the payment form again after a failed attempt.
  const [mode, setMode] = useState<"idle" | "waiting" | "retry">("idle");
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const [justPaid, setJustPaid] = useState(false);
  const [torn, setTorn] = useState(false);

  const payment = useRef<{ method: PaymentMethod; phone?: string }>({ method: "mpesa" });

  useEffect(() => {
    if (mode !== "waiting") return;
    setSecondsLeft(WAIT_SECONDS);
    const tick = window.setInterval(() => setSecondsLeft((s) => Math.max(1, s - 1)), 1000);
    const finish = window.setTimeout(() => {
      payOrder(order.id, payment.current).then(
        (result) => {
          setJustPaid(result.order.status === "paid");
          setMode("idle");
        },
        (err: unknown) => {
          setPayError(err instanceof StoreError ? err.message : "Something went wrong. Please try again.");
          setMode("retry");
        },
      );
    }, WAIT_SECONDS * 1000);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(finish);
    };
  }, [mode, order.id]);

  function pay(e: FormEvent) {
    e.preventDefault();
    setPayError(null);
    if (method === "mpesa") {
      const normalized = normalizePhone(phone);
      if (!normalized) {
        setPhoneError(PHONE_ERROR);
        return;
      }
      payment.current = { method, phone: normalized };
    } else {
      payment.current = { method };
    }
    setPhoneError(null);
    setMode("waiting");
  }

  const view =
    mode === "waiting"
      ? "waiting"
      : order.status === "paid"
        ? "paid"
        : order.status === "failed" && mode !== "retry"
          ? "failed"
          : "pay";

  return (
    <div className="flex flex-col nav:flex-row gap-8 items-stretch nav:items-start">
      <aside className="overflow-hidden nav:flex-[0_0_300px] rounded-[14px] bg-paper text-ink">
        <div className="relative h-[130px] bg-ink">
          <Poster src={event.poster} alt="" sizes="300px" className={posterPosition(event.poster)} />
        </div>
        <div className="flex flex-col gap-3 p-6">
          <p className="m-0 font-mono text-[12px] text-muted-ink uppercase">
            {serial(event.id)}
            {event.startsAt ? ` · ${shortDate(event.startsAt)} · ${clockTime(event.startsAt)}` : ""}
          </p>
          <h2 className="display m-0 text-[24px] leading-[1.05] break-words">{event.title}</h2>
          <p className="m-0 text-[14px] font-semibold text-body-ink">
            {event.venue}, {event.city}
          </p>
          <div className="my-1 border-t-2 border-dashed border-perf" />
          <div className="flex justify-between gap-4 text-[15px]">
            <span>
              {tier.name} × {order.quantity}
            </span>
            <span className="font-mono">{num(order.subtotalKes)}</span>
          </div>
          <div className="flex justify-between gap-4 text-[15px] text-body-ink">
            <span>Service fee</span>
            <span className="font-mono">{num(order.feeKes)}</span>
          </div>
          <div className="my-1 border-t-2 border-dashed border-perf" />
          <div className="flex justify-between items-baseline gap-4">
            <span className="font-extrabold">Total</span>
            <span className="font-mono text-[22px]">{kes(order.totalKes)}</span>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 min-h-[420px] flex flex-col p-6 nav:p-8 rounded-[14px] border border-line bg-panel [--notch:var(--panel)]">
        {view === "pay" && (
          <form noValidate onSubmit={pay} className="enter flex flex-col gap-6">
            <h3 className="m-0 text-[20px] font-extrabold">How do you want to pay?</h3>

            {payError && (
              <p role="alert" className="enter field-error">
                {payError}
              </p>
            )}

            <div className="relative flex w-full max-w-[320px] p-1 rounded-full border border-line bg-ink">
              <div className={`pay-pill ${method === "card" ? "right" : ""}`} aria-hidden="true" />
              {(["mpesa", "card"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={method === m}
                  onClick={() => setMethod(m)}
                  className={`relative flex-1 h-11 border-0 bg-transparent font-extrabold text-[15px] ${
                    method === m ? "text-ink" : "text-paper"
                  }`}
                >
                  {m === "mpesa" ? "M-Pesa" : "Card"}
                </button>
              ))}
            </div>

            {method === "mpesa" ? (
              <div key="mpesa" className="enter flex flex-col gap-2 max-w-[360px]">
                <label htmlFor="phone" className="label">
                  M-Pesa phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "phone-error phone-help" : "phone-help"}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError(null);
                  }}
                  className={`${phoneError ? "field field-bad" : "field"} font-mono text-[17px]`}
                />
                {phoneError && (
                  <p id="phone-error" className="enter field-error">
                    {phoneError}
                  </p>
                )}
                <p id="phone-help" className="field-help">
                  You&apos;ll get a prompt on this phone to enter your PIN. To see a cancelled payment, use{" "}
                  <span className="font-mono">{TEST_FAILURE_PHONE}</span>.
                </p>
              </div>
            ) : (
              <div key="card" className="enter flex flex-col gap-2 max-w-[360px]">
                <label htmlFor="card" className="label">
                  Test card (demo only)
                </label>
                <input
                  id="card"
                  value="4242 4242 4242 4242"
                  readOnly
                  aria-describedby="card-help"
                  className="field font-mono text-[17px] !text-muted"
                />
                <p id="card-help" className="field-help">
                  Real card numbers are never collected in demo mode.
                </p>
              </div>
            )}

            <button type="submit" className="btn btn-cta self-start min-h-14 px-8 text-[17px]">
              Pay {kes(order.totalKes)}
            </button>
          </form>
        )}

        {view === "waiting" && (
          <div role="status" className="enter flex-1 flex flex-col items-center justify-center gap-6 py-8 text-center">
            <div
              aria-hidden="true"
              className="flex items-center justify-center size-16 rounded-full border-[5px] border-orange font-mono text-[20px]"
            >
              {secondsLeft}
            </div>
            <h3 className="display m-0 text-[clamp(20px,3vw,26px)]">
              {payment.current.method === "mpesa" ? "Check your phone" : "Confirming payment"}
            </h3>
            <p className="m-0 max-w-[340px] text-soft leading-[1.55]">
              {payment.current.method === "mpesa"
                ? `Enter your M-Pesa PIN to approve ${kes(order.totalKes)} to Prime Pass. This screen updates on its own.`
                : "Talking to the card network. This takes a few seconds."}
            </p>
          </div>
        )}

        {view === "failed" && (
          <div role="alert" className="enter flex-1 flex flex-col items-start justify-center gap-4 py-8">
            <h3 className="display m-0 text-[clamp(22px,3.4vw,30px)] leading-[1.1]">Payment cancelled</h3>
            <p className="m-0 max-w-[420px] text-soft leading-[1.55]">
              The payment did not go through, so nothing was charged and your seats went back on sale. Try again to
              reserve them.
            </p>
            <button type="button" className="btn btn-cta" onClick={() => setMode("retry")}>
              Try again
            </button>
          </div>
        )}

        {view === "paid" && tickets[0] && (
          <div className="flex flex-wrap gap-8 items-start">
            <TearTicket ticket={tickets[0]} event={event} stamped celebrate={justPaid} onToggle={setTorn} />
            <div className="enter flex-[1_1_220px] min-w-0 flex flex-col items-start gap-3 pt-1">
              <h3 className="display m-0 text-[30px] leading-none">You&apos;re in.</h3>
              <p className="m-0 max-w-[280px] text-soft leading-[1.55]">
                {torn
                  ? "Saved under My Tickets. The QR works offline at the gate."
                  : "Tap the ticket to tear it open and see your QR code."}
                {tickets.length > 1 ? ` Your other ${tickets.length - 1} are in My Tickets.` : ""}
              </p>
              <p className="m-0 font-mono text-[14px] text-peach break-all">Receipt {order.receipt}</p>
              <Link href={`/tickets/${tickets[0].code}`} className="btn btn-cta">
                Printable ticket
              </Link>
              <Link href="/tickets" className="btn btn-ghost">
                My Tickets
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
