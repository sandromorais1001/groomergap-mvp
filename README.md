# GroomerGap MVP

A focused cancellation-recovery tool for solo and small mobile dog grooming businesses in the United States.

## What it does

1. The groomer enters the cancelled slot's date, time, ZIP Code, approximate value, and optional duration.
2. The app ranks client/pet candidates using visible reasons: same ZIP, waitlist, overdue return, no future appointment, an appointment that could move up, similar value, and useful flexibility notes.
3. The groomer copies a personalized English message and records Declined, No Reply, or Filled.
4. The dashboard summarizes recorded cancellations, filled openings, fill rate, recovered value, ZIP activity, and attempt history.

All included names and phone numbers are fictitious. Operational MVP data stays in browser storage on the current device. Account access and the 24-hour trial are controlled by Supabase using server time. ZIP is only a proximity signal; the groomer must verify real drive time.

## 24-hour trial setup

1. Create a Supabase project and run `supabase/schema.sql` once in its SQL Editor.
2. Add the project URL and public anon key to `config.js` (see `config.example.js`).
3. Use email/password authentication. For individual invitation-only access, disable public sign-ups after creating or inviting approved testers.

The trial starts inside the database on the first successful authenticated access. Clearing browser data, logging out, changing the device clock, or signing in again does not change the recorded expiry.

To activate a paid Early Access customer manually, run the activation query included at the bottom of `supabase/schema.sql`, replacing the example email.

## Intentionally outside this MVP

- automatic SMS, email, or WhatsApp sending
- cloud sync of operational client data and cross-device backup
- scheduling, payments, invoicing, and customer CRM
- map distance, route optimization, or travel-time calculations
- integrations with MoeGo, Furbello, Arrively, calendars, or contacts
- automated revenue claims or guarantees
- imports from CSV/Excel and exports

## Validation note

This version is designed for moderated testing with a small group of U.S. mobile groomers. The next product decision should be based on observed use: time to first candidate, whether the visible reasons build trust, and whether users contact a suggested client.
