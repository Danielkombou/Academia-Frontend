import { PrismaClient } from "@/lib/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function withRlsContext<T>(
  orgId: string | null,
  userId: string | null,
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    if (orgId) {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_org_id = '${orgId}';`);
    } else {
      await tx.$executeRawUnsafe(`RESET app.current_org_id;`);
    }
    if (userId) {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}';`);
    } else {
      await tx.$executeRawUnsafe(`RESET app.current_user_id;`);
    }
    try {
      return await fn(tx);
    } finally {
      await tx.$executeRawUnsafe(`RESET app.current_org_id;`);
      await tx.$executeRawUnsafe(`RESET app.current_user_id;`);
    }
  });
}