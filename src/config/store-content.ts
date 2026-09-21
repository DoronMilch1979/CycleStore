export const STORE_STORY = `מרכז האופניים רמת ישי הוא חנות האופניים של הצפון: מכירה, תיקון ושדרוג תחת קורת גג אחת.

באולם התצוגה תמצאו אופניים לכל הגילאים — מאופני ילדים ו-BMX ועד אופני הרים, אופניים חשמליים ודגמים מקצועיים של מותגים כמו Giant, Focus ו-IRONHORSE. לצד האופניים יש אביזרים, ציוד היקפי, ביגוד ונעלי רכיבה.

החנות ממוקמת באזור התעשייה של רמת ישי, צמוד לנעלי הקיבוצים. אנחנו כאן גם לסדנה: תיקון, שדרוג וליווי אחרי הרכישה, לא רק למכירה.`;

export const STORE_HERO_ALT = "מרכז האופניים רמת ישי — אולם תצוגה וסדנת אופניים";

export const STORE_FACEBOOK_URL = "https://www.facebook.com/profile.php?id=100054554553973";

export const STORE_CONTACT_DEFAULTS = [
  {
    fieldKey: "address",
    fieldType: "address",
    label: "כתובת",
    value: "חורש האלונים, אזור התעשייה רמת ישי 3009503 (צמוד לנעלי הקיבוצים)",
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
