import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const reconcileFapshiPayment = inngest.createFunction(
  { id: "reconcile-fapshi-payment", concurrency: 10, retries: 5, triggers: [{ event: "fapshi/webhook.received" }] },
  async ({ event, step }) => {
    const payload = event.data;
    const providerPaymentId = payload.transaction_id || payload.id;
    const signature = payload.signature;

    const isValid = await step.run("verify-signature", async () => {
      const webhookSecret = process.env.FAPSHI_WEBHOOK_SECRET!;
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(payload))
        .digest("hex");
      return signature === expectedSignature;
    });

    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    const existingPayment = await step.run("check-existing-payment", async () => {
      return prisma.payment.findUnique({
        where: { providerPaymentId },
        include: { subscription: true },
      });
    });

    if (existingPayment) {
      return { idempotent: true, paymentId: existingPayment.id };
    }

    const amount = Math.round(parseFloat(payload.amount) * 100);
    const status = payload.status === "success" ? "SUCCEEDED" : "FAILED";

    const payment = await step.run("create-payment", async () => {
      return prisma.payment.create({
        data: {
          organizationId: payload.organization_id,
          provider: "FAPSHI",
          providerPaymentId,
          amount,
          currency: "XAF",
          status,
          purpose: payload.purpose || "SUBSCRIPTION",
          metadata: payload,
          confirmedAt: status === "SUCCEEDED" ? new Date() : null,
        },
      });
    });

    if (status === "SUCCEEDED" && payment.subscriptionId) {
      await step.run("activate-subscription", async () => {
        await prisma.subscription.update({
          where: { id: payment.subscriptionId! },
          data: {
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await prisma.organization.update({
          where: { id: payment.organizationId },
          data: { subscriptionStatus: "ACTIVE" },
        });

        await prisma.auditEvent.create({
          data: {
            organizationId: payment.organizationId,
            action: "subscription_activated",
            targetType: "Subscription",
            targetId: payment.subscriptionId!,
            metadata: { paymentId: payment.id },
          },
        });
      });
    }

    return { success: true, paymentId: payment.id };
  }
);