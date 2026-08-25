"use client";

import React, { useEffect, useState } from "react";
import { useERP } from "@/context/erp-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  BarChart3,
  Clock,
  TrendingUp,
  CreditCard,
  Package,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function AnaliticaHorariosPage() {
  const { empresa } = useERP();
  const [dataReporte, setDataReporte] = useState<any>(null);
  const [cargando, setCargando] = useState(true);

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: empresa?.moneda || "CLP" }).format(monto);
  };

  useEffect(() => {
    async function fetchReporte() {
      try {
        setCargando(true);
        const res = await fetch("/api/informes");
        const json = await res.json();
        if (json.success) {
          setDataReporte(json.data);
        }
      } catch (err) {
        console.error("Error al cargar analítica:", err);
      } finally {
        setCargando(false);
      }
    }
    fetchReporte();
  }, []);

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

  const horasData = dataReporte?.horas || [];
  const topProds = dataReporte?.top_productos || [];
  const metodosPago = dataReporte?.metodos_pago || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Analítica de Demanda y Horarios Punta</h1>
            <p className="text-slate-400 text-sm">
              Descubre las horas pico de tu negocio, los productos más vendidos y medios de pago preferidos.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Horas Punta (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white">Concurrencia y Ventas por Hora</h2>
            </div>
            <span className="text-xs text-slate-400">Total transacciones</span>
          </div>

          <div className="h-72 w-full mt-4">
            {horasData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm text-center">
                <Clock className="w-10 h-10 mb-2 text-slate-600 stroke-1" />
                <p>Sin suficientes ventas registradas para trazar horas punta.</p>
                <p className="text-xs text-slate-600">Las gráficas se generarán con las ventas del POS.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horasData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="hora" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#fff" }}
                    formatter={(value: any, name: any) => [name === "total_monto" ? formatearDinero(value) : value, name === "total_monto" ? "Monto Vendido" : "N° Ventas"]}
                  />
                  <Bar dataKey="cantidad_ventas" name="N° Ventas" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Métodos de Pago (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Métodos de Pago</h2>
            </div>
          </div>

          <div className="h-56 w-full flex items-center justify-center mt-2">
            {metodosPago.length === 0 ? (
              <div className="text-slate-500 text-xs text-center">Sin datos de cobros</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metodosPago}
                    dataKey="transacciones"
                    nameKey="metodo_pago"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={45}
                    paddingAngle={4}
                  >
                    {metodosPago.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800 text-xs">
            {metodosPago.map((m: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="truncate text-slate-300 font-semibold">{m.metodo_pago}:</span>
                <span className="text-slate-400 font-mono">{m.transacciones}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 Productos Más Vendidos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Top Productos Más Demandados</h2>
          </div>
          <span className="text-xs text-slate-400">Por unidades vendidas</span>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Ranking</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center">Unidades Vendidas</th>
                <th className="px-4 py-3 text-right">Recaudación Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {topProds.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Aún no hay suficientes ventas para calcular los productos más vendidos.
                  </td>
                </tr>
              ) : (
                topProds.map((prod: any, idx: number) => (
                  <tr key={prod.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {prod.nombre}
                      <span className="ml-2 text-xs text-slate-500 font-mono">SKU: {prod.sku}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-blue-400">
                      {prod.total_unidades} un.
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      {formatearDinero(prod.total_dinero)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
