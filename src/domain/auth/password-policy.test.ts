import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import {
  passwordsMatch,
  validateReplacementPassword,
} from "@/domain/auth/password-policy";

describe("password policy", () => {
  it("requires a strong replacement password", () => {
    expect(() => validateReplacementPassword("123456")).toThrow(AppError);
    expect(() => validateReplacementPassword("passwordpassword")).toThrow(AppError);
    expect(() =>
      validateReplacementPassword("adminadmin12", { username: "admin" }),
    ).toThrow(AppError);
    expect(() =>
      validateReplacementPassword("ValidPassword1", { currentPassword: "ValidPassword1" }),
    ).toThrow(AppError);
    expect(() => validateReplacementPassword("ValidPassword1")).not.toThrow();
  });

  it("requires confirmation to match", () => {
    expect(() => passwordsMatch("ValidPassword1", "ValidPassword2")).toThrow(AppError);
    expect(() => passwordsMatch("ValidPassword1", "ValidPassword1")).not.toThrow();
  });
});
