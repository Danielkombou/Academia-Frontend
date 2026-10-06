"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children, ...props }: { children: ReactNode } & ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="veni-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
