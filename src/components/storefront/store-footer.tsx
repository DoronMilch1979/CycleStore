import Link from "next/link";
import {
  isGoogleMapsShortLink,
  socialContactType,
  type SocialContactType,
} from "@/config/store-content";
import type { PublicContactField } from "@/server/queries/public";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ContactTypeIcon({
  type,
  className = "size-5",
}: {
  type: string;
  className?: string;
}) {
  const props = { ...iconProps, className, "aria-hidden": true as const };
  if (type === "phone") {
    return (
      <svg {...props}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    );
  }
  if (type === "email") {
    return (
      <svg {...props}>
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    );
  }
  if (type === "address") {
    return (
      <svg {...props}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }
  if (type === "hours") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (type === "url") {
    return (
      <svg {...props}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M5 6h14M5 12h14M5 18h9" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8">
      <path
        fill="#25D366"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
      />
    </svg>
  );
}

function socialHref(kind: SocialContactType, value: string) {
  if (kind === "whatsapp") {
    return `https://wa.me/${value.replace(/\D/g, "")}`;
  }
  return value;
}

function ContactValue({ field }: { field: PublicContactField }) {
  const name = <span className="sr-only">{field.label}: </span>;
  if (field.fieldType === "email") {
    return (
      <a className="text-link" href={`mailto:${field.value}`}>
        {name}
        {field.value}
      </a>
    );
  }
  if (field.fieldType === "phone") {
    return (
      <a className="text-link" href={`tel:${field.value}`}>
        {name}
        {field.value}
      </a>
    );
  }
  if (field.fieldType === "address") {
    if (field.linkUrl && isGoogleMapsShortLink(field.linkUrl)) {
      return (
        <a className="text-link" href={field.linkUrl} rel="noreferrer" target="_blank">
          {name}
          {field.value}
        </a>
      );
    }
    return (
      <span>
        {name}
        {field.value}
      </span>
    );
  }
  if (field.fieldType === "url") {
    return (
      <a className="text-link" href={field.value} rel="noreferrer" target="_blank">
        {name}
        {field.value}
      </a>
    );
  }
  if (field.fieldType === "hours") {
    return (
      <span className="whitespace-pre-line">
        {name}
        {field.value}
      </span>
    );
  }
  return (
    <span>
      {name}
      {field.value}
    </span>
  );
}

export function StoreFooter({ fields }: { fields: PublicContactField[] }) {
  const visible = fields.filter((field) => field.value.trim().length > 0);
  const details = visible.filter((field) => !socialContactType(field));
  const social = visible.filter((field) => socialContactType(field));

  return (
    <footer
      id="contact"
      className="border-border bg-surface mt-auto border-t pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] pt-10 pb-4">
        <h2 className="mb-4 text-xl font-semibold">צור קשר</h2>
        {visible.length === 0 ? (
          <p className="text-muted">פרטי הקשר יפורסמו כאן לאחר עדכון בממשק הניהול.</p>
        ) : (
          <ul className="space-y-3">
            {details.map((field) => (
              <li key={field.fieldKey} className="flex items-start gap-3">
                <span className="text-foreground mt-0.5 inline-flex shrink-0">
                  <ContactTypeIcon type={field.fieldType} />
                </span>
                <ContactValue field={field} />
              </li>
            ))}
            {social.length > 0 ? (
              <li
                className={
                  details.length > 0
                    ? "flex items-center gap-2 pt-2"
                    : "flex items-center gap-2"
                }
              >
                {social.map((field) => {
                  const kind = socialContactType(field);
                  if (!kind) return null;
                  return (
                    <a
                      key={field.fieldKey}
                      className="inline-flex size-11 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                      href={socialHref(kind, field.value)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {kind === "facebook" ? <FacebookIcon /> : <WhatsAppIcon />}
                      <span className="sr-only">{field.label}</span>
                    </a>
                  );
                })}
              </li>
            ) : null}
          </ul>
        )}
        <nav aria-label="נגישות" className="mt-4">
          <Link
            href="/accessibility"
            className="text-link inline-flex min-h-6 items-center text-sm"
          >
            הצהרת נגישות
          </Link>
        </nav>
      </div>
    </footer>
  );
}
