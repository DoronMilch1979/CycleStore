export class AppError extends Error {
  readonly code: string;
  readonly httpStatus: number;
  readonly publicMessage: string;

  constructor(options: {
    code: string;
    publicMessage: string;
    httpStatus?: number;
    cause?: unknown;
  }) {
    super(options.publicMessage, { cause: options.cause });
    this.name = "AppError";
    this.code = options.code;
    this.publicMessage = options.publicMessage;
    this.httpStatus = options.httpStatus ?? 400;
  }
}

export const publicErrors = {
  generic: "אירעה שגיאה. נסו שוב מאוחר יותר.",
  unauthorized: "יש להתחבר כדי להמשיך.",
  forbidden: "אין הרשאה לבצע פעולה זו.",
  notFound: "הפריט המבוקש לא נמצא.",
  validation: "חלק מהפרטים אינם תקינים.",
  login: "שם המשתמש או הסיסמה שגויים.",
  rateLimited: "בוצעו יותר מדי ניסיונות. נסו שוב בעוד מספר דקות.",
  outOfStock: "הכמות המבוקשת אינה זמינה במלאי.",
  database: "השירות אינו זמין כרגע.",
} as const;

export function toPublicErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.publicMessage;
  }
  return publicErrors.generic;
}
