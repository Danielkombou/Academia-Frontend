# 0009. Database schema and Prisma setup

**Date**: 2026-10-07
**Status**: In Progress

## Summary

This spec defines the relational database schema for the Veni Pilot using PostgreSQL and Prisma ORM. It models users, organizations, memberships, subscriptions, payments, certificate templates, batches, and certificates with PostgreSQL row-level security (RLS) enforcing organization isolation. The schema supports the Free Pilot (1 certificate preview only, no download) and paid Monthly/Yearly plans (batch generation with ZIP download). Migrations follow a Tracer Bullet approach: a thin thread (User + Organization + Membership) first, then billing, then certificates.

## Requirements

**User stories**:
- As a visitor, I can sign up and verify my email so that I can create an account
- As an organizer, I can create an organization and select a plan so that I can generate certificates
- As an organizer on Free Pilot, I can preview 1 certificate but not download it so that I can evaluate the product
- As an organizer on a paid plan, I can generate batches of certificates and download them as a ZIP
- As a platform admin, I can see audit events for security and billing reconciliation

**Acceptance criteria** (the contract):
- **AC-1**: User table stores identity (email, password hash, verification status) with unique email constraint
- **AC-2**: Organization table stores plan, subscription status, and certificate usage count for Free Pilot quota
- **AC-3**: Membership links users to organizations with role enum (Owner, Admin, Member, Event Manager, Staff, Speaker, Volunteer)
- **AC-4**: Subscription tracks plan, status (trialing, active, past_due, canceled), period dates, and Fapshi provider reference
- **AC-5**: Payment records every transaction with provider ID, amount (FCFA minor units), status, and purpose
- **AC-6**: CertificateTemplate belongs to an organization, stores rasterized dimensions and storage key
- **AC-7**: CertificateBatch tracks generation job (status, progress, template, settings, ZIP storage key)
- **AC-8**: Certificate represents one issued PDF per recipient with storage key and formatted name
- **AC-9**: AuditEvent captures important state changes (subscription, payment, batch, template) with metadata
- **AC-10**: PostgreSQL RLS policies enforce organization isolation on all org-scoped tables
- **AC-11**: Prisma schema in single file, generates types, migrations apply cleanly
- **AC-12**: Thin thread migration (User, Organization, Membership) applies first and works end to end

## Decision

**Chosen option**: Single schema.prisma with PostgreSQL RLS, thin thread migration first

**Implementation skills**: `prisma` (prisma/prisma, .agents/skills/prisma/) · `postgresql` (postgresql/postgresql, .agents/skills/postgresql/)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**:

