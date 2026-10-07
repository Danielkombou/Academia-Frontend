# Scope: Veni

Veni connects the event lifecycle from planning and registration to attendance, participation, and certification. The immediate product is a polished certificate workflow used to validate demand, learn what organizations will pay for, and establish the foundations needed for the larger platform.

**Build approach:** Tracer Bullet (prove each thin slice end to end against a known good reference before starting the next one).
**Workflow:** Beta (verify on the real app, then write a test suite). The project default level of rigor. `/solution-architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/feature-build` and skip `/solution-architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Stack and tooling | Foundation | existing |
| B | Project context | Foundation | existing |
| 1 | Veni theme and typography | Foundation | existing |
| 2 | Theme provider and dark mode toggle | Foundation | existing |
| 3 | Route shape and app shell | Foundation | existing |
| 4 | Template upload | Slice 1 | existing |
| 5 | Names upload | Slice 2 | existing |
| 6 | Position and name formatting | Slice 3 | existing |
| 7 | Preview and generate | Slice 4 | existing |
| 8 | Download the batch | Slice 5 | existing |
| 9 | Full parity proof | Proof | existing |
| 10 | Database schema and Prisma setup | Pilot Foundation | planned |
| 11 | Better Auth with organizations | Pilot Foundation | planned |
| 12 | Inngest background engine | Pilot Foundation | planned |
| 13 | Arcjet security and rate limiting | Pilot Foundation | planned |
| 14 | Email delivery with Nodemailer | Pilot Foundation | planned |
| 15 | Design system, icons, and visual polish | Pilot Foundation | planned |
| 16 | Landing page and pricing | Pilot Public | planned |
| 17 | Sign up and email verification | Pilot Auth | planned |
| 18 | Onboarding and organization creation | Pilot Auth | planned |
| 19 | Dashboard shell and navigation | Pilot Dashboard | planned |
| 20 | Organization settings and billing page | Pilot Dashboard | planned |
| 21 | Fapshi payment integration | Pilot Billing | planned |
| 22 | Entitlement engine and plan enforcement | Pilot Billing | planned |
| 23 | Server-side certificate batch generation | Pilot Certificate | planned |
| 24 | Certificate templates CRUD | Pilot Certificate | planned |
| 25 | Batch history and download | Pilot Certificate | planned |
| 26 | Usage analytics and funnel tracking | Pilot Measurement | planned |

## Foundations (Existing - Port Complete)

### A. Stack and tooling · existing

Next.js 16 App Router scaffold with TypeScript strict, Tailwind 4, Biome, and shadcn on the base-sera style. Code in `./`

### B. Project context · existing

The parity rule against the React app, the Veni branding and theme decisions, the Next.js porting gotchas, and the naming rules for the product. Code in `AGENTS.md`

### 1. Veni theme and typography · existing

Apply the green Veni theme and the Outfit, Nunito and JetBrains Mono fonts so the app stops rendering the stock taupe shadcn palette, without breaking the tokens shadcn's own components rely on. Spec 0001 · code in `app/globals.css`, `app/layout.tsx`, `components.json`

### 2. Theme provider and dark mode toggle · existing

Dark mode follows the operating system by default and can be overridden from a header control, remembered between visits. Spec 0002 · code in `app/layout.tsx`, `components/providers/theme-provider.tsx`, `components/theme-toggle.tsx`, `vitest.setup.ts`, `components/ui/dropdown-menu.tsx`

### 3. Route shape and app shell · existing

Split the React app's single scrolling page into a landing page at `/` and a generator at `/generate`, and build the shared Header, Hero and Footer on shadcn. Spec 0003 · code in `app/(site)/`, `app/not-found.tsx`, `app/layout.tsx`, `components/header.tsx`, `components/hero.tsx`, `components/footer.tsx`

### 4. Template upload · existing

Accept PNG, JPG and PDF templates, rasterise the first PDF page at 300 DPI, cap the embedded resolution, and alert on a file that will not load. Spec 0004 · code in `app/(site)/generate/page.tsx`, `components/step-template.tsx`, `lib/templateUtils.ts`, `lib/pdfClient.ts`

### 5. Names upload · existing

Read CSV, TXT and DOCX name lists, strip leading numbering such as `1. Name`, and show the file name and recipient count. Code in `app/(site)/generate/page.tsx`, `components/step-names.tsx`, `lib/namesUtils.ts`, `lib/docxClient.ts`, `mammoth-browser.d.ts`

### 6. Position and name formatting · existing

The step where the user sets the name position, font size, colour, and how many name parts show in full against how many become initials. Spec 0006 · code in `app/(site)/generate/page.tsx`, `components/step-position.tsx`, `lib/nameFormat.ts`

### 7. Preview and generate · existing

Mirror the output in the live preview, then generate one PDF per recipient at the page size the template aspect ratio implies. Spec 0007 · code in `app/(site)/generate/page.tsx`, `components/step-preview.tsx`, `lib/pdfGenerate.ts`

### 8. Download the batch · existing

Download the whole batch as a ZIP, streaming straight to disk where the browser supports it, and offer a single PDF download alongside it. Spec 0008 · code in `app/(site)/generate/page.tsx`, `components/step-done.tsx`, `lib/zipUtils.ts`

### 9. Full parity proof · existing

Run the same template, same names file and same settings through both apps and compare the results, so the port is proven rather than assumed. Code in test fixtures and verification scripts.

## Pilot Foundation

### 10. Database schema and Prisma setup · done

Define the relational schema for users, organizations, memberships, roles, subscriptions, entitlements, payments, certificate templates, batches, and certificates with row-level security boundaries. PostgreSQL with Prisma ORM.
**Done when:** Prisma schema models all Pilot entities, migrations apply cleanly, generated types available, RLS policies enforce organization isolation.
- [x] Design it (spec): `/solution-architect database schema and Prisma setup`
- [x] Build it: `/feature-build database schema and Prisma setup`
   - [x] Prisma schema with User, Organization, Membership, enums; RLS setup SQL; thin thread migration
   - [x] Subscription, Payment, AuditEvent; RLS policies for billing tables
   - [x] CertificateTemplate, CertificateBatch, Certificate; RLS policies for certificate tables
   - [x] Prisma Client middleware for `app.current_org_id`
   - [x] Seed script for Plan prices, Role enum defaults
   - [x] Integration test: RLS, Free Pilot quota, subscription state machine
Spec 0009 · code in `prisma/`, `lib/prisma.ts`

### 11. Better Auth with organizations · done

Integrate Better Auth for identity, sessions, email verification, password reset, and organization plugin with role-based access control. Users own identities, organizations own paid organizer activity.
**Done when:** Sign up, sign in, email verification, password reset, organization creation, membership and role assignment all work; sessions persist; unverified users cannot sign in.
- [x] Design it (spec): `/solution-architect better auth with organizations`
- [x] Build it: `/feature-build better auth with organizations`
   - [x] Install Better Auth packages and configure server/client
   - [x] Access control (ac) with custom roles and permissions
   - [x] Email/password auth, verification, password reset
   - [x] Organization plugin with invitations and roles
   - [x] Session middleware for RLS context (activeOrganizationId)
   - [x] Auth pages: signup, signin, verify-email, forgot-password, reset-password
   - [x] proxy.ts gates for emailVerified and onboardingCompleted
   - [x] Integration test: full auth + org flow
Spec 0011 · code in `lib/auth/`, `lib/auth-client.ts`, `app/api/auth/`, `lib/auth/permissions.ts`

### 12. Inngest background engine · in-progress

Set up Inngest for async work: stale account cleanup, verification reminders, bulk certificate batch processing, payment webhook reconciliation, subscription renewal cron.
**Done when:** Inngest dev server runs locally, HTTP endpoint exposed at `/api/inngest`, core functions registered (auth cleanup, cert batch, subscriptions), retries and backoff configured.
- [x] Design it (spec): `/solution-architect inngest background engine`
- [ ] Build it: `/feature-build inngest background engine`
   - [ ] Install Inngest, add dev server to docker-compose, create /api/inngest endpoint
   - [ ] Stale account cleanup function (daily cron, 14 days)
   - [ ] Verification reminder functions (7d and 12d delays)
   - [ ] Certificate batch processing function (chunked, progress, object storage)
   - [ ] Payment webhook reconciliation (Fapshi signature, idempotent)
   - [ ] Subscription renewal cron (daily, PAST_DUE processing)
   - [ ] Retries, backoff, concurrency limits configured
   - [ ] Integration test: all functions register, dev server works
Spec 0012 · code in `lib/inngest/`, `app/api/inngest/`

### 13. Arcjet security and rate limiting · planned · needs a decision

Integrate Arcjet Shield for bot detection and attack protection globally, plus token-bucket rate limiting on certificate generation actions keyed by organization entitlement.
**Done when:** Global shield active, bot detection blocks scrapers, generation rate limit respects plan entitlements, denied requests return clear error messages.
- [ ] Design it (spec): `/solution-architect arcjet security and rate limiting`

### 14. Email delivery with Nodemailer · planned · needs a decision

Configure Nodemailer with Mailpit for local development, wired into Better Auth for verification emails and Inngest for transactional sends (receipts, batch ready alerts).
**Done when:** Verification emails send on sign up, Mailpit UI shows them locally, Inngest functions can send transactional emails, production SMTP config documented.
- [ ] Design it (spec): `/solution-architect email delivery with nodemailer`

### 15. Design system, icons, and visual polish · planned · needs a decision

Establish the Veni visual language on top of shadcn/ui: customize component variants, define icon usage (lucide-react), illustration/empty-state strategy, loading skeletons, toast patterns, and responsive breakpoints. Create a component style guide so every pilot screen feels cohesive and production-grade.
**Done when:** Component variants documented, icon library decisions made, empty/loading/error states designed for all pilot flows, style guide page renders at `/style-guide`, no raw colors or ad-hoc spacing in pilot components.
- [ ] Design it (spec): `/solution-architect design system icons and visual polish`

## Pilot Public

### 16. Landing page and pricing · planned · needs a decision

Build the public marketing page with product promise, certificate workflow explanation, pricing table (Free Pilot, Monthly, Yearly), FAQ, and credibility elements. Responsive across mobile, tablet, desktop.
**Done when:** `/` renders hero, workflow steps, pricing cards with FCFA prices, FAQ accordion, footer; pricing links navigate to sign up with plan context; no raw colors, all tokens.
- [ ] Design it (spec): `/solution-architect landing page and pricing`

## Pilot Auth

### 17. Sign up and email verification · planned · needs a decision

Multi-step flow: create account, verify email (required before sign in), handle resend and expired links, safe next-route preservation through verification.
**Done when:** New user registers, receives verification email, clicks link, lands on onboarding with session established; unverified users blocked from sign in with clear message.
- [ ] Design it (spec): `/solution-architect sign up and email verification`

### 18. Onboarding and organization creation · planned · needs a decision

Progressive onboarding for organizers only: collect basic user info, create organization with basic info, show plan selection (Free Pilot, Monthly, Yearly), activate entitlement. No attendee path in Pilot.
**Done when:** User completes onboarding, organization created, plan selected and entitlement active, user lands on dashboard with org context.
- [ ] Design it (spec): `/solution-architect onboarding and organization creation`

## Pilot Dashboard

### 19. Dashboard shell and navigation · planned · needs a decision

Authenticated shell with sidebar (Overview, Certificates, Organization, Settings, Billing), header with account menu (name, org context, email, Settings, Billing, Sign out), route protection via Next.js proxy.ts.
**Done when:** Protected routes redirect through auth, verification, onboarding gates; sidebar navigation works; account menu shows correct org context; proxy.ts handles coarse gating.
- [ ] Design it (spec): `/solution-architect dashboard shell and navigation`

### 20. Organization settings and billing page · planned · needs a decision

Settings page for organization name and essential info, user profile, billing tab showing plan, payment state, renewal or cancellation actions, upgrade/downgrade flow.
**Done when:** Organization name editable, billing tab reflects current subscription, upgrade initiates payment flow, cancellation confirms and schedules downgrade at period end.
- [ ] Design it (spec): `/solution-architect organization settings and billing page`

## Pilot Billing

### 21. Fapshi payment integration · planned · needs a decision

Fapshi provider adapter isolating API calls, payment link creation, webhook verification, transaction recording, sandbox and live environment config. No assumption of native recurring billing.
**Done when:** Payment link generates for Monthly and Yearly plans, webhook verifies and records transaction, subscription status updates, reconciliation job handles retries, explicit renewal flow documented.
- [ ] Design it (spec): `/solution-architect fapshi payment integration`

### 22. Entitlement engine and plan enforcement · planned · needs a decision

Central entitlement model resolving feature access and quotas from subscription state. Free Pilot: one trial batch max 3 certificates. Monthly/Yearly: paid entitlements. Server-side enforcement on generation actions.
**Done when:** Entitlement checks gate certificate generation, Free Pilot enforces 3 cert limit, paid plans enforce their quotas, UI reflects current entitlement and remaining quota.
- [ ] Design it (spec): `/solution-architect entitlement engine and plan enforcement`

## Pilot Certificate

### 23. Server-side certificate batch generation · planned · needs a decision

Replace client-side generation with Inngest function: accept batch request, chunk PDF rendering, compile ZIP, upload to object storage, notify organizer. Template and names stored server-side.
**Done when:** User submits generation request, Inngest processes in background, progress tracked, ZIP delivered via signed URL, memory stays bounded, matches reference output for position, font, size, colour, page dimensions.
- [ ] Design it (spec): `/solution-architect server-side certificate batch generation`

### 24. Certificate templates CRUD · planned · needs a decision

Organizers can upload, list, preview, update, and delete reusable certificate templates. Templates belong to organization, support PNG, JPG, PDF (first page), store rasterized asset at capped resolution.
**Done when:** Template upload appears in org library, preview shows correct aspect ratio, update replaces asset, delete removes from library and future batches, RLS prevents cross-org access.
- [ ] Design it (spec): `/solution-architect certificate templates crud`

### 25. Batch history and download · planned · needs a decision

Dashboard shows past batches with status, recipient count, generated date, download action. Completed batches serve ZIP from object storage. Failed batches show error and retry option.
**Done when:** Batch list paginated, status badges accurate, download streams ZIP, retry re-queues Inngest job, empty state guides to create first batch.
- [ ] Design it (spec): `/solution-architect batch history and download`

## Pilot Measurement

### 26. Usage analytics and funnel tracking · planned · needs a decision

Instrument the validation funnel: landing visits, sign ups, verifications, onboarding completions, org creations, plan selections, payment starts, payment successes, first batch generation, repeat batches, feature requests.
**Done when:** Events fire at each funnel stage, dashboard shows conversion rates, Free-to-Paid conversion tracked, Yearly vs Monthly split visible, repeat usage measurable, data exportable for analysis.
- [ ] Design it (spec): `/solution-architect usage analytics and funnel tracking`

## Deferred

Out of scope for the current build pass, kept so the plan stays honest.

- **Event creation and publication** · needs a decision
- **Registration and attendee management** · needs a decision
- **Ticketing and payment collection** · needs a decision
- **QR check-in and checkout** · needs a decision
- **Speakers, sessions, and resources** · needs a decision
- **Eligibility-driven certificate issuance** · needs a decision
- **Digital verification pages and APIs** · needs a decision
- **Multi-organization membership** · needs a decision
- **Native mobile apps** · needs a decision
- **Advanced institutional integrations** · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/solution-architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope-plan` | one box: `Design it (spec): /solution-architect <feature>` |
| `in-progress` (designed) | **`/solution-architect` at spec capture** | `Design it` ticked; spec linked; `Build it: /feature-build <feature>` + **2 to 5 milestones**; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+); any surfaced follow-up enrolled |
| `in-progress` (building) | `/feature-build` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/verify-release` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | **you, when you decide it is**; `/state-sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage is the suggested point to call it done; `/state-sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/solution-architect` first; otherwise straight to `/feature-build`. The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Workflow tier tag** beside a heading (e.g. `· GA`) sets that one feature's rigor above or below the project default; no tag inherits the default. It decides the feature's check boxes and each skill's next suggestion.
- **Workflow** (header line) is the project default, what runs after `/feature-build`: **Prototype** = nothing (trust `/feature-build`'s own build time self check); **Alpha** = `/verify-release`; **Beta** = `/verify-release` then `/test-engineer`; **GA** adds a fresh model `/peer-review` then `/tech-writer`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/solution-architect`, the code path by `/feature-build`.

## References

**Project sources**

- The React reference app at `~/Projects/veni-react`: the spec for every behaviour the port reproduced.
- Root `AGENTS.md`: the parity rule, the branding and theme exceptions, and the porting gotchas recorded from reading both codebases.
- Veni blueprint (this conversation): Validation of Demand Phase, Pilot architecture, technical stack decisions.

**Practices and standards**

- Foundations before features: database, auth, background engine, security, email come first, because every later slice builds on them.
- Vertical slices ship real value early: each auth, billing, certificate flow step is built thin and working, verified against acceptance criteria before the next one starts.
- The riskiest dependency goes first: database schema and auth are the foundation everything else depends on.
- Server-side invariant: frontend hiding is not authorization. Every protected mutation validates organization membership, role/permission, entitlement, and ownership on the server.