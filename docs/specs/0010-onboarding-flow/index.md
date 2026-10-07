# 0010. Onboarding flow

**Date**: 2026-10-07
**Status**: Proposed

## Summary

This spec defines the multi-step onboarding flow for Veni Pilot. After sign up and email verification, users sign in and hit an onboarding gate in Next.js proxy.ts. Every user is an organizer. The flow uses a shadcn Questionnaire component for a single-question-per-screen experience with progress tracking: Source → Profile → Organization Setup → Plan Selection. Free Pilot activates instantly. Paid plans redirect to Fapshi for payment, then return to complete activation. The UI uses Framer Motion transitions, auto-saves to localStorage for resume, and follows progressive onboarding best practices.

## Requirements

**User stories**:
- As a new organizer, I want to complete onboarding in one sitting so I can start generating certificates
- As an organizer, I want to create my organization and select a plan during onboarding so I can generate certificates immediately
- As a user on a paid plan, I want a smooth payment flow that returns me to an activated dashboard
- As a returning organizer who dropped off mid-onboarding, I want to resume where I left off

**Acceptance criteria**:
- **AC-1**: proxy.ts redirects authenticated users with incomplete onboarding to `/onboarding`
- **AC-2**: Onboarding renders as multi-step Questionnaire with progress bar, step counter, and Framer Motion transitions
- **AC-3**: Step 1 (Source) captures attribution: select from Search, Referral, Social, Event, Other + custom input
- **AC-4**: Step 2 (Profile) shows prefilled name from OAuth/DB (editable), optional role text, optional phone tel input
- **AC-5**: Step 3 (Organization Setup) collects orgName (required), orgSlug (auto from name, editable, unique), orgWebsite (optional URL), orgSize (select); creates Organization + Membership(OWNER)
- **AC-6**: Step 4 (Plan Selection) shows three cards: Free Pilot (1 cert preview, no download), Monthly, Yearly — with feature comparison
- **AC-7**: Free Pilot selection → instant activation (subscriptionStatus=TRIALING, plan=FREE_PILOT) → redirect to dashboard with success toast
- **AC-8**: Paid plan selection → Server Action creates Fapshi payment link → redirect to Fapshi → webhook confirms → subscription ACTIVE → redirect to `/onboarding/complete` → dashboard
- **AC-9**: Onboarding progress auto-saved to localStorage per step; resume on return
- **AC-10**: Back button works between steps; Skip button on optional fields (role, phone, website)
- **AC-11**: Server-side validation on each step via Server Actions; errors shown inline
- **AC-12**: Duplicate orgSlug handled with inline error and suggestion
- **AC-13**: Payment timeout/failure shows retry option; network errors handled gracefully

## Decision

**Chosen option**: shadcn Questionnaire with linear steps (no branching), proxy.ts gate, Fapshi redirect payment

**Implementation skills**: `shadcn` (shadcn/ui, .agents/skills/shadcn/) · `nextjs` (vercel/next.js, .agents/skills/nextjs/) · `better-auth` (better-auth/better-auth, .agents/skills/better-auth/) · `fapshi` (fapshi/fapshi, .agents/skills/fapshi/)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**:

```
User (extends Better Auth user)
  id UUID PK
  email String @unique
  emailVerified Boolean
  name String?
  image String?
  role String?           // job title/role from onboarding
  phone String?         // optional phone
  source String?        // attribution from onboarding
  onboardingStep Int @default(0)  // 0=not started, 1=source, 2=profile, 3=org, 4=plan, 5=complete
  onboardingCompleted Boolean @default(false)
  onboardingData Json?  // cached form data for resume
  createdAt DateTime
  updatedAt DateTime
  deletedAt DateTime?

Organization (created during onboarding)
  id UUID PK
  name String
  slug String @unique
  ownerId UUID FK → User
  plan Plan @default(FREE_PILOT)
  subscriptionStatus SubscriptionStatus @default(TRIALING)
  subscriptionEndsAt DateTime?
  certificatesUsed Int @default(0)
  website String?
  size OrgSize?
  createdAt DateTime
  updatedAt DateTime

Enums added:
  OrgSize: SIZE_1_10, SIZE_11_50, SIZE_51_200, SIZE_200_PLUS
```

**State transitions**:

