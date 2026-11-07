// The fake backend. All app state lives here, backed by localStorage.
//
// Every function is async and does its own permission checks, the way an API would,
// so a real backend could replace this file without rewriting the pages.
// Failed calls throw StoreError with a message that is safe to show to the user.

import {
  commission,
  DEFAULT_POSTER,
  MAX_TICKETS_PER_ORDER,
  RESERVATION_MINUTES,
  serviceFee,
} from "./config";
import { normalizePhone, PHONE_ERROR, TEST_FAILURE_PHONE } from "./phone";
import { seedState } from "./seed";
import type {
  Event,
  Order,
  OrgStatus,
  PaymentMethod,
  Role,
  StoreState,
  Ticket,
  Tier,
  User,
} from "./types";

const STORAGE_KEY = "primepass:v1";
const CHANGE_EVENT = "primepass:change";
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const RECEIPT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
const MAX_POSTER_CHARS = 1_500_000;

export class StoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreError";
  }
}

/* ------------------------------ persistence ------------------------------ */

// Used when localStorage is blocked, so the demo still works until the tab closes.
let memory: StoreState | null = null;

function read(): StoreState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (Array.isArray(parsed.users) && Array.isArray(parsed.events)) {
        memory = parsed;
        return parsed;
      }
    }
  } catch {
    // Blocked or corrupt storage: fall through to memory or seed.
  }
  if (!memory) {
    memory = seedState();
    write(memory);
  }
  return memory;
}

function write(state: StoreState): boolean {
  memory = state;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function commit(state: StoreState): boolean {
  const saved = write(state);
  notifyChange();
  return saved;
}

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Runs `listener` when store data changes, in this tab or another one. Returns an unsubscribe function. */
export function subscribe(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Clears the store and reloads the seed. */
export async function resetDemo(): Promise<void> {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: resetting memory below is enough.
  }
  memory = null;
  read();
  notifyChange();
}

/* ------------------------------- helpers -------------------------------- */

function randomFrom(alphabet: string, length: number): string {
  let out = "";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) out += alphabet[values[i] % alphabet.length];
  return out;
}

function newId(prefix: string): string {
  return `${prefix}-${randomFrom(CODE_ALPHABET, 8)}`;
}

function newTicketCode(state: StoreState, alsoTaken: Ticket[]): string {
  for (;;) {
    const code = `PP-${randomFrom(CODE_ALPHABET, 6)}`;
    const taken = state.tickets.some((t) => t.code === code) || alsoTaken.some((t) => t.code === code);
    if (!taken) return code;
  }
}

function nextEventId(state: StoreState): string {
  const highest = state.events.reduce((max, e) => {
    const n = Number(e.id.replace("EVT-", ""));
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 100);
  return `EVT-${String(highest + 1).padStart(4, "0")}`;
}

function sessionUser(state: StoreState): User | null {
  return state.users.find((u) => u.id === state.sessionUserId) ?? null;
}

function requireRole(state: StoreState, ...roles: Role[]): User {
  const user = sessionUser(state);
  if (!user) throw new StoreError("Please sign in first.");
  if (!roles.includes(user.role)) throw new StoreError("Your account can't do that.");
  return user;
}

function tierOf(event: Event, tierId: string): Tier | undefined {
  return event.tiers.find((t) => t.id === tierId);
}

/** Gives seats held by unpaid orders back once the reservation runs out. Returns true if anything changed. */
function releaseExpired(state: StoreState): boolean {
  const cutoff = Date.now() - RESERVATION_MINUTES * 60_000;
  let changed = false;
  for (const order of state.orders) {
    if (order.status === "pending" && new Date(order.createdAt).getTime() < cutoff) {
      markFailed(state, order);
      changed = true;
    }
  }
  return changed;
}

function markFailed(state: StoreState, order: Order) {
  order.status = "failed";
  const event = state.events.find((e) => e.id === order.eventId);
  const tier = event && tierOf(event, order.tierId);
  if (tier) tier.sold = Math.max(0, tier.sold - order.quantity);
}

/* --------------------------------- auth --------------------------------- */

export interface SignUpInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: "attendee" | "organizer";
  orgName?: string;
}

