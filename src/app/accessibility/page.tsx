import type { Metadata } from "next";
import { StorefrontShell } from "@/components/storefront/storefront-shell";
import type { PublicContactField } from "@/server/queries/public";
import { getCachedAccessibility, getCachedContactFields } from "@/server/queries/public";

export const metadata: Metadata = {
  title: "הצהרת נגישות",
  description: "הצהרת הנגישות של האתר ודרכי פנייה לבקשת התאמה או לדיווח על ליקוי.",
};

function contactChannels(fields: PublicContactField[]) {
  return fields.filter(
    (field) =>
      field.value.trim().length > 0 &&
      (field.fieldType === "phone" || field.fieldType === "email"),
  );
}

export default async function AccessibilityPage() {
  const [statement, contact] = await Promise.all([
    getCachedAccessibility(),
    getCachedContactFields(),
  ]);
  const channels = contactChannels(contact);

  return (
    <StorefrontShell>
      <article className="mx-auto w-full max-w-3xl px-[var(--space-page)] py-8 sm:py-12">
        <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">הצהרת נגישות</h1>
        <p className="text-muted">תאריך עדכון: {statement.updatedLabel}</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold">התאמת האתר</h2>
          <p>
            אתר זה מוסר מידע על שירות החנות. אנו מנגישים אותו לפי תקן ישראלי ת״י 5568 חלק 1 ברמת
            AA, המבוסס על הנחיות WCAG 2.0 עם השינויים הלאומיים שפורסמו בספטמבר 2023.
          </p>
          <p>בין ההתאמות באתר:</p>
          <ul className="list-disc space-y-1 ps-5">
            <li>השפה העברית וכיוון הכתיבה מימין לשמאל מסומנים בדף.</li>
            <li>קישור לדילוג אל התוכן, כותרות היררכיות וניווט שאפשר להפעיל במקלדת.</li>
            <li>מוקד מקלדת גלוי, תוויות לשדות, וטקסט חלופי לתמונות שמוסרות מידע.</li>
            <li>קישורים בתוך טקסט מסומנים בקו תחתון, ומחיר אחרי הנחה מפורש במילים.</li>
            <li>מצגת התמונות בדף הבית ניתנת לעצירה, ועוצרת כשמבוקשת הפחתת תנועה.</li>
          </ul>
          <p>
            באתר אין כרגע סרטונים או מסמכים להורדה. אם יתווסף סרטון עם פסקול, נלווה אליו כתוביות
            וחלופה טקסטואלית או תיאור קולי.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold">נגישות החנות</h2>
          {statement.premisesAccessibility ? (
            <p className="whitespace-pre-line">{statement.premisesAccessibility}</p>
          ) : (
            <p>
              פירוט התאמות הנגישות במקום הפיזי טרם פורסם. אפשר לבקש את המידע בפנייה בנושא נגישות,
              ונמסור אותו בטלפון או בדוא״ל.
            </p>
          )}
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-2xl font-semibold">פנייה בנושא נגישות</h2>
          <p>
            אפשר לפנות כדי לדווח על היעדר התאמה, לבקש תיקון, או לבקש הנגשה של מידע ושירות. פנייה
            כזו כוללת גם דרישה לפי תקנה 35א(ד) לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
            נגישות לשירות), התשע״ג-2013.
          </p>
          {statement.contactName ? (
            <p>
              איש הקשר לפניות נגישות: <span className="font-medium">{statement.contactName}</span>
            </p>
          ) : (
            <p>פניות נגישות מתקבלות בדרכי ההתקשרות של החנות.</p>
          )}
          {channels.length > 0 ? (
            <ul className="space-y-2">
              {channels.map((field) => (
                <li key={field.fieldKey}>
                  <span className="font-medium">{field.label}: </span>
                  {field.fieldType === "email" ? (
                    <a className="text-link" href={`mailto:${field.value}`}>
                      {field.value}
                    </a>
                  ) : (
                    <a className="text-link" href={`tel:${field.value}`}>
                      {field.value}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>פרטי הטלפון והדוא״ל יפורסמו כאן לאחר עדכונם בפרטי הקשר של החנות.</p>
          )}
          <p>
            נטפל בפנייה בתוך זמן סביר ולא יאוחר מ-60 ימים מיום קבלתה. עד להשלמת התיקון נציע דרך
            חלופית לקבל את המידע או את השירות.
          </p>
        </section>

        {statement.coordinatorAppointed ? (
          <section className="mt-8 space-y-3">
            <h2 className="text-2xl font-semibold">רכז נגישות</h2>
            <p>
              {statement.contactName
                ? `רכז הנגישות הוא ${statement.contactName}.`
                : "מונה רכז נגישות לעסק."}{" "}
              פנייה אל הרכז מתבצעת בדרכי ההתקשרות שלמעלה.
            </p>
          </section>
        ) : null}
      </article>
    </StorefrontShell>
  );
}
