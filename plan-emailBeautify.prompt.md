Project plan for email beautification

Goal:
- Beautify UD-DSSA outgoing emails by adding richer formatting, a header, and an unsubscribe button.
- Keep the existing email composer and sending logic while improving the sent email format.

Current system:
- Admin UI at `src/app/email/page.tsx` builds subject/body via manual input, AI polish, or AI draft.
- `src/lib/uddssaMailer.ts` generates the email body and appends a plain-text unsubscribe link.
- `src/app/api/email/send/route.ts` sends emails via Resend using `text` only.
- There is already a static HTML template file at `src/emails/udssa-recruitment-email.html`.
- Unsubscribe requests are handled through `src/app/api/unsubscribe/route.ts`.

What needs to change:
1. Add HTML email support in the send route.
   - Send both `text` and `html` payloads to Resend.
   - Preserve personalized body + unsubscribe link for text-only clients.
2. Create an HTML email renderer in `src/lib/uddssaMailer.ts`.
   - Render a beautiful header / banner.
   - Preserve paragraphs and CTA structure.
   - Render the unsubscribe action as a styled button.
3. Support list-specific unsubscribe URLs.
   - Use `emailType` to generate list-specific labels.
   - Example: `Unsubscribe from Newsletter`, `Unsubscribe from Events`, `Unsubscribe from Opportunities`.
4. Optionally use markdown-to-HTML conversion for body content.
   - Accept plain text or markdown in the composer.
   - Convert to safe HTML before sending.

Possible implementation approaches:
- Option A: Inline HTML builder
  - Build email HTML directly in `uddssaMailer.ts`.
  - Use inline CSS for compatibility.
  - Add a footer with a button and fallback plain-text link.
- Option B: Template-based HTML email
  - Reuse `src/emails/udssa-recruitment-email.html` as a template.
  - Inject subject/body/unsubscribe link into the template.
  - Easier to maintain with explicit HTML structure.
- Option C: Markdown -> HTML conversion
  - Generate markdown in the composer or AI draft.
  - Convert markdown to HTML in the send route.
  - Use a lightweight parser and include a styled unsubscribe button.

Unsubscribe button options:
- Simple HTML button via anchor with inline styles.
- Markdown link converted to styled HTML.
- List-specific unsubscribe URL to unsubscribe from a specific mailing list.
- Footer block with both button and plain link for maximum email-client reliability.

Next step:
- Implement HTML send support in `src/app/api/email/send/route.ts`.
- Add `html` creation helper in `src/lib/uddssaMailer.ts`.
- Update unsubscribe URL generation to include the chosen email list.
- Test by sending sample email to ensure both text and HTML render correctly.