/**
 * The password is accepted so the form matches a real sign-up, then thrown away.
 * It is never stored. Real auth needs a server.
 */
export async function signUp(input: SignUpInput): Promise<User> {
  const state = read();
  const email = input.email.trim().toLowerCase();
  const phone = normalizePhone(input.phone);

  if (!input.fullName.trim()) throw new StoreError("Enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new StoreError("Enter an email so we can send your tickets.");
  if (!phone) throw new StoreError(PHONE_ERROR);
  if (!input.password) throw new StoreError("Choose a password.");
  if (input.role === "organizer" && !input.orgName?.trim()) {
    throw new StoreError("Enter your organization or club name.");
  }
  if (state.users.some((u) => u.email === email)) {
    throw new StoreError("That email already has an account. Sign in instead.");
  }

  const user: User = {
    id: newId("usr"),
    fullName: input.fullName.trim(),
    email,
    phone,
    role: input.role,
    ...(input.role === "organizer"
      ? { orgName: input.orgName!.trim(), orgStatus: "pending" as OrgStatus }
      : {}),
  };
  state.users.push(user);
  state.sessionUserId = user.id;
  commit(state);
  return user;
}

/**
 * Demo login: only checks that the email exists. The password is not checked,
 * because none is stored. Real auth needs a server.
 */
export async function logIn(email: string): Promise<User> {
  const state = read();
  const user = state.users.find((u) => u.email === email.trim().toLowerCase());
  if (!user) throw new StoreError("No account with that email. Check it, or create an account.");
  state.sessionUserId = user.id;
  commit(state);
  return user;
}

export async function logOut(): Promise<void> {
  const state = read();
  state.sessionUserId = null;
  commit(state);
}

export async function currentUser(): Promise<User | null> {
  return sessionUser(read());
}

/* -------------------------------- events -------------------------------- */

export async function listEvents(filter?: { q?: string; city?: string }): Promise<Event[]> {
  const q = filter?.q?.trim().toLowerCase() ?? "";
  const city = filter?.city ?? "";
  return read().events.filter(
    (e) =>
      e.status === "approved" &&
      (!city || e.city === city) &&
      (!q || [e.title, e.venue, e.city].some((field) => field.toLowerCase().includes(q))),
  );
}

export async function listCities(): Promise<string[]> {
  const cities = read()
    .events.filter((e) => e.status === "approved")
    .map((e) => e.city);
  return [...new Set(cities)].sort();
}

/** Unapproved events are visible only to their organizer and to admins. */
export async function getEvent(id: string): Promise<Event | null> {
  const state = read();
  if (releaseExpired(state)) commit(state);
  const event = state.events.find((e) => e.id === id);
  if (!event) return null;
  if (event.status === "approved") return event;
  const user = sessionUser(state);
  return user && (user.role === "admin" || user.id === event.organizerId) ? event : null;
}

export interface CreateEventInput {
  title: string;
  venue: string;
  city: string;
  startsAt: string;
  poster: string | null;
  description: string;
  tiers: { name: string; priceKes: number; capacity: number }[];
}

/** New events start as pending. `posterReplaced` is true if the upload didn't fit in browser storage. */
export async function createEvent(input: CreateEventInput): Promise<{ event: Event; posterReplaced: boolean }> {
  const state = read();
  const user = requireRole(state, "organizer");
  if (user.orgStatus !== "approved") throw new StoreError("Your organizer account hasn't been approved yet.");

  if (!input.title.trim() || !input.venue.trim() || !input.city.trim()) {
    throw new StoreError("Add a title, venue and city.");
  }
  const when = new Date(input.startsAt);
  if (Number.isNaN(when.getTime())) throw new StoreError("Choose a date and time.");
  if (when.getTime() <= Date.now()) throw new StoreError("Choose a date in the future.");
  if (input.tiers.length === 0) throw new StoreError("Add at least one ticket tier.");
  for (const t of input.tiers) {
    if (!t.name.trim()) throw new StoreError("Give every tier a name.");
    if (!Number.isInteger(t.priceKes) || t.priceKes < 1) throw new StoreError("Tier prices must be whole shillings, 1 or more.");
    if (!Number.isInteger(t.capacity) || t.capacity < 1) throw new StoreError("Tier capacity must be a whole number, 1 or more.");
  }

  let posterReplaced = false;
  let poster = input.poster ?? DEFAULT_POSTER;
  if (poster.length > MAX_POSTER_CHARS) {
    poster = DEFAULT_POSTER;
    posterReplaced = true;
  }

  const event: Event = {
    id: nextEventId(state),
    organizerId: user.id,
    title: input.title.trim(),
    venue: input.venue.trim(),
    city: input.city.trim(),
    startsAt: when.toISOString(),
    status: "pending",
    comingSoon: false,
    poster,
    description: input.description.trim(),
    tiers: input.tiers.map((t) => ({
      id: newId("tier"),
      name: t.name.trim(),
      priceKes: t.priceKes,
      capacity: t.capacity,
      sold: 0,
    })),
  };
  state.events.push(event);

  // Storage is full: drop the uploaded image and try again with the default poster.
  if (!write(state) && input.poster) {
    event.poster = DEFAULT_POSTER;
    posterReplaced = true;
  }
  commit(state);
  return { event, posterReplaced };
}

/* ------------------------------ notify me ------------------------------- */

function notifyKey(state: StoreState): string {
  return state.sessionUserId ?? "guest";
}

export async function isNotifying(eventId: string): Promise<boolean> {
  const state = read();
  const key = notifyKey(state);
  return state.notify_requests.some((n) => n.eventId === eventId && n.userKey === key);
}

/** Adds or removes a notify request. Returns whether the visitor is now on the list. */
export async function toggleNotify(eventId: string): Promise<boolean> {
  const state = read();
  const key = notifyKey(state);
  const existing = state.notify_requests.findIndex((n) => n.eventId === eventId && n.userKey === key);
  if (existing >= 0) {
    state.notify_requests.splice(existing, 1);
  } else {
    state.notify_requests.push({ eventId, userKey: key, createdAt: new Date().toISOString() });
  }
  commit(state);
  return existing < 0;
}

/* -------------------------------- orders -------------------------------- */

/** Reserves seats and creates a pending order. Refuses to oversell. */
export async function createOrder(input: { eventId: string; tierId: string; quantity: number }): Promise<Order> {
  const state = read();
  releaseExpired(state);
  const user = requireRole(state, "attendee");

  const event = state.events.find((e) => e.id === input.eventId && e.status === "approved");
  if (!event || event.comingSoon) throw new StoreError("Tickets for this event aren't on sale.");
  const tier = tierOf(event, input.tierId);
  if (!tier) throw new StoreError("Choose a ticket tier.");
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_TICKETS_PER_ORDER) {
    throw new StoreError(`Choose between 1 and ${MAX_TICKETS_PER_ORDER} tickets.`);
  }
  if (tier.sold + input.quantity > tier.capacity) {
    const left = tier.capacity - tier.sold;
    commit(state);
    throw new StoreError(left > 0 ? `Only ${left} ${tier.name} left.` : `${tier.name} is sold out.`);
  }

  tier.sold += input.quantity;
  const subtotalKes = tier.priceKes * input.quantity;
  const feeKes = serviceFee(subtotalKes);
  const order: Order = {
    id: newId("ORD"),
    buyerId: user.id,
    eventId: event.id,
    tierId: tier.id,
    quantity: input.quantity,
    subtotalKes,
    feeKes,
    totalKes: subtotalKes + feeKes,
    status: "pending",
    method: "mpesa",
    createdAt: new Date().toISOString(),
  };
  state.orders.push(order);
  commit(state);
  return order;
}

