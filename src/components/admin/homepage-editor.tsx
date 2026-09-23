"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import type { HeroDisplayMode } from "@/domain/content/hero-slides";
import { cn } from "@/lib/cn";
import { saveHomepageAction } from "@/server/actions/admin";
import {
  deleteHomepageImageAction,
  moveHomepageImageAction,
  setHomepagePrimaryImageAction,
  uploadHomepageImageAction,
} from "@/server/actions/catalog";

type StoreImage = {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
};

export function HomepageEditor({
  storyText,
  heroAlt,
  heroDisplay,
  images,
}: {
  storyText: string;
  heroAlt: string;
  heroDisplay: HeroDisplayMode;
  images: StoreImage[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePending, setImagePending] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);

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
          <Label htmlFor="heroAlt">טקסט חלופי כללי לתמונות החנות</Label>
          <Input id="heroAlt" name="heroAlt" defaultValue={heroAlt} />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">הצגת תמונות החנות</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["slideshow", "מצגת מתחלפת"],
                ["primary", "תמונה ראשית בלבד"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "cursor-pointer rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm",
                  "has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
                )}
              >
                <input
                  type="radio"
                  name="heroDisplay"
                  value={value}
                  defaultChecked={heroDisplay === value}
                  className="sr-only"
                  onChange={async (event) => {
                    const form = event.currentTarget.form;
                    if (!form) return;
                    setError(null);
                    const result = await saveHomepageAction(new FormData(form));
                    if (result.ok) {
                      setMessage("התוכן נשמר.");
                      router.refresh();
                    } else {
                      setError(result.error);
                    }
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit">שמירת תוכן</Button>
      </form>
      <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface p-4">
        <h2 className="font-semibold">תמונת החנות</h2>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            setImagePending(true);
            setImageError(null);
            setMessage(null);
            const result = await uploadHomepageImageAction(new FormData(form));
            setImagePending(false);
            if (!result.ok) {
              setImageError(result.error);
              return;
            }
            form.reset();
            setUploadCount(0);
            setMessage("התמונות עודכנו.");
            router.refresh();
          }}
        >
          <Input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={(event) => setUploadCount(event.target.files?.length ?? 0)}
          />
          <Input name="altText" placeholder="טקסט חלופי" />
          {uploadCount > 1 ? (
            <p className="text-sm text-muted">בהעלאת כמה תמונות לא ניתן לקבוע תמונה ראשית.</p>
          ) : (
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isPrimary" />
              תמונה ראשית
            </label>
          )}
          <Button type="submit" variant="secondary" disabled={imagePending}>
            העלאת תמונות
          </Button>
        </form>
        {images.length === 0 ? (
          <p className="text-sm text-muted">אין תמונות לחנות.</p>
        ) : (
          <ul className="space-y-3">
            {images.map((image, index) => (
              <li key={image.id} className="flex gap-3 rounded border border-border p-2">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
                  <Image
                    src={image.url}
                    alt={image.altText || "תמונת החנות"}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm">
                    {image.isPrimary ? <span className="font-medium">תמונה ראשית</span> : null}
                    {image.isPrimary && image.altText ? " · " : null}
                    {image.altText}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {image.isPrimary ? null : (
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        disabled={imagePending}
                        onClick={async () => {
                          setImagePending(true);
                          setImageError(null);
                          const result = await setHomepagePrimaryImageAction(image.id);
                          setImagePending(false);
                          if (!result.ok) {
                            setImageError(result.error);
                            return;
                          }
                          router.refresh();
                        }}
                      >
                        קבע כראשית
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      disabled={imagePending || index === 0}
                      onClick={async () => {
                        setImagePending(true);
                        setImageError(null);
                        const result = await moveHomepageImageAction(image.id, "up");
                        setImagePending(false);
                        if (!result.ok) {
                          setImageError(result.error);
                          return;
                        }
                        router.refresh();
                      }}
                    >
                      למעלה
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      type="button"
                      disabled={imagePending || index === images.length - 1}
                      onClick={async () => {
                        setImagePending(true);
                        setImageError(null);
                        const result = await moveHomepageImageAction(image.id, "down");
                        setImagePending(false);
                        if (!result.ok) {
                          setImageError(result.error);
                          return;
                        }
                        router.refresh();
                      }}
                    >
                      למטה
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      type="button"
                      disabled={imagePending}
                      onClick={async () => {
                        if (!window.confirm("למחוק את התמונה?")) return;
                        setImagePending(true);
                        setImageError(null);
                        const result = await deleteHomepageImageAction(image.id);
                        setImagePending(false);
                        if (!result.ok) {
                          setImageError(result.error);
                          return;
                        }
                        router.refresh();
                      }}
                    >
                      מחיקה
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        <FieldError message={imageError} />
      </div>
      <FieldError message={error} />
      {message ? <p className="text-success">{message}</p> : null}
    </div>
  );
}
