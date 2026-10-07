import arcjet, { shield, detectBot, tokenBucket } from "@arcjet/next";

export const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
  ],
});

export const certGenerationLimiter = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    tokenBucket({
      mode: "LIVE",
      characteristics: ["userId"],
      refillRate: 10,
      interval: 60,
      capacity: 20,
    }),
  ],
});

export function getCertGenerationLimiter(plan: string) {
  const limits = {
    FREE_PILOT: { refillRate: 10, capacity: 20 },
    MONTHLY: { refillRate: 100, capacity: 200 },
    YEARLY: { refillRate: 500, capacity: 1000 },
  };

  const config = limits[plan as keyof typeof limits] || limits.FREE_PILOT;

  return arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [
      tokenBucket({
        mode: "LIVE",
        characteristics: ["userId"],
        refillRate: config.refillRate,
        interval: 60,
        capacity: config.capacity,
      }),
    ],
  });
}