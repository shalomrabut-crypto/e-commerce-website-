import { serviceFee } from "./config";
import type { Event, Order, StoreState, Ticket, User } from "./types";

export const DEMO_LOGINS = [
  { email: "attendee@primepass.demo", label: "Attendee" },
  { email: "organizer@primepass.demo", label: "Organizer" },
  { email: "admin@primepass.demo", label: "Admin" },
] as const;

const ORGANIZER_ID = "usr-organizer";
const BUYER_ID = "usr-brian";

const users: User[] = [
  {
    id: "usr-attendee",
    fullName: "Achieng Otieno",
    email: "attendee@primepass.demo",
    phone: "254712345678",
    role: "attendee",
  },
  {
    id: ORGANIZER_ID,
    fullName: "Wanjiru Kamau",
    email: "organizer@primepass.demo",
    phone: "254722000111",
    role: "organizer",
    orgName: "Savanna Live",
    orgStatus: "approved",
  },
  {
    id: "usr-admin",
    fullName: "Prime Pass Admin",
    email: "admin@primepass.demo",
    phone: "254733000222",
    role: "admin",
  },
  {
    id: "usr-pending",
    fullName: "Hassan Mwinyi",
    email: "hassan@coastnights.demo",
    phone: "254711000333",
    role: "organizer",
    orgName: "Coast Nights",
    orgStatus: "pending",
  },
  {
    id: BUYER_ID,
    fullName: "Brian Kiptoo",
    email: "brian@example.demo",
    phone: "254701000444",
    role: "attendee",
  },
];

const events: Event[] = [
  {
    id: "EVT-0101",
    organizerId: ORGANIZER_ID,
    title: "Ed Sheeran",
    venue: "Uhuru Park",
    city: "Nairobi",
    startsAt: "2026-11-14T16:00:00+03:00",
    status: "approved",
    comingSoon: false,
    poster: "/images/ed-crowd.jpg",
    description:
      "One night in the open air at Uhuru Park. Gates open at 4PM. Bring your QR code on your phone or printed, and come early for the Regular section.",
    tiers: [
      { id: "tier-ed-regular", name: "Regular", priceKes: 4500, capacity: 500, sold: 3 },
      { id: "tier-ed-vip", name: "VIP", priceKes: 12000, capacity: 50, sold: 1 },
    ],
  },
  {
    id: "EVT-0102",
    organizerId: ORGANIZER_ID,
    title: "Chris Brown",
    venue: "Talanta Stadium",
    city: "Nairobi",
    startsAt: null,
    status: "approved",
    comingSoon: true,
    poster: "/images/cb-spotlight.jpg",
    description:
      "The date and ticket tiers are still being confirmed. Tap Notify me and we will tell you when tickets drop.",
    tiers: [],
  },
  {
    id: "EVT-0103",
    organizerId: ORGANIZER_ID,
    title: "Coast Jazz Night",
    venue: "Fort Jesus Grounds",
    city: "Mombasa",
    startsAt: "2026-12-12T18:00:00+03:00",
    status: "pending",
    comingSoon: false,
    poster: "/images/hero-hearts.jpg",
    description: "Six bands, one sea breeze. A long evening of jazz on the old fort grounds.",
    tiers: [
      { id: "tier-jazz-regular", name: "Regular", priceKes: 2000, capacity: 200, sold: 0 },
      { id: "tier-jazz-table", name: "Table for two", priceKes: 7500, capacity: 20, sold: 0 },
    ],
  },
];

function paidOrder(
  id: string,
  eventId: string,
  tierId: string,
  priceKes: number,
  quantity: number,
  receipt: string,
  createdAt: string,
): Order {
  const subtotalKes = priceKes * quantity;
  const feeKes = serviceFee(subtotalKes);
  return {
    id,
    buyerId: BUYER_ID,
    eventId,
    tierId,
    quantity,
    subtotalKes,
    feeKes,
    totalKes: subtotalKes + feeKes,
    status: "paid",
    method: "mpesa",
    phone: "254701000444",
    createdAt,
    receipt,
  };
}

// Sample sales from another buyer, so the organizer and admin screens have numbers on first load.
// The demo attendee starts with no tickets, so their first purchase is the first thing they see.
const orders: Order[] = [
  paidOrder("ORD-1001", "EVT-0101", "tier-ed-regular", 4500, 3, "SKA7M2P9QX", "2026-11-02T10:12:00+03:00"),
  paidOrder("ORD-1002", "EVT-0101", "tier-ed-vip", 12000, 1, "SKC3T8R4HN", "2026-11-04T19:40:00+03:00"),
];

const tickets: Ticket[] = [
  { code: "PP-K7M2QX", orderId: "ORD-1001", eventId: "EVT-0101", tierName: "Regular", holderName: "Brian Kiptoo" },
  { code: "PP-H3W9TZ", orderId: "ORD-1001", eventId: "EVT-0101", tierName: "Regular", holderName: "Brian Kiptoo" },
  { code: "PP-R5N8DV", orderId: "ORD-1001", eventId: "EVT-0101", tierName: "Regular", holderName: "Brian Kiptoo" },
  { code: "PP-B4Y6JF", orderId: "ORD-1002", eventId: "EVT-0101", tierName: "VIP", holderName: "Brian Kiptoo" },
];

export function seedState(): StoreState {
  // Deep copy, so changes to the live store never touch the seed.
  return JSON.parse(
    JSON.stringify({ users, events, orders, tickets, notify_requests: [], sessionUserId: null }),
  ) as StoreState;
}

/** Public events available before the browser store has loaded. */
export function seedPublicEvents(): Event[] {
  return seedState().events.filter((e) => e.status === "approved");
}
