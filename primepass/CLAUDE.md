# Prime Pass: build spec

Prime Pass is a ticketing platform for verified events in Kenya, built as a solo e-commerce assignment. Attendees buy tickets, organizers sell them, and an admin approves organizers and events.

**This is a front-end-only build. The lecturer said no backend.** There is no database, no real auth, no real payment and no API routes. Every flow still works end to end in the browser using mock data and `localStorage`, so the marker can sign up, buy a ticket, see it in My Tickets, print it, and use the organizer and admin screens.

Read this whole file before writing code. Match the screens in `design-reference/` (open them in a browser). Follow the motion and banned lists exactly.

## Stack

- Next.js 15 (App Router, TypeScript), Tailwind CSS. Client components where state is needed.
- `motion` (formerly Framer Motion) only for the stamp and tear animations
- `qrcode` npm package for ticket QR codes (generated in the browser)
- Deploy on Vercel (static is fine)
- Do not add shadcn/ui. Build the small component set by hand from the tokens below.
- No Supabase, no database, no API routes, no env secrets.

## Fake backend (`lib/store.ts`)

All app state lives in one small client store backed by `localStorage` (key `primepass:v1`). Wrap every read and write in try/catch, and fall back to seed data if storage is empty or blocked.

- Seed data comes from `lib/seed.ts` and loads on first visit.
- Expose plain functions: `signUp`, `logIn`, `logOut`, `currentUser`, `listEvents`, `getEvent`, `createEvent`, `createOrder`, `payOrder`, `listMyTickets`, `approveOrganizer`, `approveEvent`, and so on. Pages call these; none touch `localStorage` directly.
- Keep these function signatures close to what a real API would have, so a backend could replace the store later without rewriting pages.
- **Passwords:** sign-up stores the account without the password. Login only checks the email exists. Add a comment that real auth needs a server.
- Add a "Reset demo data" button in the footer that clears the store and reloads the seed.

## Student details (required by the brief)

The footer on every page shows the student's name and admission number. Keep both values in `lib/site.ts`:

```ts
export const STUDENT = { name: "YOUR FULL NAME", admission: "YOUR ADMISSION NO." };
```

Footer text: `Prime Pass · Built by {name} · {admission} · Student project demo, sample events, no real tickets sold`.

The homepage also shows the same name and admission line under the footer brand.

## Roles

`profiles.role` is one of `attendee | organizer | admin`.

| Role | Can do |
|---|---|
| attendee | Browse, search, buy, see My Tickets, print a ticket |
| organizer | Create events and ticket tiers, see sales for their own events only. Their account is `pending` until an admin approves it. |
| admin | Approve or reject organizers and events, see all orders and total platform revenue |

Route guards in the UI redirect users who don't have the right role. An organizer only ever sees their own events and sales.

**Demo logins** (seeded, shown as one-click buttons on `/login` so the marker can switch roles fast):
- `attendee@primepass.demo`
- `organizer@primepass.demo` (approved)
- `admin@primepass.demo`

## Data shapes (TypeScript types in `lib/types.ts`)

```
User { id, fullName, email, phone, role, orgName?, orgStatus?: pending|approved|rejected }
Event { id, organizerId, title, venue, city, startsAt: string | null, status: pending|approved|rejected, comingSoon, poster, description, tiers: Tier[] }
Tier { id, name, priceKes, capacity, sold }
Order { id, buyerId, eventId, tierId, quantity, subtotalKes, feeKes, totalKes, status: pending|paid|failed, method: mpesa|card, phone?, createdAt }
Ticket { code, orderId, eventId, tierName, holderName }
```

