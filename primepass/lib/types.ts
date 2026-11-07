export type Role = "attendee" | "organizer" | "admin";
export type OrgStatus = "pending" | "approved" | "rejected";
export type EventStatus = "pending" | "approved" | "rejected";
export type OrderStatus = "pending" | "paid" | "failed";
export type PaymentMethod = "mpesa" | "card";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  orgName?: string;
  orgStatus?: OrgStatus;
}

export interface Tier {
  id: string;
  name: string;
  priceKes: number;
  capacity: number;
  sold: number;
}

export interface Event {
  id: string;
  organizerId: string;
  title: string;
  venue: string;
  city: string;
  startsAt: string | null;
  status: EventStatus;
  comingSoon: boolean;
  poster: string;
  description: string;
  tiers: Tier[];
}

export interface Order {
  id: string;
  buyerId: string;
  eventId: string;
  tierId: string;
  quantity: number;
  subtotalKes: number;
  feeKes: number;
  totalKes: number;
  status: OrderStatus;
  method: PaymentMethod;
  phone?: string;
  createdAt: string;
  /** Fake receipt shown after a simulated payment. */
  receipt?: string;
}

export interface Ticket {
  code: string;
  orderId: string;
  eventId: string;
  tierName: string;
  holderName: string;
}

export interface NotifyRequest {
  eventId: string;
  /** The signed-in user, or "guest" for a visitor without an account. */
  userKey: string;
  createdAt: string;
}

export interface StoreState {
  users: User[];
  events: Event[];
  orders: Order[];
  tickets: Ticket[];
  notify_requests: NotifyRequest[];
  sessionUserId: string | null;
}
