"use client";

// import { AppRouter } from "@repo/trpc/router";
// import { QueryClient } from "@tanstack/react-query";
// import {
//   CreateTRPCReact,
//   createTRPCReact,
//   httpBatchLink,
//   httpLink,
// } from "@trpc/react-query";

// // if (!process.env.NEXT_PUBLIC_TRPC_URL) {
// //   throw new Error("NEXT_PUBLIC_TRPC_URL environment variable is not defined!");
// // }

// export const trpc: CreateTRPCReact<AppRouter, unknown, null> =
//   createTRPCReact<AppRouter>();

// export const queryClient = new QueryClient();

// export const trpcClient = trpc.createClient({
//   links: [
//     httpBatchLink({
//       url: process.env.NEXT_PUBLIC_TRPC_URL!,
//     }),
//   ],
// });

import { AppRouter } from "@repo/trpc/router";
import { QueryClient } from "@tanstack/react-query";
import {
  CreateTRPCReact,
  createTRPCReact,
  httpBatchLink,
} from "@trpc/react-query";

export const trpc: CreateTRPCReact<AppRouter, unknown, null> =
  createTRPCReact<AppRouter>();

export const queryClient = new QueryClient();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: process.env.NEXT_PUBLIC_TRPC_URL!,
    }),
  ],
});
