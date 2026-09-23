"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { CONTACT_FIELD_TYPES } from "@/config/store-content";
import { formAction } from "@/lib/form-action";
import {
  addContactFieldAction,
  deleteContactFieldAction,
  saveContactFieldAction,
} from "@/server/actions/catalog";

type Field = {
  id: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  value: string;
  isActive: boolean;
};

const selectClassName =
  "w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-foreground";

function fieldTypeOptions(current: string) {
  if (CONTACT_FIELD_TYPES.some((type) => type.value === current)) {
    return CONTACT_FIELD_TYPES;
  }
  return [...CONTACT_FIELD_TYPES, { value: current, label: current }];
}

function FieldTypeSelect({ id, defaultValue }: { id: string; defaultValue: string }) {
  return (
    <select id={id} name="fieldType" className={selectClassName} defaultValue={defaultValue}>
      {fieldTypeOptions(defaultValue).map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}

export function ContactManager({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<{ fieldId: string; message: string } | null>(null);

  async function onDelete(field: Field) {
    const confirmed = window.confirm(`למחוק את פרט הקשר "${field.label}"?`);
    if (!confirmed) return;

    setPendingId(field.id);
    setError(null);
    const result = await deleteContactFieldAction(field.id);
    setPendingId(null);
    if (!result.ok) {
      setError({ fieldId: field.id, message: result.error });
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <ul className="space-y-6">
        {fields.map((field) => (
          <li key={field.id} className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
            <form
              className="grid gap-3 md:grid-cols-2"
              action={formAction(saveContactFieldAction)}
            >
              <input type="hidden" name="id" value={field.id} />
              <div>
                <Label htmlFor={`label-${field.id}`}>תווית</Label>
                <Input id={`label-${field.id}`} name="label" defaultValue={field.label} />
              </div>
              <div>
                <Label htmlFor={`value-${field.id}`}>ערך</Label>
                <Input id={`value-${field.id}`} name="value" defaultValue={field.value} />
              </div>
              <div>
                <Label htmlFor={`type-${field.id}`}>סוג שדה</Label>
                <FieldTypeSelect id={`type-${field.id}`} defaultValue={field.fieldType} />
              </div>
              <label className="flex items-center gap-2 self-end">
                <input type="checkbox" name="isActive" defaultChecked={field.isActive} />
                פעיל
              </label>
              <p className="text-sm text-muted md:col-span-2">מפתח: {field.fieldKey}</p>
              <div className="flex flex-wrap items-center gap-3 md:col-span-2">
                <Button type="submit">שמירה</Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={pendingId === field.id}
                  onClick={() => onDelete(field)}
                >
                  מחיקה
                </Button>
              </div>
              <div className="md:col-span-2">
                <FieldError message={error?.fieldId === field.id ? error.message : null} />
              </div>
            </form>
          </li>
        ))}
      </ul>
      <section>
        <h2 className="mb-3 text-xl font-semibold">הוספת שדה חדש</h2>
        <p className="mb-3 max-w-xl text-sm text-muted">
          המפתח הוא מזהה פנימי ייחודי, למשל instagram. סוג השדה קובע איך הערך מוצג באתר: טקסט,
          טלפון, קישור או שעות.
        </p>
        <form className="grid max-w-xl gap-3" action={formAction(addContactFieldAction)}>
          <div>
            <Label htmlFor="new-field-key">מפתח באנגלית</Label>
            <Input
              id="new-field-key"
              name="fieldKey"
              placeholder="instagram"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-field-label">תווית בעברית</Label>
            <Input id="new-field-label" name="label" placeholder="אינסטגרם" required />
          </div>
          <div>
            <Label htmlFor="new-field-type">סוג שדה</Label>
            <FieldTypeSelect id="new-field-type" defaultValue="text" />
          </div>
          <div>
            <Label htmlFor="new-field-value">ערך</Label>
            <Input id="new-field-value" name="value" placeholder="ערך" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isActive" />
            פעיל
          </label>
          <Button type="submit">הוספת שדה</Button>
        </form>
      </section>
    </div>
  );
}
