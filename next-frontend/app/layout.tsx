"use client";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { LoginButton } from "@/components/auth/intra-login";
import { UserComponent } from "@/components/auth/user";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex justify-end items-center p-4 space-x-4">
            {/* Left: Mode Toggle */}
            <ModeToggle />

            {/* Right: Login Button */}
            {/* <LoginButton /> */}
            <UserComponent />
          </div>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
