import { PrismaClient, Plan, SubscriptionStatus } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  const monthlyPrice = parseInt(process.env.MONTHLY_PRICE_XAF || "500000", 10);
  const yearlyPrice = parseInt(process.env.YEARLY_PRICE_XAF || "5000000", 10);

  console.log(`📋 Plan prices: Monthly=${monthlyPrice} FCFA, Yearly=${yearlyPrice} FCFA`);

  console.log("✅ Seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });