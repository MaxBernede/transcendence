import { z } from 'zod';

export const authSchema = z.object({
  id: z.number(),
  username: z.string(),
});

export type AuthLogin = z.infer<typeof authSchema>;
