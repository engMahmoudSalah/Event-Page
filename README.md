# Event Page

Event landing page with a ticket registry, live attendee counter and ticket lookup.

**Live:** https://event-page.mahmodsalah.workers.dev

## Features

- Event schedule, speakers and registration flow
- Ticket registry backed by a Cloudflare Workers API: duplicate registrations are blocked by an email hash and holder names are masked
- Live attendee counter
- Ticket lookup by ID

## Tech stack

React, TypeScript, Vite, Tailwind CSS

## Hosting

Cloudflare Workers (static assets) + Workers/KV API. No paid services.

## Run locally

```bash
npm install
npm run dev
```

Build with `npm run build`, type-check with `npx tsc --noEmit`.

## Notes

src/registry.ts and src/components/TicketCheck.tsx hold the registry client.

## Author

Mahmoud Salah, https://github.com/engMahmoudSalah
