import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();
const publicProcedure = t.procedure;

const appRouter = t.router({
  auth: t.router({
    login: publicProcedure.input(z.object({
      username: z.string().nonempty(),
      password: z.string().nonempty(),
    })).output(z.object({
      message: z.string().nonempty(),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  users: t.router({
    getUserById: publicProcedure.input(z.object({ id: z.string().nonempty() })).output(z.object({
      id: z.number(),
      username: z.string(),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getUsersMe: publicProcedure.output(z.object({
      id: z.number(),
      username: z.string(),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getUserByUsername: publicProcedure.input(z.object({ username: z.string().nonempty() })).output(z.object({
      id: z.number(),
      username: z.string(),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    createUser: publicProcedure.input(z
      .object({
        username: z.string(),
        password: z.string(),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      })).output(z.object({
        id: z.number(),
        username: z.string(),
      })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  }),
  products: t.router({
    getProductById: publicProcedure.input(z.object({ id: z.string() })).output(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      details: z.object({
        description: z.string().optional(),
        rating: z.number().optional(),
      }),
    })).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    getAllProducts: publicProcedure.output(z.array(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      details: z.object({
        description: z.string().optional(),
        rating: z.number().optional(),
      }),
    }))).query(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    updateProduct: publicProcedure.input(z.object({
      id: z.string(),
      data: z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        details: z.object({
          description: z.string().optional(),
          rating: z.number().optional(),
        }),
      }).partial(),
    })).output(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      details: z.object({
        description: z.string().optional(),
        rating: z.number().optional(),
      }),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    createProduct: publicProcedure.input(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      details: z.object({
        description: z.string().optional(),
        rating: z.number().optional(),
      }),
    })).output(z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      details: z.object({
        description: z.string().optional(),
        rating: z.number().optional(),
      }),
    })).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any),
    deleteProduct: publicProcedure.input(z.object({ id: z.string() })).output(z.boolean()).mutation(async () => "PLACEHOLDER_DO_NOT_REMOVE" as any)
  })
});
export type AppRouter = typeof appRouter;

