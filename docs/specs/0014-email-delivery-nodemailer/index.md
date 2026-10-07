# 0014. Email delivery with Nodemailer

**Date**: 2026-10-07
**Status**: Accepted

## Summary

This spec defines the email delivery system for Veni Pilot using Nodemailer. It configures Mailpit for local development (SMTP on port 1025, web UI on 8025), wires into Better Auth for verification emails and password reset emails, and provides a service for Inngest functions to send transactional emails (receipts, batch ready alerts). Production SMTP configuration is documented for deployment.

## Requirements

**User stories**:
- As a new user, I want to receive a verification email after signing up so I can verify my account
- As a user who forgot my password, I want to receive a reset email so I can regain access
- As an organizer, I want to receive a receipt when payment succeeds so I have a record
- As an organizer, I want to receive an alert when my certificate batch is ready so I can download it

**Acceptance criteria**:
- **AC-1**: Verification email sent on sign up via Better Auth, contains working verification link
- **AC-2**: Password reset email sent on request, contains working reset link with expiry
- **AC-3**: Mailpit UI accessible at localhost:8025 shows sent emails in local development
- **AC-4**: Inngest functions can send transactional emails (receipts, batch ready alerts)
- **AC-5**: Production SMTP configuration documented (host, port, credentials, from address)
- **AC-6**: Email templates use Veni branding (green primary, consistent styling)
- **AC-7**: Emails sent via Nodemailer with proper error handling and logging

## Decision

**Chosen option**: Nodemailer with Mailpit for local, production SMTP for deployed

**Implementation skills**: `nodemailer` (nodemailer/nodemailer, .agents/skills/nodemailer/) · `better-auth` (better-auth/better-auth, .agents/skills/better-auth/)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**:

Uses existing Prisma models:
- User (email, emailVerified for verification flow)
- AuditEvent (logging email sends for audit trail)

No new models needed. Email state managed by Better Auth (verification tokens) and Inngest (transactional sends).

**State transitions**:

Verification: unverified → (email sent) → verified
Password reset: requested → (email sent) → reset → completed

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Better Auth handles auth emails | POST | email, type | verification sent | none | 400 invalid email |
| Inngest transactional emails | event | template, data | email sent | internal | 500 send failed |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Verification link | URL with token | Better Auth generates token, app URL from env |
| Reset link | URL with token | Better Auth generates token, app URL from env |
| From address | "Veni <noreply@veni.app>" | SMTP_FROM env var |
| SMTP config | host, port, credentials | SMTP_* env vars |

**Key invariants**:
- Verification emails only sent to unverified users
- Reset tokens single-use, expire in 1 hour
- Verification tokens expire in 24 hours
- All emails include unsubscribe link (future)
- AuditEvent logged for each email sent

**Security model**:
- SMTP credentials only in environment variables
- Email content sanitized to prevent injection
- Rate limiting on auth email endpoints (handled by Arcjet)
- Tokens cryptographically secure (Better Auth handles)

**Configuration required**:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- Mailpit: `SMTP_HOST=localhost`, `SMTP_PORT=1025`, `SMTP_SECURE=false`
- Production: real SMTP credentials

## Critical test scenarios

- Happy path: Sign up → verification email in Mailpit → click link → verified, verifies AC-1, AC-3
- Happy path: Forgot password → reset email in Mailpit → click link → set new password, verifies AC-2, AC-3
- Happy path: Payment succeeds → Inngest sends receipt email, verifies AC-4
- Happy path: Batch ready → Inngest sends alert email, verifies AC-4
- Failure: Invalid SMTP config → graceful error, logged, verifies AC-7
- Production: Real SMTP credentials work, verifies AC-5

## Build plan

1. Verify Nodemailer already installed (already in package.json), Mailpit in docker-compose, satisfies AC-3
2. Create email service (`lib/email.ts`) with Nodemailer transporter and template functions, satisfies AC-1, AC-2, AC-4, AC-6
3. Wire into Better Auth `sendVerificationEmail` and `sendResetPasswordEmail`, satisfies AC-1, AC-2
4. Create Inngest email helper for transactional sends, satisfies AC-4
3. Add email logging to AuditEvent, satisfies AC-7
4. Document production SMTP config in .env.example, satisfies AC-5
5. Integration test: sign up → verify email in Mailpit → reset password → Inngest sends transactional, verifies AC-1 through AC-7

## Consequences

**Positive**:
- Mailpit provides excellent local dev experience with web UI
- Nodemailer is battle-tested, supports all SMTP providers
- Better Auth integration handles token generation and verification flow
- Inngest integration enables reliable transactional emails with retries

**Negative / tradeoffs**:
- Two email pathways (Better Auth for auth, Inngest for transactional)
- Production SMTP credentials must be managed securely
- Template maintenance across two systems

**Neutral**:
- Mailpit only for local dev, not production
- Can swap SMTP provider without code changes

## Follow-up

- [ ] Add `nodemailer` community skill conventions to AGENTS.md (project-wide)
- [ ] Add email templates for receipts, batch alerts, welcome emails
- [ ] Add unsubscribe mechanism and preference center
- [ ] Consider email analytics (open rates, click tracking)
- [ ] Add email queue monitoring in Inngest dashboard