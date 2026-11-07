"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NotifyButton from "@/components/NotifyButton";
import Poster, { posterAlt, posterPosition } from "@/components/Poster";
import { MAX_TICKETS_PER_ORDER, serviceFee } from "@/lib/config";
import { clockTime, kes, longDate, num, serial } from "@/lib/format";
import { useCurrentUser, useQuery } from "@/lib/hooks";
import { createOrder, getEvent, StoreError } from "@/lib/store";
import type { Event, Tier } from "@/lib/types";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, loading } = useQuery(() => getEvent(id), [id]);

  if (loading) return <div className="flex-1" />;

  if (!event) {
    return (
      <section className="gutter py-24">
        <h1 className="display m-0 text-[32px]">Event not found</h1>
        <p className="m-0 mt-3 mb-6 text-muted">It may have been removed or may not be approved yet.</p>
        <Link href="/events" className="btn btn-cta">
          See all events
        </Link>
      </section>
    );
  }

  return (
    <section className="gutter py-8 nav:py-16">
      <div className="max-w-[1180px] mx-auto">
        <Link href="/events" className="inline-flex items-center min-h-11 no-underline">
          ← Events
        </Link>

        {event.status !== "approved" && (
          <p role="status" className="m-0 mt-4 px-4 py-3 rounded-xl border-2 border-dashed border-peach text-peach">
            {event.status === "pending"
              ? "Waiting for approval. Only you and the admins can see this page."
              : "This event was rejected. Only you and the admins can see this page."}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-8 items-start">
          <div className="relative overflow-hidden flex-[1_1_320px] min-w-0 h-[320px] nav:h-[560px] rounded-[14px] bg-ink border border-line">
            <Poster
              src={event.poster}
              alt={posterAlt(event.poster, event.title)}
              sizes="(max-width: 720px) 100vw, 600px"
              priority
              className={posterPosition(event.poster)}
            />
          </div>

          <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-6">
            <div>
              <p className="m-0 font-mono text-[14px] text-peach">
                {serial(event.id)}
                {event.comingSoon ? " · COMING SOON" : ""}
              </p>
              <h1 className="display m-0 mt-2 text-[clamp(30px,5vw,54px)] leading-[1.05] break-words">{event.title}</h1>
              <p className="m-0 mt-3 text-[18px] font-semibold">
                {event.venue}, {event.city}
              </p>
              <p className="m-0 mt-1 font-mono text-[15px] text-muted">
                {event.startsAt
                  ? `${longDate(event.startsAt)} · Gates open ${clockTime(event.startsAt)}`
                  : "Date to be announced"}
              </p>
            </div>
            <p className="m-0 leading-[1.6] text-soft whitespace-pre-line">{event.description}</p>
            {event.comingSoon ? <ComingSoon eventId={event.id} /> : <TierPicker event={event} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComingSoon({ eventId }: { eventId: string }) {
  return (
    <div className="p-6 rounded-[14px] bg-paper text-ink flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="m-0 text-[14px] font-extrabold text-muted-ink">TICKETS</p>
        <p className="m-0 font-mono text-[20px]">Drop soon</p>
      </div>
      <NotifyButton eventId={eventId} />
    </div>
  );
}

function remaining(tier: Tier) {
  return Math.max(0, tier.capacity - tier.sold);
}

function TierPicker({ event }: { event: Event }) {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const firstOpen = event.tiers.find((t) => remaining(t) > 0);
  const [tierId, setTierId] = useState(firstOpen?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tier = event.tiers.find((t) => t.id === tierId);
  const left = tier ? remaining(tier) : 0;
  const maxQty = Math.min(left, MAX_TICKETS_PER_ORDER);

  // Stock can change underneath the page, for example after a purchase in another tab.
  useEffect(() => {
    if (tier && left === 0) setTierId(firstOpen?.id ?? "");
    if (maxQty > 0 && quantity > maxQty) setQuantity(maxQty);
  }, [tier, left, maxQty, quantity, firstOpen]);

  const subtotal = tier ? tier.priceKes * quantity : 0;
  const fee = serviceFee(subtotal);
  const wrongRole = !!user && user.role !== "attendee";
  const canBuy = !!tier && left > 0 && !wrongRole && event.status === "approved" && !busy && !userLoading;

  async function buy() {
    if (!tier) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const order = await createOrder({ eventId: event.id, tierId: tier.id, quantity });
      router.push(`/checkout/${order.id}`);
    } catch (err) {
      setError(err instanceof StoreError ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="m-0 p-0 border-0 flex flex-col gap-3">
        <legend className="label mb-3">Choose a ticket</legend>
        {event.tiers.map((t) => {
          const count = remaining(t);
          const soldOut = count === 0;
          const on = t.id === tierId;
          return (
            <label
              key={t.id}
              className={`flex items-center justify-between gap-4 min-h-16 px-4 py-3 rounded-[14px] border-2 ${
                soldOut
                  ? "border-line bg-panel text-muted cursor-not-allowed"
                  : on
                    ? "border-orange bg-paper text-ink cursor-pointer"
                    : "border-line bg-paper text-ink cursor-pointer"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <input
                  type="radio"
                  name="tier"
                  value={t.id}
                  checked={on}
                  disabled={soldOut}
                  onChange={() => {
                    setTierId(t.id);
                    setError(null);
                  }}
                  className="size-5 accent-orange shrink-0"
                />
                <span className="min-w-0">
                  <span className="block font-extrabold break-words">{t.name}</span>
                  <span className={`block text-[14px] ${soldOut ? "text-muted" : "text-muted-ink"}`}>
                    {soldOut ? "Sold out" : `${num(count)} left`}
                  </span>
                </span>
              </span>
              <span className="font-mono text-[18px] whitespace-nowrap">{kes(t.priceKes)}</span>
            </label>
          );
        })}
      </fieldset>

      {tier && left > 0 && (
        <div className="flex items-center justify-between gap-4">
          <span id="qty-label" className="label">
            Quantity
          </span>
          <div role="group" aria-labelledby="qty-label" className="flex items-center gap-2">
            <button
              type="button"
              aria-label="One ticket fewer"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => q - 1)}
              className="btn btn-ghost size-11 !p-0"
            >
              -
            </button>
            <output aria-live="polite" className="w-8 text-center font-mono text-[18px]">
              {quantity}
            </output>
            <button
              type="button"
              aria-label="One ticket more"
              disabled={quantity >= maxQty}
              onClick={() => setQuantity((q) => q + 1)}
              className="btn btn-ghost size-11 !p-0"
            >
              +
            </button>
          </div>
        </div>
      )}

      {tier && left > 0 && (
        <div className="flex flex-col gap-1 pt-4 border-t-2 border-dashed border-line text-[15px]">
          <div className="flex justify-between gap-4 text-muted">
            <span>Service fee</span>
            <span className="font-mono">{kes(fee)}</span>
          </div>
          <div className="flex justify-between items-baseline gap-4">
            <span className="font-extrabold">Total</span>
            <span className="font-mono text-[22px] text-orange">{kes(subtotal + fee)}</span>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="enter field-error">
          {error}
        </p>
      )}

      {wrongRole && <p className="field-help">Sign in with an attendee account to buy tickets.</p>}

      <button type="button" className="btn btn-cta min-h-14 text-[17px]" disabled={!canBuy} onClick={() => void buy()}>
        {!firstOpen ? "Sold out" : user || userLoading ? "Buy" : "Sign in to buy"}
      </button>
    </div>
  );
}
