"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useERP } from "@/context/erp-context";
import { Venta } from "@/types";
import TicketModal from "@/components/pos/TicketModal";
import * as XLSX from "xlsx";
import {
  ShoppingBag,
  Search,
  Printer,
  Download,
  Eye,
  Plus,
  Calendar,
  DollarSign,
  CreditCard,
  X
} from "lucide-react";

export default function VentasHistoryPage() {
  const { ventas, empresa } = useERP();
  const [busqueda, setBusqueda] = useState("");
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: empresa?.moneda || "CLP" }).format(monto);
  };

  const ventasFiltradas = ventas.filter((v) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      v.numero_folio.toString().includes(term) ||
      (v.cliente_nombre && v.cliente_nombre.toLowerCase().includes(term)) ||
      v.metodo_pago.toLowerCase().includes(term)
    );
  });

  const exportarExcel = () => {
    const data = ventasFiltradas.map((v) => ({
      Folio: v.numero_folio,
      Fecha: new Date(v.created_at).toLocaleString("es-CL"),
      Cliente: v.cliente_nombre || "Cliente General",
      "Método de Pago": v.metodo_pago,
      Subtotal: v.subtotal,
      IVA: v.impuesto,
      Total: v.total,
      Estado: v.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");
    XLSX.writeFile(workbook, `Ventas_NexusERP_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const abrirTicket = (venta: Venta) => {
    setVentaSeleccionada(venta);
    setIsTicketOpen(true);
  };

  const verDetalle = (venta: Venta) => {
    setVentaSeleccionada(venta);
    setDetalleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de Ventas</h1>
            <p className="text-slate-400 text-sm">
              Consulta boletas emitidas, reimprime tickets y exporta reportes contables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>
          <Link
            href="/ventas/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Venta</span>
          </Link>
        </div>
      </div>

      {/* Filtro y Búsqueda */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 max-w-md">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Buscar por folio, cliente o método de pago..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Tabla de Ventas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Folio</th>
                <th className="px-5 py-4">Fecha y Hora</th>
                <th className="px-5 py-4">Cliente</th>
                <th className="px-5 py-4">Medio de Pago</th>
                <th className="px-5 py-4 text-right">Total</th>
                <th className="px-5 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No se encontraron transacciones.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-white">
                      #{v.numero_folio}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {new Date(v.created_at).toLocaleString("es-CL")}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-200">
                      {v.cliente_nombre || "Cliente General"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold uppercase text-slate-300">
                        {v.metodo_pago}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-emerald-400 text-base">
                      {formatearDinero(v.total)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => verDetalle(v)}
                          title="Ver Detalle"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => abrirTicket(v)}
                          title="Reimprimir Boleta"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Venta */}
      {detalleModalOpen && ventaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                Detalle de Venta #{ventaSeleccionada.numero_folio}
              </h3>
              <button
                onClick={() => setDetalleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl">
                <div>Fecha: {new Date(ventaSeleccionada.created_at).toLocaleString("es-CL")}</div>
                <div>Cliente: {ventaSeleccionada.cliente_nombre || "Cliente General"}</div>
                <div>Medio: {ventaSeleccionada.metodo_pago}</div>
                <div>Estado: {ventaSeleccionada.estado}</div>
              </div>

              <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto">
                {ventaSeleccionada.detalles?.map((d, i) => (
                  <div key={i} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold text-white">{d.producto_nombre || "Producto"}</div>
                      <div className="text-xs text-slate-400">
                        {d.cantidad} x {formatearDinero(d.precio_unitario)}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-400">
                      {formatearDinero(d.subtotal)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-base font-bold text-white">Total Pagado:</span>
                <span className="text-xl font-black text-emerald-400">
                  {formatearDinero(ventaSeleccionada.total)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setDetalleModalOpen(false);
                  setIsTicketOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Térmico Modal */}
      <TicketModal
        venta={ventaSeleccionada}
        empresa={empresa}
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
      />
    </div>
  );
}