Rules:
- **No overselling.** `createOrder` checks `sold + qty <= capacity` before reserving, and the tier picker shows how many are left. Sold-out tiers are disabled.
- **Fee:** buyer service fee = `ceil(subtotal * 0.033)`, plus the organizer commission of 5% (shown on the organizer dashboard as net payout).
- **Ticket code:** `PP-` + 6 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, unique.
- **QR payload:** `PRIMEPASS|{code}|{event_id}|{tier_name}`.
- **Seed data:**
  - Ed Sheeran, Uhuru Park, Nairobi, Sat 14 Nov 2026 4PM: Regular KES 4,500 (capacity 500), VIP KES 12,000 (capacity 50).
  - Chris Brown, Talanta Stadium, Nairobi: `coming_soon = true`, no tiers.
  - Both events are owned by a seeded approved organizer and use `public/images/ed-crowd.jpg` and `public/images/cb-spotlight.jpg`.
  - Seed one pending organizer and one pending event too, so the admin screen has something to approve.
- **Organizer poster upload:** read the chosen file with `FileReader`, shrink it to max 1200px in a canvas, and store it as a data URL. If it's too large for storage, use a default poster and say so.

## Pages

| Route | Who | What |
|---|---|---|
| `/` | all | Hero, ticker strip, Upcoming events grid, For organizers section, footer. See `design-reference/Main.dc.html`. |
| `/events` | all | Search by title/venue/city, filter by city. Approved events only. |
| `/events/[id]` | all | Poster, details, tier picker with remaining count, quantity, Buy. Coming-soon events show "Notify me" instead (store in a `notify_requests` table). |
| `/checkout/[orderId]` | attendee | Order summary, M-Pesa or demo card, then waiting and paid states. See `Checkout.dc.html`. |
| `/tickets` | attendee | My Tickets. Tap a ticket to tear it open and show the QR. |
| `/tickets/[code]` | owner | Printable ticket, `@media print` hides everything but the ticket. See `Ticket.dc.html`. |
| `/signup`, `/login` | all | Role toggle (attending / organizing). Organizer adds org name. See `Signup.dc.html`. |
| `/organizer` | organizer | Own events with status, create event form (title, venue, city, date, poster upload, tiers), sales per tier, net payout. |
| `/admin` | admin | Pending organizers and events with approve/reject, all orders, revenue totals. |
| `/how-it-works` | all | Value creation model (below), written as a readable page. |

## Payments (simulated)

The payment flow is simulated entirely in the browser. No money moves and no request leaves the browser.

- **M-Pesa:** the user enters a phone number and taps Pay.
  - Show the "Check your phone" waiting screen for about 3 seconds, then `payOrder` marks the order paid, issues one ticket per quantity, and shows the stamp animation.
  - Generate a fake receipt like `SKD4X7P2QM` and show it on the success screen.
- **Phone input:** accept `07…`, `01…`, `+2547…` and `2547…`; normalise to `2547XXXXXXXX`; reject anything else with an inline error.
- **Test failure:** typing the number `254700000000` simulates a cancelled payment. Show the failure state with a "Try again" button, so the marker sees error handling too.
- **Card:** a prefilled read-only `4242 4242 4242 4242`. Never collect real card numbers.
- **Badge:** show "Demo mode · no real charges" on checkout at all times.
- **Write-up note:** in `/how-it-works`, add one short section, "How real payments would work", describing M-Pesa STK Push through Safaricom's Daraja API with a server callback. Describe it only; don't build it.

## Design tokens

```
--ink:      #0E0B10   page background (near-black)
--paper:    #F3EDE4   cards, tickets, light text
--orange:   #FF6A1A   CTAs, prices, stamps, active states
--orange-2: #FF8A47   CTA hover
--peach:    #FFB48A   small labels on dark
--plum:     #4B1D5C   organizer section, support panels (flat, never a gradient)
--line:     #2A2230   borders on dark
--muted:    #B8AFA6   secondary text on dark
--muted-ink:#6B5F55   secondary text on paper
```

- **Fonts** (via `next/font/google`): Unbounded 800 for headings and the wordmark (uppercase), Manrope 400/600/800 for body and UI, DM Mono 500 for ticket numbers, prices and dates.
- **Shapes:** pill buttons and search bar (`border-radius: 999px`), cards and tickets 14px, inputs 12px.
- **Ticket stub:**
  - Dashed perforation line with half-circle notches cut out at both ends (notches use the page background colour).
  - Monospace serial number (`No. 0101`).