```
User
  id UUID PK
  email String @unique
  emailVerified Boolean @default(false)
  passwordHash String
  name String?
  image String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  memberships Membership[]
  createdBatches CertificateBatch[]
  createdTemplates CertificateTemplate[]

Organization
  id UUID PK
  name String
  slug String @unique
  ownerId UUID FK → User
  plan Plan @default(FREE_PILOT)
  subscriptionStatus SubscriptionStatus @default(TRIALING)
  subscriptionEndsAt DateTime?
  certificatesUsed Int @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  memberships Membership[]
  templates CertificateTemplate[]
  batches CertificateBatch[]
  certificates Certificate[]
  subscriptions Subscription[]
  payments Payment[]
  auditEvents AuditEvent[]

Membership
  id UUID PK
  userId UUID FK → User
  organizationId UUID FK → Organization
  role Role @default(MEMBER)
  createdAt DateTime @default(now())
  @@unique([userId, organizationId])

Subscription
  id UUID PK
  organizationId UUID FK → Organization @unique
  plan Plan
  status SubscriptionStatus @default(TRIALING)
  provider Provider @default(FAPSHI)
  providerSubscriptionId String?
  currentPeriodStart DateTime
  currentPeriodEnd DateTime
  canceledAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  payments Payment[]

Payment
  id UUID PK
  organizationId UUID FK → Organization
  subscriptionId UUID FK → Subscription?
  provider Provider @default(FAPSHI)
  providerPaymentId String @unique
  amount Int  // FCFA minor units
  currency String @default("XAF")
  status PaymentStatus @default(PENDING)
  purpose PaymentPurpose
  metadata Json?
  createdAt DateTime @default(now())
  confirmedAt DateTime?

CertificateTemplate
  id UUID PK
  organizationId UUID FK → Organization
  name String
  fileName String
  mimeType String
  width Int
  height Int
  aspectRatio Float
  storageKey String
  createdById UUID FK → User
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  batches CertificateBatch[]

CertificateBatch
  id UUID PK
  organizationId UUID FK → Organization
  templateId UUID FK → CertificateTemplate
  nameColumn String
  fullNameParts Int
  fontSize Int
  fontColor String
  positionY Float
  status BatchStatus @default(PENDING)
  totalRecipients Int
  completedCount Int @default(0)
  zipStorageKey String?
  errorMessage String?
  createdById UUID FK → User
  createdAt DateTime @default(now())
  startedAt DateTime?
  completedAt DateTime?
  certificates Certificate[]

Certificate
  id UUID PK
  batchId UUID FK → CertificateBatch
  organizationId UUID FK → Organization  // denormalized for RLS
  recipientName String
  recipientNameRaw String
  pdfStorageKey String
  status CertificateStatus @default(PENDING)
  createdAt DateTime @default(now())

AuditEvent
  id UUID PK
  organizationId UUID FK → Organization?
  userId UUID FK → User?
  action String
  targetType String
  targetId UUID
  metadata Json?
  createdAt DateTime @default(now())

Enums:
  Plan: FREE_PILOT, MONTHLY, YEARLY
  SubscriptionStatus: TRIALING, ACTIVE, PAST_DUE, CANCELED
  Provider: FAPSHI, MANUAL
  PaymentStatus: PENDING, SUCCEEDED, FAILED, REFUNDED
  PaymentPurpose: SUBSCRIPTION, RENEWAL, ONE_TIME
  Role: OWNER, ADMIN, MEMBER, EVENT_MANAGER, STAFF, SPEAKER, VOLUNTEER
  BatchStatus: PENDING, PROCESSING, COMPLETED, FAILED
  CertificateStatus: PENDING, GENERATED, FAILED
```

**State transitions**:

Subscription: TRIALING → ACTIVE → PAST_DUE → CANCELED (explicit renewal moves PAST_DUE → ACTIVE)
CertificateBatch: PENDING → PROCESSING → COMPLETED | FAILED
Certificate: PENDING → GENERATED | FAILED
Payment: PENDING → SUCCEEDED | FAILED | REFUNDED

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| (Prisma Client) | N/A | N/A | typed models | bearer (via Better Auth) | P2003 FK violation, P2002 unique violation |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Create organization | slug | generated from name + nanoid suffix |
| Create subscription | currentPeriodEnd | now() + 1 month or 1 year per plan |
| Increment certificate usage | certificatesUsed | Organization.certificatesUsed + batch.totalRecipients |
| Check Free Pilot quota | canGenerate | Organization.plan == FREE_PILOT && certificatesUsed < 1 |
| RLS filter | orgId | Better Auth session → organizationId claim |
| Payment amount | amount (minor units) | Plan price config (env var) |
| Audit action | action string | hardcoded per mutation (e.g. "subscription.created") |

**Key invariants**:
- Email unique per User
- Organization slug unique
- One Membership per user per organization
- One Subscription per organization
- Payment.providerPaymentId unique
- Certificate.organizationId matches CertificateBatch.organizationId (denormalized for RLS)
- certificatesUsed only increments on paid plans or when Free Pilot generates its 1 cert

