import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { userProfiles } from "@/db/schema/profiles";
import { createAuth } from "@/lib/auth-factory";
import { createTestDatabase } from "@/test/pglite";

const BOOTSTRAP_PASSWORD = "123456";
const STRONG_PASSWORD = "ReplacementPass1";

describe("admin authentication", () => {
  let close: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await close?.();
    close = undefined;
  });

  it("bootstraps admin, forces password change, and rejects the old password afterwards", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const authApi = createAuth(test.db, { withNextCookies: false });

    const ctx = await authApi.$context;
    const hash = await ctx.password.hash(BOOTSTRAP_PASSWORD);
    const created = await ctx.internalAdapter.createUser(
      {
        name: "מנהל מערכת",
        email: "admin@internal.local",
        username: "admin",
        displayUsername: "admin",
        emailVerified: true,
      },
      { method: "admin" },
    );

    await ctx.internalAdapter.createAccount({
      userId: created.id,
      accountId: created.id,
      providerId: "credential",
      password: hash,
    });

    await test.db
      .insert(userProfiles)
      .values({
        userId: created.id,
        role: "ADMIN",
        mustChangePassword: true,
      })
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: { role: "ADMIN", mustChangePassword: true },
      });

    const signInResponse = await authApi.api.signInUsername({
      body: { username: "admin", password: BOOTSTRAP_PASSWORD },
      asResponse: true,
    });
    expect(signInResponse.ok).toBe(true);
    const payload = (await signInResponse.clone().json()) as {
      user: { username?: string };
    };
    expect(payload.user.username).toBe("admin");

    const cookieHeader = signInResponse.headers
      .getSetCookie()
      .map((part) => part.split(";")[0])
      .join("; ");

    const [profile] = await test.db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, created.id))
      .limit(1);
    expect(profile?.mustChangePassword).toBe(true);

    await authApi.api.changePassword({
      body: {
        currentPassword: BOOTSTRAP_PASSWORD,
        newPassword: STRONG_PASSWORD,
        revokeOtherSessions: true,
      },
      headers: new Headers({ cookie: cookieHeader }),
    });

    await test.db
      .update(userProfiles)
      .set({ mustChangePassword: false, passwordChangedAt: new Date() })
      .where(eq(userProfiles.userId, created.id));

    await expect(
      authApi.api.signInUsername({
        body: { username: "admin", password: BOOTSTRAP_PASSWORD },
      }),
    ).rejects.toBeTruthy();

    const secondLogin = await authApi.api.signInUsername({
      body: { username: "admin", password: STRONG_PASSWORD },
    });
    expect(secondLogin.user.id).toBe(created.id);
  });

  it("rejects unauthenticated access to admin authorization data", async () => {
    const test = await createTestDatabase();
    close = test.close;
    const authApi = createAuth(test.db, { withNextCookies: false });

    const session = await authApi.api.getSession({
      headers: new Headers(),
    });
    expect(session).toBeNull();
  });
});
