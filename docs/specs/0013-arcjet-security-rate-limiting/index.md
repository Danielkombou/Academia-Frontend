# 0013. Arcjet security and rate limiting

**Date**: 2026-10-07
**Status**: In Progress

## Summary

This spec defines the Arcjet integration for Veni Pilot. Arcjet provides two layers of protection: global Shield for bot detection and attack protection (SQLi, XSS), plus token-bucket rate limiting on certificate generation actions keyed by organization entitlement. The integration follows Arcjet's Next.js App Router patterns with middleware and server action protection.

## Requirements

**User stories**:
- As a platform, I want global bot detection so scrapers and automated attacks are blocked
- As a platform, I want attack protection so SQLi and XSS attempts are stopped before reaching application code
- As an organizer, I want rate limits that respect my plan so Free Pilot users get stricter limits than paid plans
- As a platform, I want clear error messages when rate limited so users understand why they're blocked

**Acceptance criteria**:
- **AC-1**: Arcjet Shield middleware active on all routes, blocks known bad bots and attack patterns
- **AC-2**: Token-bucket rate limiter on certificate generation Server Actions, keyed by organization ID
- **AC-3**: Free Pilot: 10 requests/minute, burst 20; Monthly: 100 requests/minute, burst 200; Yearly: 500 requests/minute, burst 1000
- **AC-4**: Rate limit exceeded returns 429 with clear message showing limit and reset time
- **AC-5**: Arcjet decision logging for audit trail (blocked requests, rate limited requests)
- **AC-6**: Integration works in local dev (with Arcjet dev mode) and production

## Decision

**Chosen option**: Arcjet with Next.js middleware + Server Action protection

**Implementation skills**: `arcjet` (arcjet/arcjet, .agents/skills/arcjet/) · `nextjs` (vercel/next.js, .agents/skills/nextjs/)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**:

Uses existing Prisma models:
- Organization (plan, subscriptionStatus for entitlement)
- AuditEvent (logging Arcjet decisions)

No new models needed. Rate limit state managed by Arcjet.

**State transitions**:

Rate limit: allowed → (bucket empty) → rate limited → (refill) → allowed

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Server Actions (cert generation) | POST | batch data | { success, batchId } | bearer (org member) | 429 rate limited |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Rate limit decision | allowed/denied | Arcjet token bucket state |
| Refill rate | requests/minute | Organization.plan config |
| Burst capacity | max burst | Organization.plan config |
| Block reason | string | Arcjet decision.reason |
| Reset time | timestamp | Arcjet decision.reset |

**Key invariants**:
- Free Pilot: 10 req/min, burst 20
- Monthly: 100 req/min, burst 200
- Yearly: 500 req/min, burst 1000
- Shield always active regardless of plan
- Rate limit keyed by organizationId from session

**Security model**:
- Arcjet Shield runs in middleware before app code
- Rate limiting runs in Server Actions before business logic
- Decision logged to AuditEvent for security audit trail
- No sensitive data sent to Arcjet (only IP, headers, orgId)

**Configuration required**:
- `ARCJET_KEY`: Arcjet API key (dev and prod)
- `ARCJET_ENV`: "development" or "production"

## Critical test scenarios

- Happy path: Free Pilot org makes 5 cert generations → all allowed, verifies AC-3
- Happy path: Free Pilot org makes 15 cert generations → first 10 allowed, next 5 rate limited, verifies AC-3, AC-4
- Happy path: Yearly org makes 600 cert generations → all allowed within burst, verifies AC-3
- Attack: SQLi attempt in request → blocked by Shield, logged, verifies AC-1
- Bot: Known scraper User-Agent → blocked by Shield, verifies AC-1
- Rate limit error: 429 response includes limit, remaining, reset time, verifies AC-4

## Build plan

1. Install Arcjet: `pnpm add @arcjet/next`, satisfies AC-1
2. Create Arcjet client config (`lib/arcjet.ts`) with Shield + bot detection, satisfies AC-1
3. Create certificate generation rate limiter (`lib/arcjet/cert-generation.ts`) with token bucket per plan, satisfies AC-2, AC-3
4. Add Arcjet middleware to `middleware.ts` (or `proxy.ts` per Next.js 16), satisfies AC-1
5. Protect certificate generation Server Action with rate limiter, satisfies AC-2, AC-3
6. Add Arcjet decision logging to AuditEvent, satisfies AC-5
7. Configure Arcjet dev mode for local testing, satisfies AC-6
8. Integration test: Shield blocks bot, rate limiter enforces per-plan limits, verifies AC-1 through AC-6

## Consequences

**Positive**:
- Battle-tested security (Shield) without managing WAF
- Token bucket rate limiting with automatic refill
- Per-plan limits via dynamic characteristics
- Clear 429 responses with retry-after headers
- Local dev mode for testing without API calls

**Negative / tradeoffs**:
- Additional dependency (Arcjet Cloud)
- Rate limit state external to app (Arcjet manages it)
- Requires Arcjet API key for production
- Cold start on first request to middleware

**Neutral**:
- Can tune limits per plan without code changes
- Arcjet dashboard provides observability
- Works with existing Better Auth session

## Follow-up

- [ ] Add `arcjet` community skill conventions to AGENTS.md (project-wide)
- [ ] Add rate limiting to other sensitive actions (payment, auth)
- [ ] Configure Arcjet dashboard alerts for attack spikes
- [ ] Add rate limit headers to API responses for client-side handling