import { HomepageEditor } from "@/components/admin/homepage-editor";
import { getDb } from "@/db";
import { homepageContent } from "@/db/schema/content";
import { parseHeroDisplayMode } from "@/domain/content/hero-slides";
import { importLegacyHomepageHero, listHomepageImages } from "@/domain/content/store-images";

export default async function HomepageContentPage() {
  const db = getDb();
  await importLegacyHomepageHero(db);
  const [[row], images] = await Promise.all([
    db.select().from(homepageContent).limit(1),
    listHomepageImages(db),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">עריכת מסך הבית</h1>
      <HomepageEditor
        storyText={row?.storyText ?? ""}
        heroAlt={row?.heroAlt ?? ""}
        heroDisplay={parseHeroDisplayMode(row?.heroDisplay)}
        images={images}
      />
    </div>
  );
}
