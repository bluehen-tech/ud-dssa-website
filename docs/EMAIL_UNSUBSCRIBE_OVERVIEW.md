# Email Template & Unsubscribe Overview

## Purpose
This document summarizes the current email HTML and unsubscribe behavior implemented in the UD-DSSA app. It is written for a manager-like audience and explains how the email content and unsubscribe flow currently work.

## HTML Email

### What is included
- The email is generated from a reusable HTML template located at `src/emails/udssa-recruitment-email.html`.
- The template renders:
  - a branded sender label (e.g. `DSSA Newsletter`, `DSSA Events`)
  - the chosen subject line
  - the email body content with paragraph formatting
  - a call-to-action block when the body contains a URL
  - a visible unsubscribe button and fallback unsubscribe link

### Why this matters
- The HTML template makes outgoing emails look consistent and polished.
- The design is separate from the sender logic, so content teams can update the template without changing the email send code.
- The email still includes a plain-text fallback, which ensures deliverability for clients that do not display HTML.

## Unsubscribe Button and Flow

### What happens when a recipient clicks unsubscribe
- The button links to the app's `/unsubscribe` page with the recipient's email and the specific message list type.
- That page shows confirmation text and then posts the unsubscribe request to the app backend.

### What the unsubscribe API does now
- It stores unsubscribe preferences in the existing `contacts` record.
- The contact record is updated with:
  - `status = 'unsubscribed'` only when the request is a global unsubscribe (`all`)
  - `source_metadata.unsubscribed_lists` to record a list-specific unsubscribe, e.g. `newsletter`, `event`, `opportunity`, or `announcement`
- It also records `last_unsubscribed_at` and the source of the unsubscribe.

### How suppression is checked before sending
Before sending an email, the app checks each recipient against the `contacts` table and suppresses sending if:
- `status === 'unsubscribed'` (global unsubscribe), or
- `source_metadata.unsubscribed_lists` contains `all`, or
- `source_metadata.unsubscribed_lists` contains the current list type.

This means:
- full unsubscribes block all future messages
- list-specific unsubscribes block only that list
- other lists can still be sent if not unsubscribed from them

## What this means for the product
- Recipients can safely opt out using the unsubscribe button.
- Unsubscribe preferences are enforced in the app, not just in email client UI.
- The system supports both global and list-specific unsubscribe behavior.
- The contact suppression logic is centralized in server-side send code and uses the existing `contacts` data model.

## Notes for managers
- No separate suppression table was added; suppression is stored inside the current contact record.
- The implementation is intentionally conservative: if a contact is marked globally unsubscribed, they will not receive any further emails.
- If needed, the app can later expose a small admin tool or dashboard to view and modify `source_metadata.unsubscribed_lists`.

## Files involved
- `src/emails/udssa-recruitment-email.html`
- `src/lib/uddssaMailer.ts`
- `src/app/api/email/send/route.ts`
- `src/app/api/unsubscribe/route.ts`
- `src/app/unsubscribe/page.tsx`
