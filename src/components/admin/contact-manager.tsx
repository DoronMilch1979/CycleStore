"use client";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { addContactFieldAction, saveContactFieldAction } from "@/server/actions/catalog";
import { formAction } from "@/lib/form-action";

type Field = {
  id: string;
  fieldKey: string;
  fieldType: string;
  label: string;
  value: string;
  isActive: boolean;
};

export function ContactManager({ fields }: { fields: Field[] }) {
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
                <Input id={`type-${field.id}`} name="fieldType" defaultValue={field.fieldType} />
              </div>
              <label className="flex items-center gap-2 self-end">
                <input type="checkbox" name="isActive" defaultChecked={field.isActive} />
                פעיל
              </label>
              <p className="text-sm text-muted md:col-span-2">מפתח: {field.fieldKey}</p>
              <Button type="submit">שמירה</Button>
            </form>
          </li>
        ))}
      </ul>
      <section>
        <h2 className="mb-3 text-xl font-semibold">הוספת שדה חדש</h2>
        <form className="grid max-w-xl gap-3" action={formAction(addContactFieldAction)}>
          <Input name="fieldKey" placeholder="מפתח באנגלית, למשל instagram" required />
          <Input name="label" placeholder="תווית בעברית" required />
          <Input name="fieldType" defaultValue="text" />
          <Input name="value" placeholder="ערך" />
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