- **Contrast:** text at least 4.5:1 everywhere. Touch targets at least 44px.

## Motion (only these things move)

- **Hero:** two photos crossfade every 7s (`public/images/hero-orange.jpg` first, then `hero-hearts.jpg`) with a slow 1.00 to 1.07 zoom. Dark overlay so the headline stays readable. Two progress dots at the bottom right. More photos may be added later, so read the list from an array.
- **Ticker strip:** orange band under the hero scrolling upcoming events, 36s loop.
- **Nav tabs:** bold. Hover shows a short orange underline. The active tab gets a full underline that springs in (`cubic-bezier(.3,1.4,.5,1)`, 240ms).
- **Event card hover:**
  - Lift `translateY(-12px) scale(1.035) rotate(-0.8deg)` with a deep shadow and a 2px orange ring, 220ms in.
  - On leave, spring back with overshoot (`cubic-bezier(.3,1.9,.45,1)`, 650ms).
  - The image inside zooms to 1.06.
- **Panels, modals, payment method switch:** opacity plus 8px rise, 200ms.
- **Payment toggle:** the orange pill slides between options.
- **Purchase success:** the ticket scales 1.1 to 1.0 with -3deg to 0, 260ms. The orange "PAID" stamp thuds in 160ms later (spring overshoot).
- **My Tickets:** tapping a ticket tears the top half up and rotates it slightly, revealing the QR, 320ms.
- **Reduced motion:** wrap everything in `prefers-reduced-motion`. If it's set, show final states and the first hero photo only.

## Banned (these make a site look AI-generated)

- Purple-to-blue gradients
- Any gradient text
- Glassmorphism
- Emojis in headings
- Inter
- Space Grotesk / Instrument Serif
- Colored left-border cards
- The "3 icon boxes in a row" section
- A badge above the headline
- Fade-in-on-scroll for sections
- Cursor-following effects
- Buttons that fade on hover (change color instantly or springily instead)
- Grain over a gradient
- Generic buzzword copy ("seamless", "unlock", "elevate", "revolutionize")
- Em dashes in UI copy
- Untouched shadcn
- Low-contrast dark mode
- Lucide icons everywhere (use a few simple inline SVGs only where needed)
- Inconsistent spacing (use a 4px scale: 4, 8, 12, 16, 24, 32, 48, 64, 96)

## Responsive

- Everything works at 360px width.
- Nav collapses to a menu button below 720px.
- The event grid is `repeat(auto-fit, minmax(300px, 1fr))`.
- Sign-up is a split screen on desktop and a single column on phones (the plum panel becomes a short banner).
- Inputs use the correct `type` (`email`, `tel`), and the phone field is prefilled with `+254 `.
- The submit button must not be hidden by the phone keyboard.

## Value creation model (`/how-it-works`)

Write it in plain English, using the real numbers from the config:

- **Who pays:**
  - Buyers pay a 3.3% service fee.
  - Organizers pay 5% commission on ticket sales.
  - Organizers can pay KES 2,000/week to be featured on the homepage.
- **Why they pay:**
  - Buyers get verified events (no fake-event scams) and instant QR tickets.
  - Organizers get M-Pesa checkout, gate scanning and payout without building anything.
- **Costs:** M-Pesa transaction charges, hosting, organizer verification time.
- **Worked example:** an Ed Sheeran Regular ticket at KES 4,500. Show buyer fee, organizer commission, Prime Pass gross revenue, and the organizer's net payout.

## Build order

1. Scaffold, tokens, fonts, layout with nav and footer (student details from `lib/site.ts`).
2. Types, seed data, `lib/store.ts`, sign-up / login with roles and demo-login buttons.
3. Homepage, events list, event detail.
4. Order creation, checkout with simulated payment, ticket issue, My Tickets, printable ticket with QR.
5. Organizer dashboard and admin approvals.
6. `/how-it-works`, responsive pass, reduced-motion pass, deploy to Vercel.

After each step, run the app and check it works before moving on. Keep a short `README.md` with setup steps, the demo logins and the live URL. State at the top that this is a front-end-only demo.
