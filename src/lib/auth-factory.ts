import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";
import { account, rateLimit, session, user, verification } from "@/db/schema/auth";
import { userProfiles } from "@/db/schema/profiles";
import type { AppDatabase } from "@/db/types";
import { ADMIN_SESSION_SECONDS } from "@/config/site";
import { MIN_REPLACEMENT_PASSWORD_LENGTH } from "@/domain/auth/password-policy";
import { env, getPublicSiteUrl } from "@/lib/env";

const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export function createAuth(db: AppDatabase, options?: { withNextCookies?: boolean }) {
  const isNextBuild =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build";

  if (env.NODE_ENV === "production" && !isNextBuild) {
    if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
      throw new Error("BETTER_AUTH_SECRET must be set to a strong value in production.");
    }
  }

  return betterAuth({
    appName: "CycleStore",
    baseURL: env.BETTER_AUTH_URL ?? getPublicSiteUrl(),
    secret: env.BETTER_AUTH_SECRET ?? "dev-only-placeholder-secret-do-not-use-32",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        rateLimit,
      },
      transaction: true,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: MIN_REPLACEMENT_PASSWORD_LENGTH,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    socialProviders: googleConfigured
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID!,
            clientSecret: env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : undefined,
    session: {
      expiresIn: ADMIN_SESSION_SECONDS,
      updateAge: 60 * 60,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-in/username": { window: 60, max: 5 },
        "/change-password": { window: 60, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === "production",
      database: {
        generateId: "uuid",
      },
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        path: "/",
      },
    },
    disabledPaths: ["/sign-up/email"],
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            await db
              .insert(userProfiles)
              .values({
                userId: createdUser.id,
                role: "CUSTOMER",
                mustChangePassword: false,
              })
              .onConflictDoNothing();
          },
        },
      },
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
      }),
      ...(options?.withNextCookies === false ? [] : [nextCookies()]),
    ],
  });
}
