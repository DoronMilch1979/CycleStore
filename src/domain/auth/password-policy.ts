import { AppError } from "@/lib/errors";

export const MIN_REPLACEMENT_PASSWORD_LENGTH = 12;

const HAS_LETTER = /\p{L}/u;
const HAS_NUMBER = /\d/;

export function validateReplacementPassword(
  password: string,
  options?: { username?: string; currentPassword?: string },
): void {
  if (password.length < MIN_REPLACEMENT_PASSWORD_LENGTH) {
    throw new AppError({
      code: "WEAK_PASSWORD",
      publicMessage: "הסיסמה החדשה חייבת להכיל לפחות 12 תווים.",
    });
  }
  if (password.length > 128) {
    throw new AppError({
      code: "WEAK_PASSWORD",
      publicMessage: "הסיסמה ארוכה מדי.",
    });
  }
  if (!HAS_LETTER.test(password) || !HAS_NUMBER.test(password)) {
    throw new AppError({
      code: "WEAK_PASSWORD",
      publicMessage: "הסיסמה החדשה חייבת לכלול אות ומספר.",
    });
  }
  if (options?.username && password.toLowerCase().includes(options.username.toLowerCase())) {
    throw new AppError({
      code: "WEAK_PASSWORD",
      publicMessage: "הסיסמה לא יכולה לכלול את שם המשתמש.",
    });
  }
  if (options?.currentPassword && password === options.currentPassword) {
    throw new AppError({
      code: "WEAK_PASSWORD",
      publicMessage: "הסיסמה החדשה חייבת להיות שונה מהסיסמה הנוכחית.",
    });
  }
}

export function passwordsMatch(password: string, confirmation: string): void {
  if (password !== confirmation) {
    throw new AppError({
      code: "PASSWORD_MISMATCH",
      publicMessage: "הסיסמה החדשה ואישור הסיסמה אינם תואמים.",
    });
  }
}
