import { z } from 'zod';

export const usersSchema = z.object({
  id: z.number(),
  username: z.string(),
});

export type User = z.infer<typeof usersSchema>;

export const createUsersSchema = z
  .object({
    username: z.string(),
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CreateUser = z.infer<typeof createUsersSchema>;
