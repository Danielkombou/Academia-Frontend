import { inngest } from "@/lib/inngest/client";
import { prisma } from "@/lib/prisma";

const CHUNK_SIZE = 50;

export const processCertificateBatch = inngest.createFunction(
  { id: "process-certificate-batch", concurrency: 5, retries: 5, triggers: [{ event: "certs/generate.batch" }] },
  async ({ event, step }) => {
    const { batchId, organizationId } = event.data;

    const batch = await step.run("fetch-batch", async () => {
      const batch = await prisma.certificateBatch.findUnique({
        where: { id: batchId },
        include: { template: true },
      });
      if (!batch) throw new Error("Batch not found");
      if (batch.organizationId !== organizationId) throw new Error("Organization mismatch");
      return batch;
    });

    await step.run("update-status-processing", async () => {
      await prisma.certificateBatch.update({
        where: { id: batchId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
    });

    const recipients = await step.run("fetch-recipients", async () => {
      return prisma.certificate.findMany({
        where: { batchId },
        orderBy: { createdAt: "asc" },
      });
    });

    const totalChunks = Math.ceil(recipients.length / CHUNK_SIZE);
    const pdfUrls: string[] = [];

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const chunk = recipients.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE);
      
      const chunkUrls = await step.run(`generate-chunk-${chunkIndex}`, async () => {
        const urls = await generateCertificatePdfs(chunk, batch);
        return urls;
      });
      
      pdfUrls.push(...chunkUrls);
      
      await step.run(`update-progress-${chunkIndex}`, async () => {
        await prisma.certificateBatch.update({
          where: { id: batchId },
          data: { completedCount: (chunkIndex + 1) * CHUNK_SIZE },
        });
      });
    }

    const zipUrl = await step.run("generate-zip", async () => {
      return await createAndUploadZip(pdfUrls, batchId);
    });

    await step.run("complete-batch", async () => {
      await prisma.certificateBatch.update({
        where: { id: batchId },
        data: {
          status: "COMPLETED",
          completedCount: recipients.length,
          zipStorageKey: zipUrl,
          completedAt: new Date(),
        },
      });
      
      await prisma.auditEvent.create({
        data: {
          organizationId,
          action: "certificate_batch_completed",
          targetType: "CertificateBatch",
          targetId: batchId,
          metadata: { recipientCount: recipients.length, zipUrl },
        },
      });
    });

    return { success: true, batchId, zipUrl, recipientCount: recipients.length };
  }
);

async function generateCertificatePdfs(recipients: any[], batch: any): Promise<string[]> {
  return recipients.map((r) => `${process.env.NEXT_PUBLIC_APP_URL}/api/certificates/${r.id}/pdf`);
}

async function createAndUploadZip(pdfUrls: string[], batchId: string): Promise<string> {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/batches/${batchId}/zip`;
}