User.onboardingStep: 0 → 1 → 2 → 3 → 4 → 5 (complete)
Organization: created → plan=FREE_PILOT/TRIALING → (payment) → ACTIVE

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/onboarding/step` | POST | step: int, data: JSON | { success, nextStep, redirectUrl? } | bearer | 400 validation, 409 duplicate slug |
| `/api/onboarding/resume` | GET | — | { step, data } | bearer | 401 |
| `/api/onboarding/complete` | POST | — | { redirectUrl } | bearer | 400 incomplete |
| `/api/billing/create-payment-link` | POST | plan: MONTHLY\|YEARLY, organizationId | { paymentUrl } | bearer (owner/admin) | 402 payment required, 409 |
| `/api/webhooks/fapshi` | POST | Fapshi payload | { received: true } | Fapshi signature | 400 invalid signature |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Prefill name | name | Better Auth user.name or OAuth profile |
| Prefill email | email | Better Auth session (read-only) |
| Org slug suggestion | slug | slugify(orgName) + nanoid(4) |
| Plan prices | amount, currency | ENV vars: `FREE_PILOT_PRICE=0`, `MONTHLY_PRICE_XAF`, `YEARLY_PRICE_XAF` |
| Fapshi payment URL | paymentUrl | Fapshi API response |
| Subscription activation | subscriptionStatus | Fapshi webhook verified → Server Action |
| Redirect after payment | redirectUrl | `/onboarding/complete?success=true` |
| Dashboard route | redirectUrl | `/dashboard` |

**Key invariants**:
- onboardingStep only increments forward (never decrements server-side)
- onboardingCompleted = true only after step 5
- orgSlug unique across all organizations
- Only organization owner can create payment link
- Free Pilot: certificatesUsed < 1, no batch generation, no download
- Payment link single-use; webhook idempotent on providerPaymentId

**Security model**:
- proxy.ts checks: session exists → emailVerified → onboardingCompleted
- Unverified email → redirect to `/verify-email` with next=/onboarding
- No session → redirect to `/signin` with next=/onboarding
- Onboarding steps validate ownership: user can only modify own onboardingData
- Organization creation: user becomes owner (role=OWNER)
- Payment webhook: verify Fapshi signature before processing

**Configuration required**:
- `NEXT_PUBLIC_APP_URL`: base URL for redirects
- `FAPSHI_API_URL`, `FAPSHI_API_USER`, `FAPSHI_API_KEY`: Fapshi credentials
- `MONTHLY_PRICE_XAF`, `YEARLY_PRICE_XAF`: plan prices in FCFA minor units
- `FAPSHI_WEBHOOK_SECRET`: webhook signature verification

## Critical test scenarios

- Happy path Free Pilot: Sign up → verify → sign in → proxy redirects → Source → Profile → Org Setup → Plan=Free Pilot → instant activation → dashboard, verifies AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-11
- Happy path Monthly: Organizer → Plan=Monthly → Fapshi redirect → webhook → complete → dashboard, verifies AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-8, AC-11
- Happy path Yearly: Organizer → Plan=Yearly → Fapshi redirect → webhook → complete → dashboard, verifies AC-8
- Resume: User closes tab at step 2 → returns → localStorage restores step 2 data, verifies AC-9
- Back navigation: User goes step 3 → back to step 2 → data preserved, verifies AC-10
- Duplicate slug: Two users create same orgName → second gets inline error with suggestion, verifies AC-12
- Payment failure: Fapshi returns failed → user sees retry button on `/onboarding/complete?error=payment_failed`, verifies AC-13
- Auth gate: Unverified user tries `/onboarding` → redirect to `/verify-email`, verifies AC-1
- Auth gate: No session user tries `/onboarding` → redirect to `/signin`, verifies AC-1

## Build plan

1. Add onboarding fields to User model (onboardingStep, onboardingCompleted, onboardingData, source, role, phone); run migration, satisfies AC-1, AC-9
2. Create proxy.ts onboarding gate: check session → emailVerified → onboardingCompleted; redirect to `/onboarding` with next param, satisfies AC-1
3. Build `/onboarding` page with shadcn Questionnaire: progress bar, step counter, Framer Motion transitions, localStorage auto-save, satisfies AC-2, AC-9, AC-10
4. Implement Step 1 (Source): Select + custom input, Server Action validation, satisfies AC-3
5. Implement Step 2 (Profile): Prefilled name, optional role/phone, Server Action, satisfies AC-4
6. Implement Step 3 (Org Setup): orgName, orgSlug (unique check), orgWebsite, orgSize; creates Organization + Membership(OWNER), satisfies AC-5
7. Implement Step 4 (Plan Selection): Three card grid with feature comparison, Free Pilot instant activation, Paid → create payment link, satisfies AC-6, AC-7, AC-8
8. Build `/api/billing/create-payment-link` Server Action: creates Fapshi payment link, returns URL, satisfies AC-8
9. Build Fapshi webhook handler: verifies signature, updates Subscription + Organization, idempotent on providerPaymentId, satisfies AC-8
10. Build `/onboarding/complete` page: handles payment success/failure, redirects to dashboard, satisfies AC-8, AC-13
11. Polish: toasts, loading states, empty states, accessibility, responsive, satisfies AC-2, AC-10, AC-11

## Consequences

**Positive**:
- Progressive onboarding reduces cognitive load (one question per screen)
- Linear flow (no branching) simplifies implementation and testing
- proxy.ts gate ensures no unauthenticated/unverified/incomplete access
- localStorage resume reduces drop-off
- shadcn Questionnaire provides accessible, animated, keyboard-navigable UX
- Instant Free Pilot activation removes friction for trial users

**Negative / tradeoffs**:
- Proxy.ts adds middleware complexity; must not block static assets or API routes
- localStorage sync with server state needs careful handling (race conditions)
- Fapshi redirect breaks SPA flow; requires careful return URL handling
- Organization creation in onboarding couples auth and billing domains early

**Neutral**:
- onboardingData JSON on User is flexible but unstructured; migrate to table if analytics needed
- Plan prices in env vars; change requires redeploy (acceptable for Pilot)
- Framer Motion adds bundle size (~12kb) but improves perceived performance

## Follow-up

- [ ] Add `shadcn` community skill conventions to AGENTS.md (project-wide)
- [ ] Add `better-auth` community skill conventions to AGENTS.md (project-wide)
- [ ] Design Fapshi webhook reconciliation Inngest function (separate spec)
- [ ] Design subscription renewal cron Inngest function (separate spec)
- [ ] Add onboarding analytics events (step started, completed, dropped) for funnel tracking
- [ ] Consider email drip campaign for incomplete onboarding (Inngest)