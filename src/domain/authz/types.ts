export const USER_ROLES = ["ADMIN", "CUSTOMER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthProfile = {
  userId: string;
  role: UserRole;
  mustChangePassword: boolean;
};
