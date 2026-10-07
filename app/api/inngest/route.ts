import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import {
  staleAccountCleanup,
  verificationReminder7d,
  verificationReminder12d,
  processCertificateBatch,
  reconcileFapshiPayment,
  subscriptionRenewalCron,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    staleAccountCleanup,
    verificationReminder7d,
    verificationReminder12d,
    processCertificateBatch,
    reconcileFapshiPayment,
    subscriptionRenewalCron,
  ],
});