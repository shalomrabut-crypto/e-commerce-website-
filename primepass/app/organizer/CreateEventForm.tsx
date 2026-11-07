"use client";

import { type FormEvent, useRef, useState } from "react";
import { shrinkPoster } from "@/lib/poster";
import { createEvent, StoreError } from "@/lib/store";

interface TierDraft {
  key: number;
  name: string;
  price: string;
  capacity: string;
}

export default function CreateEventForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (message: string) => void;
}) {
  const nextKey = useRef(2);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState<string | null>(null);
  const [posterNote, setPosterNote] = useState<string | null>(null);
  const [tiers, setTiers] = useState<TierDraft[]>([{ key: 1, name: "Regular", price: "", capacity: "" }]);
  const [error, setError] = useState<string | null>(null);

  function updateTier(key: number, change: Partial<TierDraft>) {
    setTiers((list) => list.map((t) => (t.key === key ? { ...t, ...change } : t)));
  }

  async function choosePoster(file: File | undefined) {
    setPoster(null);
    setPosterNote(null);
    if (!file) return;
    try {
      setPoster(await shrinkPoster(file));
    } catch {
      setPosterNote("We couldn't read that file. Your event will use the default poster unless you choose another image.");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      // The form asks for Nairobi time, whatever time zone the browser is in.
      const startsAt = date ? `${date}:00+03:00` : "";
      const { event, posterReplaced } = await createEvent({
        title,
        venue,
        city,
        startsAt,
        poster,
        description,
        tiers: tiers.map((t) => ({ name: t.name, priceKes: Number(t.price), capacity: Number(t.capacity) })),
      });
      onCreated(
        `${event.title} was sent for approval.${
          posterReplaced ? " Your poster was too large for browser storage, so we used the default poster." : ""
        }`,
      );
    } catch (err) {
      setError(err instanceof StoreError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form noValidate onSubmit={submit} className="enter flex flex-col gap-6 p-6 nav:p-8 rounded-[14px] border border-line bg-panel">
      <h2 className="display m-0 text-[clamp(22px,3vw,30px)]">Create event</h2>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
        <TextField id="title" label="Event title" value={title} onChange={setTitle} />
        <TextField id="venue" label="Venue" value={venue} onChange={setVenue} />
        <TextField id="city" label="City" value={city} onChange={setCity} />
        <div className="flex flex-col gap-2 min-w-0">
          <label htmlFor="date" className="label">
            Date and gate time (Nairobi)
          </label>
          <input
            id="date"
            type="datetime-local"
            className="field [color-scheme:dark]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          className="field py-3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="poster" className="label">
          Poster
        </label>
        <input
          id="poster"
          type="file"
          accept="image/*"
          aria-describedby="poster-help"
          className="block w-full min-h-11 text-[14px] text-muted file:mr-3 file:min-h-11 file:px-4 file:rounded-full file:border-2 file:border-paper file:bg-transparent file:text-paper file:font-extrabold file:cursor-pointer"
          onChange={(e) => void choosePoster(e.target.files?.[0])}
        />
        <p id="poster-help" className="field-help">
          {poster ? "Poster ready. It was resized to fit." : "Optional. Images are resized to 1200px at most."}
        </p>
        {posterNote && <p className="enter field-error">{posterNote}</p>}
      </div>

      <fieldset className="m-0 p-0 border-0 flex flex-col gap-4">
        <legend className="label mb-3">Ticket tiers</legend>
        {tiers.map((tier, i) => (
          <div key={tier.key} className="flex flex-wrap items-end gap-3 pb-4 border-b-2 border-dashed border-line">
            <div className="flex-[2_1_160px] min-w-0">
              <TextField
                id={`tier-name-${tier.key}`}
                label={`Tier ${i + 1} name`}
                value={tier.name}
                onChange={(v) => updateTier(tier.key, { name: v })}
              />
            </div>
            <div className="flex-[1_1_120px] min-w-0">
              <TextField
                id={`tier-price-${tier.key}`}
                label="Price (KES)"
                inputMode="numeric"
                value={tier.price}
                onChange={(v) => updateTier(tier.key, { price: v })}
              />
            </div>
            <div className="flex-[1_1_120px] min-w-0">
              <TextField
                id={`tier-capacity-${tier.key}`}
                label="Capacity"
                inputMode="numeric"
                value={tier.capacity}
                onChange={(v) => updateTier(tier.key, { capacity: v })}
              />
            </div>
            {tiers.length > 1 && (
              <button
                type="button"
                className="btn btn-ghost min-h-[52px]"
                aria-label={`Remove tier ${i + 1}`}
                onClick={() => setTiers((list) => list.filter((t) => t.key !== tier.key))}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost self-start"
          onClick={() => {
            const key = nextKey.current++;
            setTiers((list) => [...list, { key, name: "", price: "", capacity: "" }]);
          }}
        >
          Add a tier
        </button>
      </fieldset>

      {error && (
        <p role="alert" className="enter field-error">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn btn-cta min-h-14 px-8 text-[17px]">
          Send for approval
        </button>
        <button type="button" className="btn btn-ghost min-h-14" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric";
}) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} className="field" inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
