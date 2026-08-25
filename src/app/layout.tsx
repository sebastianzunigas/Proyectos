import type { Metadata } from "next";
import "./globals.css";
import { ERPProvider } from "@/context/erp-context";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Nexus ERP - Sistema de Gestión y POS",
  description: "Sistema integral ERP, CRM, POS y Control de Inventario conectado a Turso Cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        <ERPProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </ERPProvider>
      </body>
    </html>
  );
}
