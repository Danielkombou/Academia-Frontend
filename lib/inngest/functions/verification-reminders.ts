import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/auth/email";

export const verificationReminder7d = inngest.createFunction(
  { id: "verification-reminder-7d", concurrency: 10, triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 7);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const users = await step.run("find-users-7d", async () => {
      return prisma.user.findMany({
        where: {
          emailVerified: false,
          createdAt: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    });

    for (const user of users) {
      await step.run(`send-reminder-7d-${user.id}`, async () => {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${user.id}`;
        await sendVerificationEmail({
          to: user.email,
          url: verificationUrl,
          token: user.id,
        });
      });
    }

    return { remindedCount: users.length, targetDate: targetDate.toISOString() };
  }
);

export const verificationReminder12d = inngest.createFunction(
  { id: "verification-reminder-12d", concurrency: 10, triggers: [{ cron: "0 9 * * *" }] },
  async ({ step }) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 12);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const users = await step.run("find-users-12d", async () => {
      return prisma.user.findMany({
        where: {
          emailVerified: false,
          createdAt: {
            gte: targetDate,
            lt: nextDay,
          },
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    });

    for (const user of users) {
      await step.run(`send-reminder-12d-${user.id}`, async () => {
        const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${user.id}`;
        await sendVerificationEmail({
          to: user.email,
          url: verificationUrl,
          token: user.id,
        });
      });
    }

    return { remindedCount: users.length, targetDate: targetDate.toISOString() };
  }
);