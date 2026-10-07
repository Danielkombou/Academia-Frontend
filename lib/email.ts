import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const from = process.env.SMTP_FROM || "noreply@veni.app";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  const info = await transporter.sendMail({
    from: `Veni <${from}>`,
    to,
    subject,
    html,
    text,
  });

  await prisma.auditEvent.create({
    data: {
      action: "email_sent",
      targetType: "Email",
      targetId: info.messageId,
      metadata: { to, subject, messageId: info.messageId },
    },
  });

  return info;
}

export async function sendPaymentReceiptEmail({
  to,
  organizationName,
  amount,
  currency,
  plan,
  paymentId,
}: {
  to: string;
  organizationName: string;
  amount: number;
  currency: string;
  plan: string;
  paymentId: string;
}) {
  const formattedAmount = (amount / 100).toLocaleString();
  
  await sendEmail({
    to,
    subject: `Payment receipt for ${plan} plan - ${organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #4faf83; font-size: 28px; font-weight: 700; margin: 0;">Veni</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Payment Receipt</p>
            </div>
            <p style="font-size: 16px; color: #374151;">Thank you for your payment! Your subscription is now active.</p>
            <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <p style="margin: 0 0 8px;"><strong>Organization:</strong> ${organizationName}</p>
              <p style="margin: 0 0 8px;"><strong>Plan:</strong> ${plan}</p>
              <p style="margin: 0 0 8px;"><strong>Amount:</strong> ${formattedAmount} ${currency}</p>
              <p style="margin: 0;"><strong>Transaction ID:</strong> ${paymentId}</p>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">This receipt is for your records. If you have any questions, please contact support.</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendBatchReadyEmail({
  to,
  organizationName,
  batchName,
  recipientCount,
  downloadUrl,
}: {
  to: string;
  organizationName: string;
  batchName: string;
  recipientCount: number;
  downloadUrl: string;
}) {
  await sendEmail({
    to,
    subject: `Your certificate batch "${batchName}" is ready - ${organizationName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #4faf83; font-size: 28px; font-weight: 700; margin: 0;">Veni</h1>
              <p style="color: #6b7280; margin: 8px 0 0;">Batch Ready</p>
            </div>
            <p style="font-size: 16px; color: #374151;">Your certificate batch has been generated and is ready for download.</p>
            <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
              <p style="margin: 0 0 8px;"><strong>Batch:</strong> ${batchName}</p>
              <p style="margin: 0 0 8px;"><strong>Organization:</strong> ${organizationName}</p>
              <p style="margin: 0 0 8px;"><strong>Recipients:</strong> ${recipientCount}</p>
            </div>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${downloadUrl}" style="display: inline-block; background: #4faf83; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Download Certificates</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">The download link expires in 7 days. Log in to Veni to access your batches anytime.</p>
          </div>
        </body>
      </html>
    `,
  });
}