"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import EventCard from "@/components/EventCard";
import { useQuery } from "@/lib/hooks";
import { listCities, listEvents } from "@/lib/store";

export default function EventsBrowser() {
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [city, setCity] = useState("");

  const { data: cities = [] } = useQuery(listCities, []);
  const { data: events, loading } = useQuery(() => listEvents({ q, city }), [q, city]);

  return (
    <section className="gutter py-12 nav:py-16">
      <div className="max-w-[1180px] mx-auto">
        <h1 className="display m-0 text-[clamp(30px,5vw,54px)]">Events</h1>
        <p className="m-0 mt-3 text-muted">Every event here comes from an organizer we have checked.</p>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="mt-8 mb-12 flex flex-wrap gap-3 items-end"
        >
          <div className="flex-[1_1_280px] min-w-0">
            <label htmlFor="search" className="label mb-2">
              Search by title, venue or city
            </label>
            <input
              id="search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search artists, venues or towns"
              className="w-full h-[52px] px-6 rounded-full border-0 bg-paper text-ink font-semibold text-[16px] placeholder:text-muted-ink placeholder:font-normal"
            />
          </div>
          <div className="flex-[0_1_220px] min-w-[160px] max-[400px]:flex-auto">
            <label htmlFor="city" className="label mb-2">
              City
            </label>
            <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="field">
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </form>

        {!loading && events && events.length === 0 && (
          <div className="enter py-12" role="status">
            <p className="m-0 text-[18px] font-extrabold">No events match that search.</p>
            <p className="m-0 mt-2 mb-6 text-muted">Try another artist, venue or town.</p>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setQ("");
                setCity("");
              }}
            >
              Clear search
            </button>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
