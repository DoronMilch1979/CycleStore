import Link from "next/link";
import type { CategoryBreadcrumb } from "@/domain/catalog/queries";

export function ProductBreadcrumbs({
  path,
  productName,
}: {
  path: CategoryBreadcrumb[];
  productName: string;
}) {
  return (
    <nav aria-label="פירורי לחם" className="mb-6 sm:mb-8">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        {path.map((category, index) => (
          <li key={category.slug} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-border">
                /
              </span>
            ) : null}
            <Link
              href={`/categories/${category.slug}`}
              className="text-link hover:text-primary"
            >
              {category.name}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-2">
          {path.length > 0 ? (
            <span aria-hidden="true" className="text-border">
              /
            </span>
          ) : null}
          <span className="font-medium text-foreground" aria-current="page">
            {productName}
          </span>
        </li>
      </ol>
    </nav>
  );
}