**Security model**:
- Users own their identity (User table)
- Organizations own paid activity (templates, batches, certificates, subscriptions, payments)
- Membership.role determines permissions within organization
- Platform Admin (not in org) has global access via separate mechanism
- RLS policies: every org-scoped table has policy `USING (organization_id = current_setting('app.current_org_id')::uuid)`
- Application sets `app.current_org_id` via Prisma middleware on each request
- Free Pilot: organization.plan = FREE_PILOT, certificatesUsed < 1, no batch, no download
- Paid plans: organization.plan in (MONTHLY, YEARLY), subscriptionStatus = ACTIVE, batch generation allowed

**Configuration required**:
- `DATABASE_URL`: PostgreSQL connection string
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`: Cloudflare R2 credentials
- `FAPSHI_API_URL`, `FAPSHI_API_USER`, `FAPSHI_API_KEY`: Fapshi sandbox/live config

## Critical test scenarios

- Happy path: Sign up → verify email → create org → select Free Pilot → preview 1 cert → verify no download, verifies AC-1, AC-2, AC-6, AC-7, AC-8
- Happy path: Paid org → create batch → Inngest processes → ZIP in R2 → download, verifies AC-2, AC-4, AC-5, AC-7, AC-8
- Failure case: Free Pilot tries second cert → blocked by quota check, verifies AC-2, AC-10
- Failure case: Payment webhook duplicate → idempotent on providerPaymentId, verifies AC-5
- Auth/permission: User not in org tries to read template → RLS denies, verifies AC-3, AC-10
- Auth/permission: Member (not Owner) tries to change plan → denied by app layer, verifies AC-3
- Edge case: Soft delete user → memberships preserved, batches/templates retain createdById, verifies AC-1, AC-6, AC-7
- Edge case: Organization deleted → cascade deletes templates, batches, certificates, subscriptions, payments, verifies AC-2, AC-6, AC-7, AC-8, AC-4, AC-5

## Build plan

1. Create Prisma schema with User, Organization, Membership, enums; add RLS setup SQL; run first migration (thin thread), satisfies AC-1, AC-2, AC-3, AC-10, AC-11, AC-12
2. Add Subscription, Payment, AuditEvent; run migration; add RLS policies for billing tables, satisfies AC-4, AC-5, AC-9, AC-10
3. Add CertificateTemplate, CertificateBatch, Certificate; run migration; add RLS policies for certificate tables, satisfies AC-6, AC-7, AC-8, AC-10
4. Configure Prisma Client with middleware to set `app.current_org_id` from Better Auth session, satisfies AC-10
5. Seed script for Plan prices (FCFA), Role enum defaults, satisfies AC-2, AC-3
6. Integration test: RLS blocks cross-org access, Free Pilot quota enforced, subscription state machine works, satisfies AC-2, AC-3, AC-4, AC-10

## Consequences

**Positive**:
- Strong organization isolation at database level (cannot be bypassed)
- Single source of truth for entitlements via Subscription + Organization.certificatesUsed
- Audit trail for compliance and debugging
- Tracer Bullet migration proves auth/org foundation early
- Cloudflare R2 for object storage: zero egress, S3-compatible

**Negative / tradeoffs**:
- RLS requires raw SQL for policy creation (Prisma doesn't manage RLS)
- Application must reliably set `app.current_org_id` on every request
- Denormalized organizationId on Certificate duplicates data for RLS efficiency
- Free Pilot quota logic lives in application (could race without DB constraint)

**Neutral**:
- Prisma middleware adds slight overhead per query
- Enum-based roles simple now; migration to Role table later if needed
- Explicit renewal (no auto-recurring) simplifies Fapshi integration

## Follow-up

- [ ] Add `prisma` community skill conventions to AGENTS.md (project-wide)
- [ ] Add `postgresql` community skill conventions to AGENTS.md (project-wide)
- [ ] Design CertificateBatch processing Inngest function (separate spec)
- [ ] Design Fapshi webhook reconciliation Inngest function (separate spec)
- [ ] Design subscription renewal cron Inngest function (separate spec)