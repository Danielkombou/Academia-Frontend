import nodemailer from "nodemailer";

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

interface VerificationEmailParams {
  to: string;
  url: string;
  token: string;
}

interface ResetPasswordEmailParams {
  to: string;
  url: string;
  token: string;
}

interface InvitationEmailParams {
  email: string;
  inviter: { name?: string; email: string };
  organization: { name: string; slug: string };
  url: string;
  role: string;
}

export async function sendVerificationEmail({
  to,
  url,
  token,
}: VerificationEmailParams) {
  await transporter.sendMail({
    from: `Veni <${from}>`,
    to,
    subject: "Verify your email address - Veni",
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
              <p style="color: #6b7280; margin: 8px 0 0;">Welcome to Veni</p>
            </div>
            <p style="font-size: 16px; color: #374151;">Thanks for signing up! Please verify your email address to activate your account.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; background: #4faf83; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Verify Email Address</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">Or copy this link: <br><a href="${url}" style="color: #4faf83; word-break: break-all;">${url}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #9ca3af;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendResetPasswordEmail({
  to,
  url,
  token,
}: ResetPasswordEmailParams) {
  await transporter.sendMail({
    from: `Veni <${from}>`,
    to,
    subject: "Reset your password - Veni",
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
              <p style="color: #6b7280; margin: 8px 0 0;">Password Reset</p>
            </div>
            <p style="font-size: 16px; color: #374151;">You requested to reset your password. Click the button below to create a new one.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; background: #4faf83; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">Or copy this link: <br><a href="${url}" style="color: #4faf83; word-break: break-all;">${url}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #9ca3af;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendInvitationEmail({
  email,
  inviter,
  organization,
  url,
  role,
}: InvitationEmailParams) {
  await transporter.sendMail({
    from: `Veni <${from}>`,
    to: email,
    subject: `You're invited to join ${organization.name} on Veni`,
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
              <p style="color: #6b7280; margin: 8px 0 0;">Organization Invitation</p>
            </div>
            <p style="font-size: 16px; color: #374151;"><strong>${inviter.name || inviter.email}</strong> invited you to join <strong>${organization.name}</strong> as a <strong>${role}</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${url}" style="display: inline-block; background: #4faf83; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Accept Invitation</a>
            </div>
            <p style="font-size: 14px; color: #9ca3af;">Or copy this link: <br><a href="${url}" style="color: #4faf83; word-break: break-all;">${url}</a></p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="font-size: 12px; color: #9ca3af;">This invitation expires in 48 hours.</p>
          </div>
        </body>
      </html>
    `,
  });
}