import { HomepageEditor } from "@/components/admin/homepage-editor";
import { getDb } from "@/db";
import { homepageContent } from "@/db/schema/content";

export default async function HomepageContentPage() {
  const [row] = await getDb().select().from(homepageContent).limit(1);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">עריכת מסך הבית</h1>
      <HomepageEditor storyText={row?.storyText ?? ""} heroAlt={row?.heroAlt ?? ""} />
    </div>
  );
}
