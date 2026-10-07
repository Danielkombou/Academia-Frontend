import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { ac, owner, admin, member, eventManager, staff, speaker, volunteer } from "./permissions";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, sendResetPasswordEmail, sendInvitationEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url, token }: { user: { email: string }; url: string; token: string }) => {
      await sendVerificationEmail({ to: user.email, url, token });
    },
    sendResetPasswordEmail: async ({ user, url, token }: { user: { email: string }; url: string; token: string }) => {
      await sendResetPasswordEmail({ to: user.email, url, token });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }: { user: { email: string }; url: string; token: string }) => {
      await sendVerificationEmail({ to: user.email, url, token });
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      source: {
        type: "string",
        required: false,
        input: true,
      },
      onboardingStep: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      onboardingData: {
        type: "json",
        required: false,
        input: false,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
        eventManager,
        staff,
        speaker,
        volunteer,
      },
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      organizationLimit: 5,
      membershipLimit: 100,
      invitationExpiresIn: 172800, // 48 hours
      sendInvitationEmail: async (data: Record<string, unknown>) => {
        // Better Auth passes various data; extract what we need
        const email = data.email as string;
        const inviter = data.inviter as { name?: string; email: string };
        const organization = data.organization as { name: string; slug: string };
        const invitation = data.invitation as { id: string; role: string };
        const url = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation/${invitation.id}`;
        await sendInvitationEmail({
          email,
          inviter,
          organization,
          url,
          role: invitation.role,
        });
      },
    }),
  ],

  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,

  advanced: {
    cookiePrefix: "veni",
    crossSubDomainCookies: {
      enabled: false,
    },
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
});

export type Auth = typeof auth;