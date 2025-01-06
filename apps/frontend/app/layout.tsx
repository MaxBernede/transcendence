"use client";

import { queryClient, trpc, trpcClient } from "./lib/trpc";
import "./globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ModeToggle />
              {children}
            </ThemeProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </body>
    </html>
  );
}

// import "./globals.css";
// import { ThemeProvider } from "@/components/theme-provider";
// import React from "react";
// import { ReactNode } from "react"; // Import ReactNode
// import { ModeToggle } from "@/components/mode-toggle";

// import { trpc, queryClient, trpcClient } from "./lib/trpc";
// import { QueryClientProvider } from "@tanstack/react-query";

// export default function RootLayout({ children }: { children: ReactNode }) {
//   return (
//     <>
//       <html lang="en" suppressHydrationWarning>
//         <head />
//         <body>
//           <ThemeProvider
//             attribute="class"
//             defaultTheme="system"
//             enableSystem
//             disableTransitionOnChange
//           >
//             <ModeToggle />
//             <trpc.Provider queryClient={queryClient} client={trpcClient}>
//               <QueryClientProvider client={queryClient}>
//                 {children}
//               </QueryClientProvider>
//             </trpc.Provider>
//           </ThemeProvider>
//         </body>
//       </html>
//     </>
//   );
// }
