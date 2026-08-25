"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useERP } from "@/context/erp-context";
import {
  ShoppingBag,
  ShoppingCart,
  Package,
  Layers,
  Users,
  Truck,
  BarChart3,
  Settings,
  RefreshCw,
  Database,
  AlertTriangle
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { productos, recargarDatos, cargando, empresa } = useERP();

  const stockCriticoCount = productos.filter(p => p.stock_actual <= p.stock_minimo).length;

  const links = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/ventas/nueva", label: "POS Caja", icon: ShoppingCart, highlight: true },
    { href: "/ventas", label: "Ventas", icon: ShoppingBag },
    { href: "/productos", label: "Productos", icon: Package },
    { href: "/inventario", label: "Kardex", icon: Layers, badge: stockCriticoCount > 0 ? stockCriticoCount : undefined },
    { href: "/clientes", label: "Clientes", icon: Users },
    { href: "/proveedores", label: "Proveedores", icon: Truck },
    { href: "/analitica/horarios", label: "Analítica", icon: BarChart3 },
    { href: "/configuracion", label: "Configuración", icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Nombre de Empresa */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
              N
            </div>
            <div>
              <Link href="/" className="font-bold text-lg text-white hover:text-blue-400 transition-colors">
                {empresa?.nombre || "Nexus ERP"}
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Turso Cloud Conectado</span>
              </div>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    link.highlight
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30"
                      : isActive
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-rose-500 text-white rounded-full font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Acciones de la barra */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => recargarDatos()}
              disabled={cargando}
              title="Sincronizar datos con Turso"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin text-blue-400" : ""}`} />
            </button>
            {stockCriticoCount > 0 && (
              <Link
                href="/inventario"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{stockCriticoCount} bajo stock</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Barra de navegación móvil inferior o scroll */}
      <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800 gap-1 bg-slate-900/90 backdrop-blur">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium ${
                isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
