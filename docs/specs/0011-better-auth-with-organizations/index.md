# 0011. Better Auth with organizations

**Date**: 2026-10-07
**Status**: In Progress

## Summary

This spec defines the Better Auth integration for Veni Pilot with email/password authentication, email verification, password reset, and the organization plugin with role-based access control. It uses Better Auth's built-in access control system to define organization roles (Owner, Admin, Member, Event Manager, Staff, Speaker, Volunteer) with granular permissions for certificate generation, template management, billing, and member management. The integration follows Better Auth's recommended patterns for server and client setup with Prisma adapter.

## Requirements

**User stories**:
- As a visitor, I can sign up with email and password so that I can create an account
- As a user, I must verify my email before signing in so that account ownership is confirmed
- As a user, I can reset my password if I forget it
- As an organizer, I can create an organization during onboarding and become its Owner
- As an organization Owner, I can invite members with specific roles (Admin, Member, Event Manager, Staff, Speaker, Volunteer)
- As an organization member, I can only perform actions permitted by my role
- As a platform admin, I can manage users and organizations globally

**Acceptance criteria**:
- **AC-1**: Email/password sign up creates user with emailVerified=false, sends verification email
- **AC-2**: Email verification required before sign in; unverified users redirected to verification page
- **AC-3**: Password reset flow sends reset email with secure token, allows new password
- **AC-4**: Organization plugin enabled with custom roles: Owner, Admin, Member, Event Manager, Staff, Speaker, Volunteer
- **AC-5**: Access control (ac) defines permissions per role for resources: organization, member, invitation, template, batch, certificate, billing
- **AC-6**: Owner has full control; Admin manages members/templates/batches/billing; Member generates certificates; Event Manager/Staff manage check-in; Speaker/Volunteer limited access
- **AC-7**: Server-side session contains active organizationId and role for RLS context
- **AC-8**: Client-side auth client exposes organization methods (create, update, invite, getMembers, etc.)
- **AC-9**: Email verification uses Nodemailer via Mailpit locally, SMTP in production
- **AC-10**: Session cookie secure, httpOnly, sameSite=lax; JWT for API if needed

## Decision

**Chosen option**: Better Auth with organization plugin and custom access control

**Implementation skills**: `better-auth` (better-auth/better-auth, .agents/skills/better-auth/) · `prisma` (prisma/prisma, .agents/skills/prisma/)

## Rationale

Reasoning and options: see rationale.md

## Feature design

**Data model sketch**:

```
User (Better Auth managed)
  id String @id @default(cuid())
  email String @unique
  emailVerified Boolean
  name String?
  image String?
  role String?  // global roles: user, admin (platform)
  banned Boolean @default(false)
  banReason String?
  banExpires DateTime?
  createdAt DateTime
  updatedAt DateTime

Session (Better Auth managed)
  id String @id @default(cuid())
  userId String @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  token String @unique
  ipAddress String?
  userAgent String?
  activeOrganizationId String?  // for RLS context
  createdAt DateTime
  updatedAt DateTime

Account (Better Auth managed - OAuth if added later)
  id String @id @default(cuid())
  userId String @relation(fields: [userId], references: [id], onDelete: Cascade)
  providerId String
  accountId String
  accessToken String?
  refreshToken String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope String?
  password String?  // for email/password
  createdAt DateTime
  updatedAt DateTime

Verification (Better Auth managed)
  id String @id @default(cuid())
  identifier String
  value String
  expiresAt DateTime
  createdAt DateTime
  updatedAt DateTime

Organization (Better Auth organization plugin)
  id String @id @default(cuid())
  name String
  slug String @unique
  logo String?
  metadata Json?
  createdAt DateTime
  updatedAt DateTime

Member (Better Auth organization plugin)
  id String @id @default(cuid())
  organizationId String @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  userId String @relation(fields: [userId], references: [id], onDelete: Cascade)
  role String  // comma-separated roles: "owner,admin"
  createdAt DateTime

Invitation (Better Auth organization plugin)
  id String @id @default(cuid())
  organizationId String @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  email String
  role String
  status String @default("pending")
  expiresAt DateTime
  inviterId String
  createdAt DateTime

OrganizationRole (Better Auth organization plugin - custom roles)
  id String @id @default(cuid())
  organizationId String @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role String @unique
  permission Json  // serialized permissions
  createdAt DateTime
  updatedAt DateTime
```

**Access control (ac) statement**:

```typescript
// lib/auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/organization/access";

export const statement = {
  ...defaultStatements,
  template: ["create", "read", "update", "delete"],
  batch: ["create", "read", "update", "delete", "download"],
  certificate: ["read", "download", "verify"],
  billing: ["read", "update", "create-subscription", "cancel-subscription"],
  settings: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  organization: ["*"],
  member: ["*"],
  invitation: ["*"],
  template: ["*"],
  batch: ["*"],
  certificate: ["*"],
  billing: ["*"],
  settings: ["*"],
});

export const admin = ac.newRole({
  organization: ["update", "read"],
  member: ["create", "read", "update", "delete"],
  invitation: ["create", "read", "cancel"],
  template: ["*"],
  batch: ["*"],
  certificate: ["read", "download"],
  billing: ["read", "update", "create-subscription"],
  settings: ["read", "update"],
});

export const member = ac.newRole({
  organization: ["read"],
  member: ["read"],
  template: ["create", "read"],
  batch: ["create", "read"],
  certificate: ["read", "download"],
  billing: ["read"],
});

export const eventManager = ac.newRole({
  organization: ["read"],
  member: ["read"],
  template: ["read"],
  batch: ["read"],
  certificate: ["read", "download"],
});

export const staff = ac.newRole({
  organization: ["read"],
  member: ["read"],
  batch: ["read"],
  certificate: ["read"],
});

export const speaker = ac.newRole({
  organization: ["read"],
  batch: ["read"],
});

export const volunteer = ac.newRole({
  organization: ["read"],
  batch: ["read"],
});
```

