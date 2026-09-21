import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { userProfiles } from "@/db/schema/profiles";
import type { AuthProfile, UserRole } from "@/domain/authz/types";
import { AppError, publicErrors } from "@/lib/errors";
import { auth } from "@/lib/auth";

export type AdminSession = {
  userId: string;
  email: string;
  username?: string | null;
  name: string;
  profile: AuthProfile;
};

export async function getSessionUser() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getAuthProfile(userId: string): Promise<AuthProfile | null> {
  const [profile] = await getDb()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return {
    userId: profile.userId,
    role: profile.role as UserRole,
    mustChangePassword: profile.mustChangePassword,
  };
}

export async function requireAdminSession(options?: {
  allowPasswordChangeOnly?: boolean;
}): Promise<AdminSession> {
  const session = await getSessionUser();
  if (!session?.user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      publicMessage: publicErrors.unauthorized,
      httpStatus: 401,
    });
  }

  const profile = await getAuthProfile(session.user.id);
  if (!profile || profile.role !== "ADMIN") {
    throw new AppError({
      code: "FORBIDDEN",
      publicMessage: publicErrors.forbidden,
      httpStatus: 403,
    });
  }

  if (profile.mustChangePassword && !options?.allowPasswordChangeOnly) {
    throw new AppError({
      code: "PASSWORD_CHANGE_REQUIRED",
      publicMessage: "יש להחליף את הסיסמה לפני הכניסה למערכת הניהול.",
      httpStatus: 403,
    });
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    username: "username" in session.user ? (session.user.username as string | null) : null,
    name: session.user.name,
    profile,
  };
}

export async function requireAdminPage(options?: { allowPasswordChangeOnly?: boolean }) {
  try {
    return await requireAdminSession(options);
  } catch (error) {
    if (error instanceof AppError && error.httpStatus === 401) {
      redirect("/admin/login");
    }
    if (error instanceof AppError && error.code === "PASSWORD_CHANGE_REQUIRED") {
      redirect("/admin/change-password");
    }
    redirect("/admin/login");
  }
}
