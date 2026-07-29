# Engineering Design Process — Setcelium

## Selected Process: Hybrid (Iterative and Incremental Development)

## Justification

Setcelium is a solo-developed Java/Spring Boot web app with no hard
external deadline, but with a core data structure (the music discovery
graph) whose shape matters a lot to get right before building on top of
it. A purely agile approach risks building the graph model wrong and
having to unwind it later, once concert logs, discovery edges, and UI
are all coupled to it. A purely waterfall approach isn't a good fit
either — this project has a lot of "we'll know it when we build it"
feature ideas (social linking, email import, eventually photos), and
locking every requirement upfront would either stall progress or
produce a spec that's wrong by week 2.

The plan: do real upfront design on the parts that are expensive to
change later (data model, core entity relationships, API shape), then
build iteratively — starting with concert history import, before the
discovery graph, before any social features.

## Increment Plan

1. Concert history import (email parsing → populate concert log) — build first
2. Concert log CRUD (manual add/edit, for shows email can't catch) — build second
3. Discovery graph (artists + typed edges between them) — build third
4. Link concerts to discovery graph nodes — build fourth
5. Later increments: auth/multi-user, social "introduced by" linking,
   (possibly, eventually) photo correlation

## Design Principles

- Single responsibility between layers: controller → service →
  repository, no business logic in controllers
- Favor Postgres recursive CTEs for graph traversal over a separate
  graph database, until/unless scale demands otherwise
- KISS on v1 — no auth, no multi-user, until the core graph model is
  proven out