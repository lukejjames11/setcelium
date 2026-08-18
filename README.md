# Setcelium

A personal web app for logging concert history and mapping music discovery — how you found each artist, and how your musical taste connects back through people, shows, and other artists.

The name blends "music" with "mycelium" — the idea being that music connects the same way a fungal network does: an invisible web where every thread traces back to something else.

## What it does

**Concert history import** — Upload a Google Takeout `.mbox` export of your email, and Setcelium scans it for Ticketmaster order confirmations, extracts the artist, venue, date, and order number using the Claude API, and builds a concert log automatically. Low-confidence extractions are flagged for manual review rather than silently dropped or blindly trusted.

**Discovery graph** — An interactive, force-directed graph where each node is an artist you listen to. Edges connect artists to each other (or to a person who introduced you to them), each carrying a free-text "connector" (who or what bridged the discovery — a shared band member, a friend's recommendation, a show they opened for) and a short note telling the actual story. Artists can have a photo; nodes without one fall back to a solid color.

**Manual data entry** — Artists and connections can be added directly from the UI, no API calls required.

## Screenshots

*(add a screenshot of the graph view and the add-data panel here)*

## Tech stack

**Backend:** Java 25, Spring Boot 4.1, PostgreSQL, Spring Data JPA/Hibernate, Jakarta Mail (email parsing), Jsoup (HTML extraction), Claude API (Haiku) for structured data extraction from unstructured email content.

**Frontend:** React, TypeScript, Vite, `react-force-graph-2d` (Canvas-based graph rendering), Tailwind CSS.

## Architecture

The backend follows a layered architecture (controller → service → repository), documented in `docs/architecture.md`. A few decisions worth calling out:

- **Provider-agnostic parsing via a strategy pattern.** `EmailParser` is an interface; `TicketmasterParser` is the current implementation. Adding support for another ticketing provider means writing one new class, not modifying the import pipeline.
- **LLM-based extraction over hand-written regex.** Rather than parsing each provider's exact HTML structure by hand, confirmation emails are cleaned to plain text and passed to Claude with a prompt describing the fields to extract. This generalizes better across format variations than brittle regex, at the cost of a small per-email API call — kept cheap by filtering candidate emails down to real purchase confirmations (via sender + subject line) before any LLM call happens.
- **Adjacency-list graph storage in Postgres**, not a dedicated graph database. `Artist` and `DiscoveryEdge` (a typed edge table with `fromArtist`/`toArtist` foreign keys) represent the graph relationally. This was a deliberate choice for a personal project's data volume — full graph-database power (Neo4j, etc.) wasn't judged worth the added infrastructure.
- **DTOs separate "what was parsed" from "what's persisted."** `ParsedConcert` (raw LLM output, includes a confidence flag) is distinct from `Concert` (the actual database entity) — a parser's output is a *maybe*, an entity is a committed fact.

## Getting started

### Backend
```bash
cd setcelium
createdb setcelium
export ANTHROPIC_API_KEY=your-key-here
./mvnw spring-boot:run
```
Requires Java 25, Maven (or the bundled `./mvnw` wrapper), and a local PostgreSQL instance. Configure the connection in `src/main/resources/application.properties`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`, expects the backend on `http://localhost:8080`.

## API overview

| Endpoint | Purpose |
|---|---|
| `POST /api/import/mbox` | Upload a `.mbox` file to import concert history |
| `GET/POST/PUT/DELETE /api/concerts` | Concert CRUD |
| `GET/POST/PUT/DELETE /api/artists` | Artist CRUD |
| `GET/POST/DELETE /api/discovery-edges` | Discovery edge CRUD |
| `GET /api/graph` | Full graph, shaped for the frontend (`{nodes, links}`) |

## Design process

This project followed a design-first engineering process (Hybrid/Iterative-Incremental) — requirements docs, UML diagrams (use case, class, activity, sequence), and an architecture doc were written before implementation for each increment. Full docs live in `/docs`.

## Future work

- **Recursive graph traversal** — multi-hop queries ("show everything connected to X, however many hops away") via Postgres recursive CTEs. Not required for the current `/api/graph` endpoint, which returns the full graph at once.
- **Linking concerts to the discovery graph** — associating a `Concert` record with the `Artist` node it corresponds to, so the graph can show which branches of your taste you've experienced live.
- **Additional ticketing providers** (AXS, Eventbrite, StubHub) — the `EmailParser` interface already supports this without changing the import pipeline.
- **Live Gmail API sync**, replacing the manual `.mbox` export/upload flow.
- **Multi-user support** — linking other people's accounts to your discovery graph (the original "who introduced you to this artist" social feature), with proper auth.
- **Non-provider-specific email parsing** — a generic LLM-based classifier ("is this any kind of ticket confirmation, from any sender") rather than per-provider sender/subject filtering.
- **Frontend Design** - experimenting with frontend design options like Figma, tailwind, etc. 

## Acknowledgments

Built with guidance from Claude (Anthropic) as a design collaborator and teacher, following a deliberately hands-on approach — the author wrote the backend implementation code directly, with Claude providing architecture guidance, code review, frontend code, and debugging support rather than generating the app completely. 
