import Link from "next/link";
import type { PublicContactField } from "@/server/queries/public";

export function StoreFooter({ fields }: { fields: PublicContactField[] }) {
  const visible = fields.filter((field) => field.value.trim().length > 0);

  return (
    <footer id="contact" className="mt-auto border-t border-border bg-surface pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] py-10">
        <h2 className="mb-4 text-xl font-semibold">צור קשר</h2>
        {visible.length === 0 ? (
          <p className="text-muted">פרטי הקשר יפורסמו כאן לאחר עדכון בממשק הניהול.</p>
        ) : (
          <ul className="space-y-2">
            {visible.map((field) => (
              <li key={field.fieldKey}>
                <span className="font-medium">{field.label}: </span>
                {field.fieldType === "email" ? (
                  <a className="text-link" href={`mailto:${field.value}`}>
                    {field.value}
                  </a>
                ) : field.fieldType === "phone" ? (
                  <a className="text-link" href={`tel:${field.value}`}>
                    {field.value}
                  </a>
                ) : field.fieldType === "whatsapp" ? (
                  <a
                    className="text-link"
                    href={`https://wa.me/${field.value.replace(/\D/g, "")}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {field.value}
                  </a>
                ) : field.fieldType === "facebook" ? (
                  <a className="text-link" href={field.value} rel="noreferrer" target="_blank">
                    עמוד הפייסבוק
                  </a>
                ) : field.fieldType === "url" ? (
                  <a className="text-link" href={field.value} rel="noreferrer" target="_blank">
                    {field.value}
                  </a>
                ) : field.fieldType === "hours" ? (
                  <span className="whitespace-pre-line">{field.value}</span>
                ) : (
                  field.value
                )}
              </li>
            ))}
          </ul>
        )}
        <nav aria-label="נגישות" className="mt-8 border-t border-border pt-6">
          <Link href="/accessibility" className="text-link text-base font-semibold">
            הצהרת נגישות
          </Link>
        </nav>
      </div>
    </footer>
  );
}