**State transitions**:

User: unverified → verified → (banned?)
Organization: created → active → deleted
Member: invited → accepted → (role updated) → removed
Invitation: pending → accepted | expired | canceled
Subscription: trialing → active → past_due → canceled

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Better Auth handles all auth routes automatically | | | | | |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Sign up verification email | verification link | Better Auth emailVerification.sendVerificationEmail |
| Password reset email | reset link | Better Auth emailVerification.sendResetPasswordEmail |
| Organization creation | organizationId, slug | Better Auth organization.create |
| Member invitation | invitation link | Better Auth organization.inviteMember |
| Role permission check | boolean | ac.roles[role].authorize(permissions) |
| Active org in session | activeOrganizationId | Session.activeOrganizationId |
| User roles in org | roles array | Member.role.split(",") |

**Key invariants**:
- Email unique per User
- Organization slug unique
- User can only be member of org once (unique orgId+userId)
- Owner role cannot be removed from creator
- At least one Owner must exist per organization
- Platform admin (global role=admin) bypasses org permissions
- Session.activeOrganizationId must be set when user switches orgs

**Security model**:
- Better Auth handles session management, CSRF, secure cookies
- Organization permissions enforced via ac.roles[role].authorize(permissions)
- Server-side: auth.api.hasPermission({ userId, organizationId, permissions })
- Client-side: authClient.organization.checkRolePermission({ permissions, role })
- RLS context: session.activeOrganizationId → app.current_org_id, session.userId → app.current_user_id
- Passwords hashed with bcrypt (Better Auth default)
- Email verification tokens single-use, expire 24h
- Password reset tokens single-use, expire 1h

**Configuration required**:
- `BETTER_AUTH_SECRET`: 32+ char random string for session signing
- `BETTER_AUTH_URL`: http://localhost:3000 (dev) or production URL
- `DATABASE_URL`: PostgreSQL connection (already in .env)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: for Nodemailer
- `NEXT_PUBLIC_APP_URL`: for email links and redirects

## Critical test scenarios

- Happy path: Sign up → verify email → sign in → create org → invite member → check permissions, verifies AC-1, AC-2, AC-3, AC-4, AC-5
- Role enforcement: Member tries to invite → denied; Admin invites → allowed, verifies AC-6
- Session org context: User switches org → session.activeOrganizationId updates → RLS filters correctly, verifies AC-7
- Password reset: Request → email → click link → set new password → sign in works, verifies AC-3
- Platform admin: Global admin accesses any org data bypassing RLS, verifies AC-6
- Email verification expired: Token >24h old → rejected with clear message, verifies AC-2
- Duplicate org slug: Second org with same slug → error with suggestion, verifies AC-4

## Build plan

1. Install Better Auth packages: better-auth, better-auth/client, better-auth/plugins; add to auth config, satisfies AC-1, AC-2, AC-3
2. Create lib/auth/permissions.ts with access control statement and roles, satisfies AC-4, AC-5, AC-6
3. Configure Better Auth server (lib/auth.ts): email/password, emailVerification, organization plugin with ac/roles, Prisma adapter, satisfies AC-1, AC-2, AC-3, AC-4, AC-5
4. Configure Better Auth client (lib/auth-client.ts): organizationClient with ac/roles, satisfies AC-8
5. Add email verification and password reset email sending via Nodemailer, satisfies AC-9
6. Create auth API routes: /api/auth/[...better-auth]/route.ts, satisfies AC-1, AC-2, AC-3
7. Create sign-up page (/signup) and sign-in page (/signin) with shadcn forms, satisfies AC-1, AC-2
8. Create email verification page (/verify-email) with token handling, satisfies AC-2
9. Create password reset pages (/forgot-password, /reset-password), satisfies AC-3
10. Add session middleware to set activeOrganizationId and userId for RLS, satisfies AC-7
11. Update proxy.ts to check emailVerified and onboardingCompleted, satisfies AC-2
12. Integration test: full flow sign up → verify → sign in → create org → invite → permission check, satisfies AC-1 through AC-10

## Consequences

**Positive**:
- Battle-tested auth library with session management, CSRF, secure cookies
- Organization plugin provides multi-tenancy, invitations, RBAC out of the box
- Custom access control (ac) fits Veni's role-permission model precisely
- Email verification and password reset built-in with customizable email sending
- Prisma adapter integrates with existing schema
- Type-safe client with organization methods

**Negative / tradeoffs**:
- Better Auth owns User, Session, Account, Verification tables (cannot customize freely)
- Organization plugin owns Organization, Member, Invitation, OrganizationRole tables
- Must use Better Auth's schema conventions (cuid IDs, specific field names)
- Custom roles require merging with defaultStatements to preserve built-in permissions
- Learning curve for access control system

**Neutral**:
- Migration adds Better Auth tables alongside existing Pilot tables
- Can coexist with existing User model fields (role, phone, source, onboardingStep)
- Platform admin global role separate from org roles

## Follow-up

- [ ] Add `better-auth` community skill conventions to AGENTS.md (project-wide)
- [ ] Design email templates for verification, reset, invitation
- [ ] Design organization switcher in header for multi-org users
- [ ] Design member management UI (invite, role update, remove)
- [ ] Design role/permission editor for dynamic roles
- [ ] Add 2FA support (Better Auth two-factor plugin)
- [ ] Add OAuth providers (Google, GitHub, Microsoft)