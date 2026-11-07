"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { serial, shortDate } from "@/lib/format";
import { qrPayload } from "@/lib/ticket";
import type { Event, Ticket } from "@/lib/types";
import QrCode from "./QrCode";

const SPRING_THUD = [0.3, 1.6, 0.5, 1] as const;
const TEAR_EASE = [0.2, 0.9, 0.3, 1.3] as const;

/**
 * A ticket stub. Tapping it tears the top half up and reveals the QR.
 * With `celebrate`, it plays the purchase animation: the ticket settles, then the PAID stamp thuds in.
 */
export default function TearTicket({
  ticket,
  event,
  stamped = false,
  celebrate = false,
  onToggle,
}: {
  ticket: Ticket;
  event: Event;
  stamped?: boolean;
  celebrate?: boolean;
  onToggle?: (open: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const animateIn = celebrate && !reduced;
  const tear = reduced ? { duration: 0 } : { duration: 0.32, ease: TEAR_EASE };
  const reveal = reduced ? { duration: 0 } : { duration: 0.32, ease: "easeOut" as const };

  return (
    <motion.button
      type="button"
      aria-expanded={open}
      aria-label={`${event.title} ticket ${ticket.code}. ${open ? "Hide" : "Show"} QR code`}
      onClick={() => {
        setOpen(!open);
        onToggle?.(!open);
      }}
      initial={animateIn ? { scale: 1.1, rotate: -3, opacity: 0 } : false}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
      className="block w-full max-w-[300px] p-0 border-0 bg-transparent text-left text-ink rounded-[14px]"
    >
      {/* Top half */}
      <motion.span
        className="relative block origin-bottom-left"
        initial={false}
        animate={open ? { y: -12, rotate: -3 } : { y: 0, rotate: 0 }}
        transition={tear}
      >
        <span className={`relative block overflow-hidden p-6 rounded-t-[14px] bg-paper ${stamped ? "pb-16" : "pb-8"}`}>
          <span className="block font-mono text-[12px] text-muted-ink">ADMIT ONE · {ticket.code}</span>
          <span className="display block mt-3 mb-1 text-[22px] leading-[1.05] break-words">{event.title}</span>
          <span className="block text-[14px] font-semibold text-body-ink">
            {event.startsAt ? `${shortDate(event.startsAt)} · ` : ""}
            {event.venue} · {ticket.tierName}
          </span>
          <span aria-hidden="true" className="absolute left-4 right-4 bottom-0 border-b-2 border-dashed border-perf" />
          <span aria-hidden="true" className="absolute -left-3 -bottom-3 size-6 rounded-full bg-[var(--notch)]" />
          <span aria-hidden="true" className="absolute -right-3 -bottom-3 size-6 rounded-full bg-[var(--notch)]" />
        </span>
        {stamped && (
          <motion.span
            className="display absolute right-6 bottom-4 block px-3 py-1 rounded-lg border-[3px] border-ink bg-orange text-ink text-[18px] tracking-[2px]"
            initial={animateIn ? { opacity: 0, scale: 2.4, rotate: -14 } : false}
            animate={{ opacity: 1, scale: 1, rotate: -14 }}
            transition={{ duration: 0.34, delay: 0.26 + 0.16, ease: SPRING_THUD }}
          >
            PAID
          </motion.span>
        )}
      </motion.span>

      {/* The QR, revealed under the tear */}
      <motion.span
        aria-hidden={!open}
        className="block overflow-hidden bg-paper"
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={reveal}
      >
        <span className="flex flex-col items-center gap-2 p-4">
          <QrCode value={qrPayload(ticket)} size={176} label={`QR code for ticket ${ticket.code}`} />
          <span className="block font-mono text-[12px] text-body-ink">Show this at the gate</span>
        </span>
      </motion.span>

      {/* Bottom half */}
      <span className="relative block overflow-hidden flex items-center justify-between gap-3 px-6 py-3 min-h-11 rounded-b-[14px] bg-paper font-mono text-[12px] text-muted-ink">
        <span aria-hidden="true" className="absolute -left-3 -top-3 size-6 rounded-full bg-[var(--notch)]" />
        <span aria-hidden="true" className="absolute -right-3 -top-3 size-6 rounded-full bg-[var(--notch)]" />
        <span>{serial(event.id)}</span>
        <span>{open ? "TAP TO CLOSE" : "TAP TO OPEN"}</span>
      </span>
    </motion.button>
  );
}