export interface OrderDetails {
  order: Order;
  event: Event;
  tier: Tier;
  tickets: Ticket[];
}

function detailsFor(state: StoreState, order: Order): OrderDetails | null {
  const event = state.events.find((e) => e.id === order.eventId);
  const tier = event && tierOf(event, order.tierId);
  if (!event || !tier) return null;
  return { order, event, tier, tickets: state.tickets.filter((t) => t.orderId === order.id) };
}

/** Returns the order only if it belongs to the signed-in user. */
export async function getOrder(id: string): Promise<OrderDetails | null> {
  const state = read();
  if (releaseExpired(state)) commit(state);
  const user = sessionUser(state);
  const order = state.orders.find((o) => o.id === id);
  if (!order || !user || order.buyerId !== user.id) return null;
  return detailsFor(state, order);
}

/**
 * Simulates the payment provider's answer. No money moves and no request leaves the browser.
 * The phone number 254700000000 simulates a cancelled payment and releases the seats.
 * Paying a failed order again re-reserves the seats, if there are still enough.
 */
export async function payOrder(
  orderId: string,
  payment: { method: PaymentMethod; phone?: string },
): Promise<OrderDetails> {
  const state = read();
  releaseExpired(state);
  const user = requireRole(state, "attendee");
  const order = state.orders.find((o) => o.id === orderId && o.buyerId === user.id);
  if (!order) throw new StoreError("We can't find that order.");

  const event = state.events.find((e) => e.id === order.eventId);
  const tier = event && tierOf(event, order.tierId);
  if (!event || !tier) throw new StoreError("We can't find that order.");

  // Already paid (for example, from another tab). Don't issue tickets twice.
  if (order.status === "paid") return detailsFor(state, order)!;

  let phone: string | undefined;
  if (payment.method === "mpesa") {
    phone = normalizePhone(payment.phone ?? "") ?? undefined;
    if (!phone) throw new StoreError(PHONE_ERROR);
  }

  if (order.status === "failed") {
    if (tier.sold + order.quantity > tier.capacity) {
      commit(state);
      throw new StoreError(`There aren't enough ${tier.name} tickets left for this order.`);
    }
    tier.sold += order.quantity;
    order.status = "pending";
    order.createdAt = new Date().toISOString();
  }

  order.method = payment.method;
  order.phone = phone;

  if (payment.method === "mpesa" && phone === TEST_FAILURE_PHONE) {
    markFailed(state, order);
    commit(state);
    return detailsFor(state, order)!;
  }

  order.status = "paid";
  order.receipt = `S${randomFrom(RECEIPT_ALPHABET, 9)}`;
  const issued: Ticket[] = [];
  for (let i = 0; i < order.quantity; i++) {
    issued.push({
      code: newTicketCode(state, issued),
      orderId: order.id,
      eventId: order.eventId,
      tierName: tier.name,
      holderName: user.fullName,
    });
  }
  state.tickets.push(...issued);
  commit(state);
  return detailsFor(state, order)!;
}

