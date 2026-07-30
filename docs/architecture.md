# Architecture — Setcelium

## Pattern: Layered Architecture (MVC-derived)

Setcelium follows a layered backend architecture rooted in the MVC
pattern, extended with an explicit service layer — the standard
convention for Spring Boot applications.

In v1, there is no View layer: the application is an API returning
data, not rendering pages. The Controller/Service/Repository split
below covers the Model and Controller responsibilities of MVC; a View
layer becomes literal (rather than implied/future) if and when a
frontend — server-rendered or a separate client — is added.

## Layers

**Controller**
- Receives HTTP requests, delegates to the service layer, returns
  responses
- Contains no business logic — validation of request shape only
- Example: `ImportController`

**Service**
- Owns business logic and orchestration
- Where rules like "flag if low confidence" and "skip if duplicate"
  live
- Coordinates between parsers and repositories, but does not itself
  parse or persist
- Example: `MboxImportService`

**Repository**
- Persistence only — no business logic
- Thin interfaces over the database (Spring Data JPA)
- Example: `ConcertRepository`

**Supporting interfaces**
- `EmailParser` is a strategy-pattern interface, implemented per
  provider (`TicketmasterParser` first). This is what satisfies
  NFR3 — a new provider requires a new implementation of this
  interface, not changes to `MboxImportService`.

## Design Principles

- Single responsibility per layer — a controller never touches a
  repository directly, a service never touches HTTP request/response
  objects
- Business logic lives in services, not controllers or entities
- KISS on v1 — no premature abstraction beyond what the parser
  interface requires; additional patterns get introduced only when a
  real second use case demands them (e.g. a second parser, a second
  storage backend)

## Relationship to Tupplur

Tupplur used MVVM, appropriate for a mobile app with a real view layer
and two-way data binding needs. Setcelium's backend-first structure
uses a layered/MVC-derived pattern instead, since the View doesn't
exist yet — the same underlying discipline (separation of concerns
between data, logic, and presentation) applied to a different kind of
application.