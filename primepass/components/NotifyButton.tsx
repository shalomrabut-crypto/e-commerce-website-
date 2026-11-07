"use client";

import { useQuery } from "@/lib/hooks";
import { isNotifying, toggleNotify } from "@/lib/store";

export default function NotifyButton({ eventId }: { eventId: string }) {
  const { data: on } = useQuery(() => isNotifying(eventId), [eventId], false);

  return (
    <button
      type="button"
      aria-pressed={!!on}
      onClick={() => void toggleNotify(eventId)}
      className={`btn ${on ? "bg-ink text-paper border-2 border-ink" : "btn-ghost-ink"}`}
    >
      {on ? "You'll be notified ✓" : "Notify me"}
    </button>
  );
}
