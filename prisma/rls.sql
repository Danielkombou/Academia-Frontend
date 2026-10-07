-- Enable RLS on all org-scoped tables
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CertificateTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CertificateBatch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Certificate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" ENABLE ROW LEVEL SECURITY;

-- Force RLS for all users including superusers
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Membership" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Payment" FORCE ROW LEVEL SECURITY;
ALTER TABLE "CertificateTemplate" FORCE ROW LEVEL SECURITY;
ALTER TABLE "CertificateBatch" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Certificate" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditEvent" FORCE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS org_isolation ON "Organization";
DROP POLICY IF EXISTS membership_isolation ON "Membership";
DROP POLICY IF EXISTS subscription_isolation ON "Subscription";
DROP POLICY IF EXISTS payment_isolation ON "Payment";
DROP POLICY IF EXISTS template_isolation ON "CertificateTemplate";
DROP POLICY IF EXISTS batch_isolation ON "CertificateBatch";
DROP POLICY IF EXISTS certificate_isolation ON "Certificate";
DROP POLICY IF EXISTS audit_isolation ON "AuditEvent";
DROP POLICY IF EXISTS test_policy ON "Organization";

-- Policy for Organization: users can see orgs they own or are members of
-- Allow INSERT when user is the owner (ownerId = current_user_id)
CREATE POLICY org_isolation ON "Organization"
  USING (
    "id" = current_setting('app.current_org_id')
    OR "ownerId" = current_setting('app.current_user_id')
    OR "id" IN (
      SELECT "organizationId" FROM "Membership" WHERE "userId" = current_setting('app.current_user_id')
    )
  )
  WITH CHECK (
    "ownerId" = current_setting('app.current_user_id')
    OR "id" = current_setting('app.current_org_id')
  );

-- Policy for Membership: users can only see memberships in their organizations
CREATE POLICY membership_isolation ON "Membership"
  USING (
    "organizationId" = current_setting('app.current_org_id')
  )
  WITH CHECK (
    "organizationId" = current_setting('app.current_org_id')
  );

-- Policy for Subscription: organization members can see subscription
CREATE POLICY subscription_isolation ON "Subscription"
  USING (
    "organizationId" = current_setting('app.current_org_id')
  )
  WITH CHECK (
    "organizationId" = current_setting('app.current_org_id')
  );

-- Policy for Payment: organization members can see payments
CREATE POLICY payment_isolation ON "Payment"
  USING (
    "organizationId" = current_setting('app.current_org_id')
  )
  WITH CHECK (
    "organizationId" = current_setting('app.current_org_id')
  );

-- Policy for CertificateTemplate: organization members can see templates
CREATE POLICY template_isolation ON "CertificateTemplate"
  USING (
    "organizationId" = current_setting('app.current_org_id')
  )
  WITH CHECK (
    "organizationId" = current_setting('app.current_org_id')
  );

-- Policy for CertificateBatch: organization members can see batches
CREATE POLICY batch_isolation ON "CertificateBatch"
  USING (
    "organizationId" = current_setting('app.current_org_id')
  )
  WITH CHECK (
    "organizationId" = current_setting('app.current_org_id')
  );

-- Policy for Certificate: organization members can see certificates
CREATE POLICY certificate_isolation ON "Certificate"
  USING (
    "organizationId" = current_setting('app.current_org_id')
  )
  WITH CHECK (
    "organizationId" = current_setting('app.current_org_id')
  );

-- Policy for AuditEvent: organization members can see audit events
CREATE POLICY audit_isolation ON "AuditEvent"
  USING (
    "organizationId" = current_setting('app.current_org_id')
  )
  WITH CHECK (
    "organizationId" = current_setting('app.current_org_id')
  );