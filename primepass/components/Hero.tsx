"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

// More photos can be added here. Everything below reads from this list.
const HERO_PHOTOS = [
  { src: "/images/hero-orange.jpg", position: "object-[50%_70%]" },
  { src: "/images/hero-hearts.jpg", position: "object-[50%_40%]" },
];
const SLIDE_MS = 7000;

export default function Hero() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const [q, setQ] = useState("");

  useEffect(() => {
    // With reduced motion the first photo simply stays.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % HERO_PHOTOS.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, []);

  function search(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/events?q=${encodeURIComponent(term)}` : "/events");
  }

  return (
    <section className="gutter relative overflow-hidden min-h-[700px] pt-16 pb-24 nav:pt-24">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="hero-zoom">
          {HERO_PHOTOS.map((photo, i) => (
            <Image
              key={photo.src}
              src={photo.src}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className={`object-cover ${photo.position} hero-slide ${i === active ? "on" : ""}`}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-ink/52" />
        <div className="absolute inset-y-0 left-0 w-[min(62%,760px)] bg-ink/35" />
      </div>

      <div className="relative max-w-[1180px] mx-auto">
        <p className="m-0 mb-6 font-mono text-[14px] text-peach tracking-[2px]">ADMIT ONE · VERIFIED EVENTS ONLY</p>
        <h1 className="display m-0 text-[clamp(38px,7vw,100px)] leading-[1.02] tracking-[-1px] max-w-[900px]">
          Your night
          <br />
          starts at
          <br />
          the <span className="text-orange">gate.</span>
        </h1>
        <p className="m-0 mt-6 max-w-[500px] text-[18px] leading-[1.6] text-soft">
          Concerts, matches and shows across Kenya. Every organizer checked by us, every ticket a QR code on your phone.
        </p>
        <form
          role="search"
          onSubmit={search}
          className="mt-8 flex flex-wrap max-w-[660px] p-2 rounded-[28px] nav:rounded-full bg-paper overflow-hidden"
        >
          <label htmlFor="q" className="sr-only">
            Search events
          </label>
          <input
            id="q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search artists, venues or towns"
            className="flex-[1_1_240px] min-w-0 h-[52px] px-4 border-0 rounded-full bg-transparent text-ink font-semibold text-[16px] placeholder:text-muted-ink placeholder:font-normal"
          />
          <button type="submit" className="btn btn-cta flex-auto nav:flex-none h-[52px]">
            Find tickets
          </button>
        </form>
      </div>

      <div aria-hidden="true" className="absolute right-4 nav:right-8 xl:right-12 bottom-8 flex gap-2">
        {HERO_PHOTOS.map((photo, i) => (
          <div key={photo.src} className={`hero-dot ${i === active ? "on" : ""}`} />
        ))}
      </div>
    </section>
  );
}
