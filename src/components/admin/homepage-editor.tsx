"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { saveHomepageAction } from "@/server/actions/admin";
import { uploadHomepageImageAction as uploadHero } from "@/server/actions/catalog";

export function HomepageEditor({
  storyText,
  heroAlt,
}: {
  storyText: string;
  heroAlt: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-3xl space-y-8">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await saveHomepageAction(new FormData(event.currentTarget));
          if (result.ok) setMessage("התוכן נשמר.");
          else setError(result.error);
        }}
      >
        <div>
          <Label htmlFor="storyText">סיפור החנות</Label>
          <Textarea id="storyText" name="storyText" defaultValue={storyText} />
        </div>
        <div>
          <Label htmlFor="heroAlt">טקסט חלופי לתמונת החנות</Label>
          <Input id="heroAlt" name="heroAlt" defaultValue={heroAlt} />
        </div>
        <Button type="submit">שמירת תוכן</Button>
      </form>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await uploadHero(new FormData(event.currentTarget));
          if (result.ok) setMessage("התמונה עודכנה.");
          else setError(result.error);
        }}
      >
        <div>
          <Label htmlFor="file">תמונת החנות</Label>
          <Input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
        </div>
        <Input type="hidden" name="heroAlt" defaultValue={heroAlt} />
        <Button type="submit">העלאת תמונה</Button>
      </form>
      <FieldError message={error} />
      {message ? <p className="text-success">{message}</p> : null}
    </div>
  );
}