/* -------------------------------- tickets ------------------------------- */

export interface TicketDetails {
  ticket: Ticket;
  event: Event;
  order: Order;
  tier: Tier;
}

function ticketDetails(state: StoreState, ticket: Ticket): TicketDetails | null {
  const order = state.orders.find((o) => o.id === ticket.orderId);
  const event = state.events.find((e) => e.id === ticket.eventId);
  const tier = event && order && tierOf(event, order.tierId);
  if (!order || !event || !tier) return null;
  return { ticket, event, order, tier };
}

export async function listMyTickets(): Promise<TicketDetails[]> {
  const state = read();
  const user = requireRole(state, "attendee");
  const myOrders = new Set(state.orders.filter((o) => o.buyerId === user.id).map((o) => o.id));
  return state.tickets
    .filter((t) => myOrders.has(t.orderId))
    .map((t) => ticketDetails(state, t))
    .filter((t): t is TicketDetails => t !== null)
    .reverse();
}

/** Returns the ticket only if the signed-in user owns it. */
export async function getTicket(code: string): Promise<TicketDetails | null> {
  const state = read();
  const user = sessionUser(state);
  const ticket = state.tickets.find((t) => t.code === code);
  if (!ticket || !user) return null;
  const details = ticketDetails(state, ticket);
  return details && details.order.buyerId === user.id ? details : null;
}

/* ------------------------------ organizer ------------------------------- */

export interface TierSales {
  tier: Tier;
  /** Tickets from paid orders only. `tier.sold` also counts seats held by unpaid orders. */
  soldPaid: number;
  grossKes: number;
  commissionKes: number;
  netKes: number;
}

export interface OrganizerEvent {
  event: Event;
  tiers: TierSales[];
  grossKes: number;
  commissionKes: number;
  netKes: number;
}

