import type { Metadata } from "next";
import { PasswordChangeForm } from "@/components/admin/password-change-form";
import { requireAdminPage } from "@/server/authz";

export const metadata: Metadata = {
  title: "החלפת סיסמה",
  robots: { index: false, follow: false },
};

export default async function ForcedPasswordChangePage() {
  const admin = await requireAdminPage({ allowPasswordChangeOnly: true });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6">
      <h1 className="mb-3 text-3xl font-bold">יש להחליף את הסיסמה</h1>
      {admin.profile.mustChangePassword ? (
        <p className="mb-6 text-muted">
          זוהי הכניסה הראשונה. יש לבחור סיסמה חדשה לפני הכניסה למערכת הניהול.
        </p>
      ) : (
        <p className="mb-6 text-muted">עדכון סיסמת מנהל.</p>
      )}
      <PasswordChangeForm redirectTo="/admin" />
    </div>
  );
}
