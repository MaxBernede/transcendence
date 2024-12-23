import { z } from "zod";

export const RegisterSchema = z
  .object({
    username: z.string().nonempty({ message: "Username is required" }),
    password: z
      .string()
      .min(1, { message: "Password must be at least 1 character long" })
      .max(64, { message: "Password cannot be longer than 64 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm password is required" })
      .max(64, {
        message: "Confirm password cannot be longer than 64 characters",
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  username: z.string().nonempty({ message: "Username is required" }),
  password: z
    .string()
    .min(1)
    .max(64, { message: "Password must be at least 1 character long" }),
});