/** An organizer only ever sees their own events and sales. */
export async function listMyEvents(): Promise<OrganizerEvent[]> {
  const state = read();
  if (releaseExpired(state)) commit(state);
  const user = requireRole(state, "organizer");

  return state.events
    .filter((e) => e.organizerId === user.id)
    .map((event) => {
      const tiers = event.tiers.map((tier) => {
        const paid = state.orders.filter(
          (o) => o.eventId === event.id && o.tierId === tier.id && o.status === "paid",
        );
        const grossKes = paid.reduce((sum, o) => sum + o.subtotalKes, 0);
        const commissionKes = paid.reduce((sum, o) => sum + commission(o.subtotalKes), 0);
        return {
          tier,
          soldPaid: paid.reduce((sum, o) => sum + o.quantity, 0),
          grossKes,
          commissionKes,
          netKes: grossKes - commissionKes,
        };
      });
      return {
        event,
        tiers,
        grossKes: tiers.reduce((sum, t) => sum + t.grossKes, 0),
        commissionKes: tiers.reduce((sum, t) => sum + t.commissionKes, 0),
        netKes: tiers.reduce((sum, t) => sum + t.netKes, 0),
      };
    });
}

/* -------------------------------- admin --------------------------------- */

export async function listPendingOrganizers(): Promise<User[]> {
  const state = read();
  requireRole(state, "admin");
  return state.users.filter((u) => u.role === "organizer" && u.orgStatus === "pending");
}

export interface PendingEvent {
  event: Event;
  organizer: User | null;
}

export async function listPendingEvents(): Promise<PendingEvent[]> {
  const state = read();
  requireRole(state, "admin");
  return state.events
    .filter((e) => e.status === "pending")
    .map((event) => ({ event, organizer: state.users.find((u) => u.id === event.organizerId) ?? null }));
}

function decideOrganizer(id: string, status: OrgStatus) {
  const state = read();
  requireRole(state, "admin");
  const user = state.users.find((u) => u.id === id && u.role === "organizer");
  if (!user) throw new StoreError("We can't find that organizer.");
  user.orgStatus = status;
  commit(state);
}

export async function approveOrganizer(id: string): Promise<void> {
  decideOrganizer(id, "approved");
}

export async function rejectOrganizer(id: string): Promise<void> {
  decideOrganizer(id, "rejected");
}

function decideEvent(id: string, status: "approved" | "rejected") {
  const state = read();
  requireRole(state, "admin");
  const event = state.events.find((e) => e.id === id);
  if (!event) throw new StoreError("We can't find that event.");
  event.status = status;
  commit(state);
}

export async function approveEvent(id: string): Promise<void> {
  decideEvent(id, "approved");
}

export async function rejectEvent(id: string): Promise<void> {
  decideEvent(id, "rejected");
}

export interface AdminOrder {
  order: Order;
  buyerName: string;
  eventTitle: string;
  tierName: string;
}

export async function listAllOrders(): Promise<AdminOrder[]> {
  const state = read();
  if (releaseExpired(state)) commit(state);
  requireRole(state, "admin");
  return [...state.orders]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((order) => {
      const event = state.events.find((e) => e.id === order.eventId);
      return {
        order,
        buyerName: state.users.find((u) => u.id === order.buyerId)?.fullName ?? "Unknown",
        eventTitle: event?.title ?? "Unknown",
        tierName: (event && tierOf(event, order.tierId)?.name) ?? "Unknown",
      };
    });
}

export interface PlatformTotals {
  ticketSalesKes: number;
  serviceFeesKes: number;
  commissionKes: number;
  revenueKes: number;
  paidOrders: number;
  ticketsSold: number;
}

export async function platformTotals(): Promise<PlatformTotals> {
  const state = read();
  requireRole(state, "admin");
  const paid = state.orders.filter((o) => o.status === "paid");
  const serviceFeesKes = paid.reduce((sum, o) => sum + o.feeKes, 0);
  const commissionKes = paid.reduce((sum, o) => sum + commission(o.subtotalKes), 0);
  return {
    ticketSalesKes: paid.reduce((sum, o) => sum + o.subtotalKes, 0),
    serviceFeesKes,
    commissionKes,
    revenueKes: serviceFeesKes + commissionKes,
    paidOrders: paid.length,
    ticketsSold: paid.reduce((sum, o) => sum + o.quantity, 0),
  };
}
