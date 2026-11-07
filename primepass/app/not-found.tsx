import Link from "next/link";

export default function NotFound() {
  return (
    <section className="gutter py-24">
      <h1 className="display m-0 text-[32px]">Page not found</h1>
      <p className="m-0 mt-3 mb-6 text-muted">That page isn&apos;t here. The events are.</p>
      <Link href="/events" className="btn btn-cta">
        See all events
      </Link>
    </section>
  );
}
