# Prime Pass

**This is a front-end-only demo.** There is no backend, no database, no real login and no real payment. All data lives in your browser's `localStorage`. No money moves and no real tickets are sold.

Prime Pass is a ticketing site for verified events in Kenya, built as a solo e-commerce assignment. Attendees buy tickets, organizers sell them, and an admin approves organizers and events.

**Live URL:** not deployed yet

## Setup

You need Node.js 20 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

For a production build: `npm run build`, then `npm start`.

## Demo logins

These are one-click buttons on `/login`. Passwords are not checked.

| Role | Email |
|---|---|
| Attendee | `attendee@primepass.demo` |
| Organizer (approved) | `organizer@primepass.demo` |
| Admin | `admin@primepass.demo` |

The pending organizer to approve is `hassan@coastnights.demo`. Choose "I'm organizing" when signing in with that email.

## Try it

- **Buy a ticket:** sign in as the attendee, open Ed Sheeran, buy, pay, then tap the ticket in My Tickets.
- **See a failed payment:** pay with M-Pesa number `254700000000`, then tap Try again.
- **Approve something:** sign in as the admin and approve the pending organizer and event.
- **Start over:** use "Reset demo data" in the footer.

## Where things live

- `lib/store.ts`: the fake backend. Pages only call its functions, so a real API could replace it.
- `lib/seed.ts`: the data loaded on first visit.
- `lib/config.ts`: fee and commission numbers.
- `lib/site.ts`: student name and admission number, shown in the footer.
