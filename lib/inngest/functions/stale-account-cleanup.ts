import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";

export const staleAccountCleanup = inngest.createFunction(
  { id: "stale-account-cleanup", concurrency: 1, triggers: [{ cron: "0 3 * * *" }] },
  async ({ step }) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const deletedCount = await step.run("delete-stale-accounts", async () => {
      const result = await prisma.user.deleteMany({
        where: {
          emailVerified: false,
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      return result.count;
    });

    if (deletedCount > 0) {
      await step.run("log-deletion", async () => {
        await prisma.auditEvent.create({
          data: {
            action: "stale_account_cleanup",
            targetType: "User",
            targetId: "bulk",
            metadata: { deletedCount, cutoffDate: cutoffDate.toISOString() },
          },
        });
      });
    }

    return { deletedCount, cutoffDate: cutoffDate.toISOString() };
  }
);