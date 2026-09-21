"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { changeAdminPasswordAction } from "@/server/actions/admin";

export function PasswordChangeForm({ redirectTo }: { redirectTo: Route }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="max-w-md space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const result = await changeAdminPasswordAction(new FormData(event.currentTarget));
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.replace(redirectTo);
        router.refresh();
      }}
    >
      <div>
        <Label htmlFor="currentPassword">סיסמה נוכחית</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="newPassword">סיסמה חדשה</Label>
        <Input id="newPassword" name="newPassword" type="password" required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">אישור סיסמה חדשה</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      <p className="text-sm text-muted">
        הסיסמה החדשה חייבת להכיל לפחות 12 תווים, כולל אות ומספר.
      </p>
      <FieldError message={error} />
      <Button type="submit" disabled={pending}>
        עדכון סיסמה
      </Button>
    </form>
  );
}
