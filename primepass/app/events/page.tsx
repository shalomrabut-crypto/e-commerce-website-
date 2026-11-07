import type { Metadata } from "next";
import { Suspense } from "react";
import EventsBrowser from "./EventsBrowser";

export const metadata: Metadata = { title: "Events" };

export default function EventsPage() {
  return (
    <Suspense>
      <EventsBrowser />
    </Suspense>
  );
}
