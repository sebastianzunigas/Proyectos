"use client";

import React, { useState, useEffect } from "react";
import { useERP } from "@/context/erp-context";
import { MovimientoInventario, Producto } from "@/types";
import BarcodeScanner from "@/components/pos/BarcodeScanner";
import {
  Layers,
  PlusCircle,
  Camera,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RefreshCw,
  X,
  Check
} from "lucide-react";

export default function InventarioPage() {
  const { productos, ajustarStock, recargarDatos, empresa } = useERP();
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [cargandoKardex, setCargandoKardex] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Modal de ajuste / recepción
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [tipoMovimiento, setTipoMovimiento] = useState<MovimientoInventario['tipo_movimiento']>("ENTRADA_COMPRA");
  const [cantidadAjuste, setCantidadAjuste] = useState<string>("10");
  const [motivoAjuste, setMotivoAjuste] = useState<string>("");
  const [mensaje, setMensaje] = useState<string | null>(null);

  const cargarMovimientos = async () => {
    try {
      setCargandoKardex(true);
      const res = await fetch("/api/inventario?limit=100");
      const data = await res.json();
      if (data.success) {
        setMovimientos(data.data || []);
      }
    } catch (err) {
      console.error("Error cargando Kardex:", err);
    } finally {
      setCargandoKardex(false);
    }
  };

  useEffect(() => {
    cargarMovimientos();
  }, []);

  const handleScanRecepcion = (code: string) => {
    const found = productos.find(p => p.codigo_barras === code || p.sku.toString() === code);
    if (found) {
      setProductoSeleccionado(found);
      setScannerOpen(false);
      setModalAjusteOpen(true);
    } else {
      alert(`Código "${code}" no encontrado en productos.`);
    }
  };

  const handleProcesarAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoSeleccionado || !cantidadAjuste) return;

    const cant = Number(cantidadAjuste);
    if (isNaN(cant) || cant <= 0) return;

    const ok = await ajustarStock(
      productoSeleccionado.id,
      tipoMovimiento,
      cant,
      motivoAjuste || `Recepción/Ajuste de ${cant} unidades`
    );

    if (ok) {
      await cargarMovimientos();
      setModalAjusteOpen(false);
      setProductoSeleccionado(null);
      setCantidadAjuste("10");
      setMotivoAjuste("");
      setMensaje("Movimiento registrado en Kardex exitosamente.");
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const movimientosFiltrados = movimientos.filter((m) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      (m.producto_nombre && m.producto_nombre.toLowerCase().includes(term)) ||
      (m.sku && m.sku.toString().includes(term)) ||
      m.tipo_movimiento.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Kardex de Inventario</h1>
            <p className="text-slate-400 text-sm">
              Registro histórico de entradas, salidas por ventas, mermas y recepciones de mercadería.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl border border-slate-700 text-sm font-medium transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Recepción por Escáner</span>
          </button>
          <button
            onClick={() => {
              setProductoSeleccionado(productos[0] || null);
              setModalAjusteOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ajustar Stock Manual</span>
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Barra de Filtro */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por producto, SKU o tipo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
          />
        </div>

        <button
          onClick={cargarMovimientos}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${cargandoKardex ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>

      {/* Tabla Kardex */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Fecha y Hora</th>
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Tipo Movimiento</th>
                <th className="px-5 py-4 text-center">Cantidad</th>
                <th className="px-5 py-4 text-center">Stock Antes</th>
                <th className="px-5 py-4 text-center">Stock Después</th>
                <th className="px-5 py-4">Motivo / Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {movimientosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No se registran movimientos en el Kardex.
                  </td>
                </tr>
              ) : (
                movimientosFiltrados.map((m) => {
                  const esEntrada = ["ENTRADA_COMPRA", "AJUSTE_POSITIVO", "DEVOLUCION_CLIENTE"].includes(m.tipo_movimiento);
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4 text-slate-400 text-xs font-mono">
                        {new Date(m.created_at).toLocaleString("es-CL")}
                      </td>
                      <td className="px-5 py-4 font-medium text-white">
                        <div>{m.producto_nombre || "Producto"}</div>
                        {m.sku && <span className="text-xs text-slate-500 font-mono">SKU: {m.sku}</span>}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                            esEntrada
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {esEntrada ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          <span>{m.tipo_movimiento}</span>
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-center font-bold font-mono text-base ${esEntrada ? "text-emerald-400" : "text-rose-400"}`}>
                        {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                      </td>
                      <td className="px-5 py-4 text-center font-mono text-slate-400">
                        {m.stock_anterior}
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-white">
                        {m.stock_nuevo}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 max-w-xs truncate">
                        {m.motivo || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Recepción / Ajuste */}
      {modalAjusteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Registrar Movimiento de Kardex
              </h3>
              <button onClick={() => setModalAjusteOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcesarAjuste} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Producto</label>
                <select
                  value={productoSeleccionado?.id || ""}
                  onChange={(e) => {
                    const p = productos.find(x => x.id === e.target.value);
                    setProductoSeleccionado(p || null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.sku} - {p.nombre} (Stock actual: {p.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Movimiento</label>
                <select
                  value={tipoMovimiento}
                  onChange={(e) => setTipoMovimiento(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ENTRADA_COMPRA">Entrada por Compra (Recepción Factura)</option>
                  <option value="AJUSTE_POSITIVO">Ajuste Positivo (+)</option>
                  <option value="AJUSTE_NEGATIVO">Ajuste Negativo (-)</option>
                  <option value="MERMA_DANADO">Merma o Daño (-)</option>
                  <option value="DEVOLUCION_PROVEEDOR">Devolución a Proveedor (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cantidad a Mover</label>
                <input
                  type="number"
                  min="1"
                  value={cantidadAjuste}
                  onChange={(e) => setCantidadAjuste(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Motivo / N° Guía o Factura</label>
                <input
                  type="text"
                  placeholder="Ej: Factura Proveedor N° 4589"
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAjusteOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/30"
                >
                  Registrar en Kardex
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escáner para Recepción */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onScan={handleScanRecepcion}
        onClose={() => setScannerOpen(false)}
      />
    </div>
  );
}
