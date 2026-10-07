"use server";

import { getCertGenerationLimiter } from "@/lib/arcjet";
import { auth } from "@/lib/auth";

export async function protectCertificateGeneration(plan: string) {
  const session = await auth.api.getSession({ headers: new Headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const limiter = getCertGenerationLimiter(plan);
  
  const decision = await limiter.protect({}, {
    userId: session.user.id,
    requested: 1,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      const resetTime = decision.reason.resetTime as number | undefined;
      const resetSeconds = resetTime 
        ? Math.ceil((resetTime - Date.now()) / 1000) 
        : 60;
      throw new Error(
        `Rate limit exceeded. Try again in ${resetSeconds} seconds.`
      );
    }
    throw new Error("Security check failed");
  }

  return { success: true, decision };
}