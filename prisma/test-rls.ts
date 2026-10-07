import { prisma, withRlsContext } from "@/lib/prisma";

async function testRls() {
  console.log("🧪 Testing RLS policies...\n");

  // Use random UUIDs to avoid conflicts
  const orgId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  const otherOrgId = crypto.randomUUID();
  const otherUserId = crypto.randomUUID();
  const testEmail = `test-${Date.now()}@example.com`;

  console.log("1. Creating test user...");
  await prisma.user.create({
    data: {
      id: userId,
      email: testEmail,
      passwordHash: "hashed",
      emailVerified: true,
    },
  });

  console.log("2. Creating test organization (with RLS context)...");
  await withRlsContext(null, userId, async (tx) => {
    await tx.organization.create({
      data: {
        id: orgId,
        name: "Test Org",
        slug: `test-org-${Date.now()}`,
        ownerId: userId,
        plan: "FREE_PILOT",
        subscriptionStatus: "TRIALING",
      },
    });
  });

  console.log("3. Creating membership...");
  await withRlsContext(orgId, userId, async (tx) => {
    await tx.member.create({
      data: {
        userId,
        organizationId: orgId,
        role: "OWNER",
      },
    });
  });

  console.log("4. Testing RLS with correct org context...");
  await withRlsContext(orgId, userId, async (tx) => {
    const orgs = await tx.organization.findMany({
      where: { id: orgId },
    });
    console.log(`   Found ${orgs.length} organization(s) with correct context`);
    if (orgs.length !== 1) throw new Error("Expected 1 organization");
  });

  console.log("5. Testing RLS with wrong org context (should see 0)...");
  await withRlsContext(otherOrgId, otherUserId, async (tx) => {
    const orgs = await tx.organization.findMany({
      where: { id: orgId },
    });
    console.log(`   Found ${orgs.length} organization(s) with wrong context`);
    if (orgs.length !== 0) throw new Error("Expected 0 organizations");
  });

  console.log("6. Testing RLS with no context (should see 0)...");
  await withRlsContext(null, null, async (tx) => {
    const orgs = await tx.organization.findMany({
      where: { id: orgId },
    });
    console.log(`   Found ${orgs.length} organization(s) with no context`);
    if (orgs.length !== 0) throw new Error("Expected 0 organizations");
  });

  console.log("7. Testing Free Pilot quota logic...");
  await withRlsContext(orgId, userId, async (tx) => {
    const org = await tx.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new Error("Org not found");
    const canGenerate = org.plan === "FREE_PILOT" && org.certificatesUsed < 1;
    console.log(`   Free Pilot can generate: ${canGenerate}`);
    if (!canGenerate) throw new Error("Free Pilot should be able to generate 1 cert");
  });

  console.log("8. Testing subscription state machine...");
  await withRlsContext(orgId, userId, async (tx) => {
    await tx.subscription.create({
      data: {
        organizationId: orgId,
        plan: "MONTHLY",
        status: "TRIALING",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  });
  console.log("   Subscription created with TRIALING status");

  console.log("\n✅ All RLS tests passed!");
}

testRls()
  .catch((e) => {
    console.error("❌ RLS test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });