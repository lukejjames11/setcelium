# Requirements — Concert History Import (v1)

## Scope
This document covers the first build increment: importing historical
concert attendance from a user-uploaded email export, parsing
Ticketmaster confirmation emails, and populating the concert log.
Gmail API live sync and non-Ticketmaster providers are explicitly
out of scope for this increment (see Future Work).

## Functional Requirements

FR1. The system shall accept a user-uploaded `.mbox` file containing
     exported email history.

FR2. The system shall scan the uploaded file and identify messages
     that appear to be Ticketmaster order confirmation emails.

FR3. For each identified Ticketmaster confirmation, the system shall
     attempt to extract:
     - Artist/event name
     - Venue
     - Show date
     - Order/confirmation number (for dedup, not display)

FR4. The system shall create one `concert` record per successfully
     parsed confirmation email, with `source = "ticketmaster_import"`.

FR5. If required fields (artist, venue, date) cannot be confidently
     extracted, the system shall still create a record but flag it
     `needs_review = true` rather than silently dropping it.

FR6. The system shall detect and skip duplicate imports (same order/
     confirmation number already present in the concert log).

FR7. The system shall present the user with a summary after import:
     count of concerts successfully added, count flagged for review,
     count skipped as duplicates.

FR8. The user shall be able to manually edit or delete any
     auto-imported concert record.

## Non-Functional Requirements

NFR1. Parsing shall not silently fail — every message identified as
      a possible confirmation email must produce either a record or
      a logged reason it was skipped (e.g. "not a purchase
      confirmation," "cancelled order").

NFR2. Import of a typical personal mailbox export (assume up to
      ~5,000 messages) shall complete in under 2 minutes.

NFR3. The parser shall be structured so that adding a new provider
      (e.g. AXS) requires implementing one new parser module, not
      modifying shared import logic.

NFR4. No email content beyond what's needed for the four extracted
      fields (FR3) shall be persisted — the raw email body is
      discarded after parsing, not stored.

## Out of Scope / Future Work

- Live Gmail API sync (replaces manual `.mbox` upload)
- Additional ticketing providers (AXS, Eventbrite, StubHub, etc.)
- LLM-based fallback parser for unrecognized email formats
- Photo-based concert detection