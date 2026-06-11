import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './components/providers/ThemeProvider';

export const metadata: Metadata = {
  title: 'Slate Board',
  description: 'An infinite canvas scratchpad for capturing thoughts, snippets, and notes. Open. Paste. Done.',
  keywords: ['notes', 'scratchpad', 'canvas', 'local-first', 'markdown'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#2c3e52" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#e8ebf0" media="(prefers-color-scheme: light)" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
