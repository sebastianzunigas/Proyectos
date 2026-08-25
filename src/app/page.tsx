"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useERP } from "@/context/erp-context";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  DollarSign,
  Users,
  Layers,
  Database,
  Plus
} from "lucide-react";

export default function DashboardPage() {
  const { productos, ventas, empresa, cargando, inicializarBaseDeDatos } = useERP();
  const [initStatus, setInitStatus] = useState<string | null>(null);

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: empresa?.moneda || "CLP" }).format(monto);
  };

  // KPIs
  const hoy = new Date().toISOString().slice(0, 10);
  const ventasHoy = ventas.filter(v => v.created_at?.startsWith(hoy) && v.estado === 'COMPLETADA');
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);

  const totalHistorico = ventas.filter(v => v.estado === 'COMPLETADA').reduce((acc, v) => acc + v.total, 0);
  const stockCritico = productos.filter(p => p.stock_actual <= p.stock_minimo);
  const valorTotalInventario = productos.reduce((acc, p) => acc + (p.stock_actual * p.precio_compra), 0);

  const handleInitDB = async () => {
    const res = await inicializarBaseDeDatos();
    if (res.success) {
      setInitStatus("¡Base de datos Turso inicializada y lista!");
    } else {
      setInitStatus(`Error: ${res.error}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Panel de Control • {empresa?.nombre || "Nexus ERP"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Resumen en vivo de ventas, inventario y métricas en tu nube de Turso.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ventas/nueva"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Abrir POS Caja</span>
          </Link>
          <Link
            href="/productos"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Banner de Primera Conexión Turso si no hay datos */}
      {productos.length === 0 && !cargando && (
        <div className="p-5 bg-blue-950/60 border border-blue-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="text-white font-bold text-base">¿Tu base de datos Turso está vacía?</h3>
              <p className="text-blue-200 text-sm">
                Inicializa las tablas y categorías base con 1 clic para comenzar a operar.
              </p>
            </div>
          </div>
          <button
            onClick={handleInitDB}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg transition-all whitespace-nowrap"
          >
            Inicializar Tablas en Turso
          </button>
        </div>
      )}

      {initStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          {initStatus}
        </div>
      )}

      {/* Tarjetas de Métricas Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas de Hoy */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Ventas de Hoy</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{formatearDinero(totalHoy)}</div>
            <p className="text-xs text-slate-400 mt-1">{ventasHoy.length} transacciones registradas</p>
          </div>
        </div>

        {/* Total Histórico */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Ingresos Totales</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{formatearDinero(totalHistorico)}</div>
            <p className="text-xs text-slate-400 mt-1">{ventas.length} ventas completadas</p>
          </div>
        </div>

        {/* Catálogo y SKUs */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Catálogo Activo</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white">{productos.length} SKUs</div>
            <p className="text-xs text-slate-400 mt-1">Valorizado: {formatearDinero(valorTotalInventario)}</p>
          </div>
        </div>

        {/* Alerta de Stock Crítico */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Bajo Stock</span>
            <div className={`p-2 rounded-xl ${stockCritico.length > 0 ? "bg-rose-500/10 text-rose-400" : "bg-slate-800 text-slate-400"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${stockCritico.length > 0 ? "text-rose-400" : "text-slate-200"}`}>
              {stockCritico.length} productos
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {stockCritico.length > 0 ? "Requieren reposición urgente" : "Stock en niveles óptimos"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de 2 Columnas: Últimas Ventas y Alertas de Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Últimas Ventas (2 Columnas) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Últimas Transacciones POS</h2>
            </div>
            <Link href="/ventas" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
              Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800 mt-2">
            {ventas.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No hay ventas registradas aún. Abre el POS para realizar tu primera venta.
              </div>
            ) : (
              ventas.slice(0, 6).map((venta) => (
                <div key={venta.id} className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 font-mono font-bold text-xs flex items-center justify-center border border-blue-500/20">
                      #{venta.numero_folio}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {venta.cliente_nombre || "Cliente General"}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{new Date(venta.created_at).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                          {venta.metodo_pago}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">{formatearDinero(venta.total)}</div>
                    <div className="text-xs text-slate-500">{venta.detalles?.length || 1} ítems</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Productos Críticos / Reposición ROP */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Alertas de Stock</h2>
            </div>
            <Link href="/inventario" className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Kardex <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800 mt-2">
            {stockCritico.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                ✅ Todo el inventario está sobre los niveles mínimos.
              </div>
            ) : (
              stockCritico.slice(0, 6).map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-xl transition-colors">
                  <div className="pr-2">
                    <div className="text-sm font-medium text-white truncate max-w-[170px]">
                      {prod.nombre}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">SKU: {prod.sku}</div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                      {prod.stock_actual} / {prod.stock_minimo}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">mínimo: {prod.stock_minimo}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
