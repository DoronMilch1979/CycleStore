"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { adminLoginAction } from "@/server/actions/admin";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const formData = new FormData(event.currentTarget);
        const result = await adminLoginAction(formData);
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.replace("/admin");
        router.refresh();
      }}
    >
      <div>
        <Label htmlFor="username">שם משתמש</Label>
        <Input id="username" name="username" autoComplete="username" required />
      </div>
      <div>
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <FieldError message={error} />
      <Button type="submit" disabled={pending}>
        כניסה
      </Button>
    </form>
  );
}
