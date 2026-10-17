import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceScope | B2B Inflation Monitor",
  description: "Monitor de inflación y divisas en tiempo real",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${GeistSans.className} antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
          {children}
      </body>
    </html>
  );
}