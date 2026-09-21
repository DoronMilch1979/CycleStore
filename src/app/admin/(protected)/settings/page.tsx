import { PasswordChangeForm } from "@/components/admin/password-change-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">הגדרות מנהל</h1>
      <h2 className="text-xl font-semibold">שינוי סיסמה</h2>
      <PasswordChangeForm redirectTo="/admin/settings" />
    </div>
  );
}
