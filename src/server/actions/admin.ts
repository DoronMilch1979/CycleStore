"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema/profiles";
import { passwordsMatch, validateReplacementPassword } from "@/domain/auth/password-policy";
import { AppError, publicErrors, toPublicErrorMessage } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { requireAdminSession } from "@/server/authz";
import { cacheTags } from "@/lib/cache-tags";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function adminLoginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: publicErrors.login };
  }

  try {
    await auth.api.signInUsername({
      body: parsed.data,
      headers: await headers(),
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: publicErrors.login };
  }
}

export async function adminLogoutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "יש להזין את הסיסמה הנוכחית."),
  newPassword: z.string().min(1, "יש להזין סיסמה חדשה."),
  confirmPassword: z.string().min(1, "יש לאשר את הסיסמה החדשה."),
});

export async function changeAdminPasswordAction(formData: FormData) {
  try {
    const admin = await requireAdminSession({ allowPasswordChangeOnly: true });
    const parsed = passwordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.issues[0]?.message ?? publicErrors.validation };
    }

    passwordsMatch(parsed.data.newPassword, parsed.data.confirmPassword);
    validateReplacementPassword(parsed.data.newPassword, {
      username: admin.username ?? undefined,
      currentPassword: parsed.data.currentPassword,
    });

    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    await getDb()
      .update(userProfiles)
      .set({
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, admin.userId));

    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export async function saveHomepageAction(formData: FormData) {
  try {
    await requireAdminSession();
    const storyText = String(formData.get("storyText") ?? "");
    const heroAlt = String(formData.get("heroAlt") ?? "");
    const heroDisplay = formData.get("heroDisplay") === "primary" ? "primary" : "slideshow";
    const { homepageContent } = await import("@/db/schema/content");
    await getDb()
      .insert(homepageContent)
      .values({ id: 1, storyText, heroAlt, heroDisplay })
      .onConflictDoUpdate({
        target: homepageContent.id,
        set: { storyText, heroAlt, heroDisplay, updatedAt: new Date() },
      });
    updateTag(cacheTags.homepage);
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: toPublicErrorMessage(error) };
  }
}

export { AppError };
