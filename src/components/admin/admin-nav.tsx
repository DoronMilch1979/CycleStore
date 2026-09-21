import Link from "next/link";
import { adminLogoutAction } from "@/server/actions/admin";

const NAV = [
  {
    title: "עריכת תוכן",
    items: [
      { href: "/admin/content/homepage" as const, label: "עריכת מסך הבית" },
      { href: "/admin/content/contact" as const, label: "עריכת פרטי קשר" },
      { href: "/admin/content/branding" as const, label: "מיתוג ובאנרים" },
    ],
  },
  {
    title: "ניהול מלאי",
    items: [
      { href: "/admin/products/new" as const, label: "הוספת מוצר חדש" },
      { href: "/admin/inventory" as const, label: "עדכון מלאי" },
      { href: "/admin/categories" as const, label: "ניהול קטגוריות" },
    ],
  },
  {
    title: "הגדרות מנהל",
    items: [{ href: "/admin/settings" as const, label: "שינוי סיסמה" }],
  },
];

export function AdminNav() {
  return (
    <aside className="w-full border-b border-border bg-surface md:w-64 md:border-b-0 md:border-inline-end">
      <div className="flex items-center justify-between p-4">
        <Link href="/admin" className="font-bold text-primary">
          ניהול החנות
        </Link>
        <form action={adminLogoutAction}>
          <button type="submit" className="text-sm text-muted">
            יציאה
          </button>
        </form>
      </div>
      <nav className="space-y-6 p-4" aria-label="ניווט ניהול">
        {NAV.map((section) => (
          <div key={section.title}>
            <p className="mb-2 text-sm font-semibold">{section.title}</p>
            <ul className="space-y-2">
              {section.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
