import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";

export const subscriptionRenewalCron = inngest.createFunction(
  { id: "subscription-renewal-cron", concurrency: 1, triggers: [{ cron: "0 4 * * *" }] },
  async ({ step }) => {
    const pastDueOrgs = await step.run("find-past-due-orgs", async () => {
      return prisma.organization.findMany({
        where: {
          subscriptionStatus: "PAST_DUE",
          plan: { in: ["MONTHLY", "YEARLY"] },
        },
        include: { subscriptions: true },
      });
    });

    let renewedCount = 0;

    for (const org of pastDueOrgs) {
      const subscription = org.subscriptions[0];
      if (!subscription) continue;

      const paymentLink = await step.run(`create-renewal-link-${org.id}`, async () => {
        const amount = org.plan === "YEARLY" 
          ? parseInt(process.env.YEARLY_PRICE_XAF || "5000000", 10)
          : parseInt(process.env.MONTHLY_PRICE_XAF || "500000", 10);
        
        return {
          url: `${process.env.FAPSHI_API_URL}/payment-link`,
          amount,
          organizationId: org.id,
          subscriptionId: subscription.id,
        };
      });

      await step.run(`log-renewal-${org.id}`, async () => {
        await prisma.auditEvent.create({
          data: {
            organizationId: org.id,
            action: "subscription_renewal_initiated",
            targetType: "Subscription",
            targetId: subscription.id,
            metadata: { plan: org.plan, paymentLink: paymentLink.url },
          },
        });
      });

      renewedCount++;
    }

    return { renewedCount, orgIds: pastDueOrgs.map((o) => o.id) };
  }
);