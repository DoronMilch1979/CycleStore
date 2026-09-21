import { StoreFooter } from "@/components/storefront/store-footer";
import { StoreHeader } from "@/components/storefront/store-header";
import {
  getCachedCategories,
  getCachedContactFields,
  getCachedHomepage,
} from "@/server/queries/public";

export async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const [homepage, categories, contactFields] = await Promise.all([
    getCachedHomepage(),
    getCachedCategories(),
    getCachedContactFields(),
  ]);

  return (
    <>
      <StoreHeader storeName={homepage.storeName} categories={categories} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <StoreFooter fields={contactFields} />
    </>
  );
}
