import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Slate Board",
  description:
    "An infinite canvas scratchpad for capturing thoughts, snippets, and notes. Open. Paste. Done.",
  keywords: ["notes", "scratchpad", "canvas", "local-first", "markdown"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", geist.variable)}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600&family=Inter:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="theme-color"
          content="#2c3e52"
          media="(prefers-color-scheme: dark)"
        />
        <meta
          name="theme-color"
          content="#e8ebf0"
          media="(prefers-color-scheme: light)"
        />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider delay={300}>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
