# 0012. Inngest background engine

**Date**: 2026-10-07
**Status**: Proposed

## Summary

This spec defines the Inngest background engine for Veni Pilot. Inngest handles async work: stale account cleanup (14 days unverified), verification reminders, bulk certificate batch processing (chunked), payment webhook reconciliation (idempotent on providerPaymentId), and subscription renewal cron. The HTTP endpoint is exposed at `/api/inngest`, dev server runs on port 8288, with exponential backoff retries (max 5) and function concurrency limits.

## Requirements

**User stories**:
- As a platform, I want unverified accounts cleaned up after 14 days so the database stays clean
- As a user, I want verification reminders before my account is deleted so I don't lose access
- As an organizer, I want certificate batches processed in the background so large generations don't time out
- As a platform, I want payment webhooks reconciled reliably so subscriptions activate correctly
- As a platform, I want subscriptions renewed automatically via cron so paid plans continue uninterrupted

**Acceptance criteria**:
- **AC-1**: Inngest dev server runs locally on port 8288, HTTP endpoint at `/api/inngest` responds
- **AC-2**: Stale account cleanup function runs daily, deletes users with emailVerified=false older than 14 days
- **AC-3**: Verification reminder function triggers at 7 days and 12 days after signup for unverified users
- **AC-4**: Certificate batch processing function handles chunked PDF generation, updates progress, stores ZIP in object storage
- **AC-5**: Payment webhook handler verifies Fapshi signature, updates Payment + Subscription, idempotent on providerPaymentId
- **AC-6**: Subscription renewal cron runs daily, processes PAST_DUE subscriptions, creates payment links for renewal
- **AC-7**: All functions have exponential backoff retries (max 5), dead letter after max retries
- **AC-8**: Function concurrency limits configured (cert batch: 5, webhooks: 10, others: default)

## Decision

**Chosen option**: Inngest with standard setup, 5 core functions, exponential backoff retries

**Implementation skills**: `inngest` (inngest/inngest, .agents/skills/inngest/) · `prisma` (prisma/prisma, .agents/skills/prisma/)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**:

Uses existing Prisma models:
- User (stale cleanup, verification reminders)
- Organization, Subscription, Payment (payment webhook, renewal)
- CertificateBatch, CertificateTemplate (cert batch processing)
- AuditEvent (logging function executions)

No new models needed. Inngest manages its own function state.

**State transitions**:

Stale Account: registered → (14 days) → deleted
Verification: unverified → (7 days) → reminder → (12 days) → reminder → (14 days) → deleted
CertificateBatch: PENDING → PROCESSING → COMPLETED | FAILED
Payment: PENDING → SUCCEEDED | FAILED (idempotent)
Subscription: TRIALING → ACTIVE → PAST_DUE → (renewal) → ACTIVE

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/inngest` | POST | Inngest payload | { success } | Inngest signing key | 401 invalid signature |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Stale account cutoff | deletedAt threshold | now() - 14 days |
| Verification reminder schedule | trigger times | User.createdAt + 7d, +12d |
| Cert batch chunk size | chunk size | config (e.g., 50 certs per chunk) |
| Webhook idempotency key | providerPaymentId | Fapshi webhook payload |
| Renewal payment link | Fapshi payment URL | Fapshi API response |

**Key invariants**:
- Stale cleanup only deletes emailVerified=false users
- Verification reminders only for unverified users
- Cert batch processing updates progress atomically
- Payment webhook idempotent on providerPaymentId unique constraint
- Subscription renewal only for PAST_DUE status

**Security model**:
- Inngest endpoint verified via signing key
- Functions run with service role (bypass RLS via Prisma middleware)
- Webhook signature verified before processing
- No user-facing auth needed (internal background jobs)

**Configuration required**:
- `INNGEST_EVENT_KEY`: for Inngest Cloud
- `INNGEST_SIGNING_KEY`: for webhook verification
- `INNGEST_DEV`: "1" for local dev server

## Critical test scenarios

- Happy path: Stale user deleted after 14 days, verifies AC-1, AC-2
- Happy path: Verification reminders sent at 7d and 12d, verifies AC-3
- Happy path: Cert batch 500 certs processed in chunks, ZIP stored, progress updated, verifies AC-4
- Happy path: Fapshi webhook received, Payment + Subscription updated, idempotent on retry, verifies AC-5
- Happy path: Renewal cron finds PAST_DUE org, creates payment link, verifies AC-6
- Failure case: Cert batch chunk fails, retries with backoff, partial results saved, verifies AC-7
- Failure case: Webhook duplicate ignored, verifies AC-5
- Failure case: Function exceeds max retries, dead letter logged, verifies AC-7

## Build plan

1. Install Inngest: `pnpm add inngest`, add dev server to docker-compose, satisfies AC-1
2. Create `/api/inngest/route.ts` with Inngest handler, signing key verification, satisfies AC-1
3. Create `lib/inngest/client.ts` for server-side function registration, satisfies AC-1
4. Implement stale account cleanup function (daily cron), satisfies AC-2
5. Implement verification reminder functions (7d and 12d delays), satisfies AC-3
6. Implement certificate batch processing function (chunked, progress updates, object storage), satisfies AC-4
7. Implement payment webhook reconciliation function (Fapshi signature, idempotent), satisfies AC-5
8. Implement subscription renewal cron (daily, PAST_DUE processing), satisfies AC-6
9. Configure retries, backoff, concurrency limits per function, satisfies AC-7, AC-8
10. Integration test: all functions register, dev server works, webhook verified, satisfies AC-1 through AC-8

## Consequences

**Positive**:
- Serverless background jobs without managing workers
- Automatic retries with exponential backoff
- Function versioning and observability in Inngest dashboard
- Type-safe function definitions with TypeScript
- Local dev server for testing

**Negative / tradeoffs**:
- Additional dependency (Inngest Cloud or self-hosted)
- Cold starts on serverless functions
- Function execution time limits (15 min on free tier)
- Debugging async flows more complex than sync code

**Neutral**:
- Inngest manages its own function state database
- Can migrate to self-hosted Inngest later if needed
- Works with existing Prisma models

## Follow-up

- [ ] Add `inngest` community skill conventions to AGENTS.md (project-wide)
- [ ] Design certificate batch chunking strategy (memory management)
- [ ] Design Fapshi webhook signature verification
- [ ] Add Inngest dashboard monitoring alerts
- [ ] Consider Neon Functions as alternative for some jobs (trigger on object upload)