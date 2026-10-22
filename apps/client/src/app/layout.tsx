import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export const metadata: Metadata = {
  title: "PriceScope | B2B Inflation Monitor",
  description: "Monitor de inflación y divisas en tiempo real para retail",
};

/**
 * Layout raíz de la aplicación Next.js con proveedor de estado del menú lateral y estructura de navegación.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${GeistSans.className} flex h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased`}
      >
        <SidebarProvider>
          {/* Sidebar Fijo Institucional Slate-900 Colapsable */}
          <Sidebar />

          {/* Contenido Principal con Header y Scroll Interior */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <Header />
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
