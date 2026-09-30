export const STORE_STORY = `מרכז האופניים רמת ישי הוא חנות האופניים של הצפון: מכירה, תיקון ושדרוג תחת קורת גג אחת.

באולם התצוגה תמצאו אופניים לכל הגילאים — מאופני ילדים ו-BMX ועד אופני הרים, אופניים חשמליים ודגמים מקצועיים של מותגים כמו Giant, Focus ו-IRONHORSE. לצד האופניים יש אביזרים, ציוד היקפי, ביגוד ונעלי רכיבה.

החנות ממוקמת באזור התעשייה של רמת ישי, צמוד לנעלי הקיבוצים. אנחנו כאן גם לסדנה: תיקון, שדרוג וליווי אחרי הרכישה, לא רק למכירה.`;

export const STORE_HERO_ALT = "מרכז האופניים רמת ישי — אולם תצוגה וסדנת אופניים";

export const STORE_FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=100054554553973";

export const STORE_MAPS_URL = "https://maps.app.goo.gl/4UE2DzU8t2Zh2wzQ8";

export function isGoogleMapsShortLink(value: string) {
  return /^https:\/\/maps\.app\.goo\.gl\/[A-Za-z0-9_-]+$/.test(value.trim());
}

export const CONTACT_FIELD_TYPES = [
  { value: "text", label: "טקסט" },
  { value: "address", label: "כתובת" },
  { value: "phone", label: "טלפון" },
  { value: "email", label: "דוא״ל" },
  { value: "whatsapp", label: "וואטסאפ" },
  { value: "url", label: "קישור" },
  { value: "facebook", label: "פייסבוק" },
  { value: "hours", label: "שעות פתיחה" },
] as const;

const SOCIAL_CONTACT_TYPES = ["facebook", "whatsapp"] as const;

export type SocialContactType = (typeof SOCIAL_CONTACT_TYPES)[number];

export const SELECTABLE_CONTACT_FIELD_TYPES = CONTACT_FIELD_TYPES.filter(
  (type) => type.value !== "facebook" && type.value !== "whatsapp",
);

export function socialContactType(field: {
  fieldKey: string;
  fieldType: string;
}): SocialContactType | null {
  if (field.fieldKey === "facebook" || field.fieldKey === "whatsapp")
    return field.fieldKey;
  if (field.fieldType === "facebook" || field.fieldType === "whatsapp")
    return field.fieldType;
  return null;
}

export function contactFieldTypeLabel(fieldType: string) {
  return CONTACT_FIELD_TYPES.find((type) => type.value === fieldType)?.label ?? fieldType;
}

export const STORE_CONTACT_DEFAULTS = [
  {
    fieldKey: "address",
    fieldType: "address",
    label: "כתובת",
    value: "חורש האלונים, אזור התעשייה רמת ישי 3009503 (צמוד לנעלי הקיבוצים)",
    linkUrl: STORE_MAPS_URL,
    sortOrder: 10,
  },
  {
    fieldKey: "phone",
    fieldType: "phone",
    label: "טלפון",
    value: "04-9837767",
    sortOrder: 20,
  },
  {
    fieldKey: "phone-alt",
    fieldType: "phone",
    label: "טלפון נוסף",
    value: "04-9837760",
    sortOrder: 25,
  },
  {
    fieldKey: "hours",
    fieldType: "hours",
    label: "שעות פתיחה",
    value: "א׳–ה׳ 08:00–19:00\nו׳ 08:00–14:00\nשבת סגור",
    sortOrder: 30,
  },
  {
    fieldKey: "facebook",
    fieldType: "facebook",
    label: "פייסבוק",
    value: STORE_FACEBOOK_URL,
    sortOrder: 40,
  },
  {
    fieldKey: "email",
    fieldType: "email",
    label: "דוא״ל",
    value: "",
    sortOrder: 50,
    isActive: false,
  },
  {
    fieldKey: "whatsapp",
    fieldType: "whatsapp",
    label: "וואטסאפ",
    value: "",
    sortOrder: 60,
    isActive: false,
  },
] as const;
