import { getDb } from "@/db";
import { contactFields } from "@/db/schema/content";
import { asc } from "drizzle-orm";
import { ContactManager } from "@/components/admin/contact-manager";

export default async function ContactPage() {
  const fields = await getDb()
    .select()
    .from(contactFields)
    .orderBy(asc(contactFields.sortOrder), asc(contactFields.id));
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">עריכת פרטי קשר</h1>
      <ContactManager fields={fields} />
    </div>
  );
}
