"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import {
  SELECTABLE_CONTACT_FIELD_TYPES,
  contactFieldTypeLabel,
  socialContactType,
} from "@/config/store-content";
import { formAction } from "@/lib/form-action";
import {
  addContactFieldAction,
  deleteContactFieldAction,
  reorderContactFieldAction,
  saveContactFieldAction,
} from "@/server/actions/catalog";

type Field = {
  id: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  value: string;
  linkUrl: string | null;
  isActive: boolean;
};

const selectClassName =
  "w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-foreground";

function fieldTypeOptions(current: string) {
  if (
    SELECTABLE_CONTACT_FIELD_TYPES.some((type) => type.value === current) ||
    current === "facebook" ||
    current === "whatsapp"
  ) {
    return SELECTABLE_CONTACT_FIELD_TYPES;
  }
  return [...SELECTABLE_CONTACT_FIELD_TYPES, { value: current, label: current }];
}

function FieldTypeSelect({
  id,
  value,
  onValueChange,
}: {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      name="fieldType"
      className={selectClassName}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {fieldTypeOptions(value).map((type) => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}

function MapsLinkField({ id, defaultValue }: { id: string; defaultValue: string }) {
  return (
    <div className="md:col-span-2">
      <Label htmlFor={id}>קישור Google Maps</Label>
      <Input
        id={id}
        name="linkUrl"
        defaultValue={defaultValue}
        placeholder="https://maps.app.goo.gl/..."
        dir="ltr"
      />
      <p className="text-muted mt-1 text-sm">
        קישור קצר בפורמט https://maps.app.goo.gl/… הכתובת בעברית היא הטקסט שיוצג באתר.
      </p>
    </div>
  );
}

function ContactFieldCard({
  field,
  index,
  fieldCount,
  pendingId,
  error,
  onMove,
  onDelete,
}: {
  field: Field;
  index: number;
  fieldCount: number;
  pendingId: string | null;
  error: string | null;
  onMove: (field: Field, direction: "up" | "down") => void;
  onDelete: (field: Field) => void;
}) {
  const lockedType = socialContactType(field);
  const [fieldType, setFieldType] = useState(lockedType ?? field.fieldType);

  return (
    <li className="border-border bg-surface rounded-[var(--radius-md)] border p-4">
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
          <Label htmlFor={`value-${field.id}`}>
            {fieldType === "address" ? "כתובת להצגה" : "ערך"}
          </Label>
          <Input id={`value-${field.id}`} name="value" defaultValue={field.value} />
        </div>
        <div>
          <Label htmlFor={`type-${field.id}`}>סוג שדה</Label>
          {lockedType ? (
            <>
              <select
                id={`type-${field.id}`}
                className={`${selectClassName} bg-surface-muted cursor-not-allowed`}
                defaultValue={lockedType}
                disabled
              >
                <option value={lockedType}>{contactFieldTypeLabel(lockedType)}</option>
              </select>
              <input type="hidden" name="fieldType" value={lockedType} />
              <p className="text-muted mt-1 text-sm">סוג השדה קבוע ולא ניתן לשינוי.</p>
            </>
          ) : (
            <FieldTypeSelect
              id={`type-${field.id}`}
              value={fieldType}
              onValueChange={setFieldType}
            />
          )}
        </div>
        <label className="flex items-center gap-2 self-end">
          <input type="checkbox" name="isActive" defaultChecked={field.isActive} />
          פעיל
        </label>
        {fieldType === "address" ? (
          <MapsLinkField id={`link-${field.id}`} defaultValue={field.linkUrl ?? ""} />
        ) : null}
        <p className="text-muted text-sm md:col-span-2">מפתח: {field.fieldKey}</p>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pendingId === field.id || index === 0}
            onClick={() => onMove(field, "up")}
          >
            למעלה
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pendingId === field.id || index === fieldCount - 1}
            onClick={() => onMove(field, "down")}
          >
            למטה
          </Button>
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
          <FieldError message={error} />
        </div>
      </form>
    </li>
  );
}

function NewContactFieldForm() {
  const [fieldType, setFieldType] = useState("text");

  return (
    <form className="grid max-w-xl gap-3" action={formAction(addContactFieldAction)}>
      <div>
        <Label htmlFor="new-field-key">מפתח באנגלית</Label>
        <Input id="new-field-key" name="fieldKey" placeholder="instagram" required />
      </div>
      <div>
        <Label htmlFor="new-field-label">תווית בעברית</Label>
        <Input id="new-field-label" name="label" placeholder="אינסטגרם" required />
      </div>
      <div>
        <Label htmlFor="new-field-type">סוג שדה</Label>
        <FieldTypeSelect
          id="new-field-type"
          value={fieldType}
          onValueChange={setFieldType}
        />
      </div>
      <div>
        <Label htmlFor="new-field-value">
          {fieldType === "address" ? "כתובת להצגה" : "ערך"}
        </Label>
        <Input
          id="new-field-value"
          name="value"
          placeholder={fieldType === "address" ? "חורש האלונים, רמת ישי" : "ערך"}
        />
      </div>
      {fieldType === "address" ? (
        <MapsLinkField id="new-field-link" defaultValue="" />
      ) : null}
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isActive" />
        פעיל
      </label>
      <Button type="submit">הוספת שדה</Button>
    </form>
  );
}

export function ContactManager({ fields }: { fields: Field[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<{ fieldId: string; message: string } | null>(null);

  async function onMove(field: Field, direction: "up" | "down") {
    setPendingId(field.id);
    setError(null);
    const result = await reorderContactFieldAction(field.id, direction);
    setPendingId(null);
    if (!result.ok) {
      setError({ fieldId: field.id, message: result.error });
      return;
    }
    router.refresh();
  }

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
        {fields.map((field, index) => {
          return (
            <ContactFieldCard
              key={field.id}
              field={field}
              index={index}
              fieldCount={fields.length}
              pendingId={pendingId}
              error={error?.fieldId === field.id ? error.message : null}
              onMove={onMove}
              onDelete={onDelete}
            />
          );
        })}
      </ul>
      <section>
        <h2 className="mb-3 text-xl font-semibold">הוספת שדה חדש</h2>
        <p className="text-muted mb-3 max-w-xl text-sm">
          המפתח הוא מזהה פנימי ייחודי, למשל instagram. סוג השדה קובע איך הערך מוצג באתר:
          טקסט, טלפון, קישור או שעות. בשדה כתובת אפשר להוסיף גם קישור קצר של Google Maps.
          פייסבוק ווואטסאפ הם שדות קבועים, והסוג שלהם לא ניתן לשינוי.
        </p>
        <NewContactFieldForm />
      </section>
    </div>
  );
}
