import type { Metadata } from "next";
import { JetBrains_Mono, Nunito, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const DESCRIPTION =
  "Upload one certificate template and a list of names, position the name on the page, then download a ZIP of hundreds of personalised certificates as PDFs. Everything runs in your browser, so no file ever reaches a server.";

export const metadata: Metadata = {
  title: "Veni, bulk certificate generator",
  description: DESCRIPTION,
  openGraph: {
    siteName: "Veni",
    title: "Veni, bulk certificate generator",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "Veni, bulk certificate generator",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        outfit.variable,
        nunito.variable,
        jetbrainsMono.variable,
      )}
    >
      <body
        className={cn(
          "flex min-h-full flex-col",
          "selection:bg-primary selection:text-primary-foreground",
        )}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
