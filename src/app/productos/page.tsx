"use client";

import React, { useState, useMemo } from "react";
import { useERP } from "@/context/erp-context";
import { Producto } from "@/types";
import * as XLSX from "xlsx";
import {
  Package,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Percent,
  Layers,
  X,
  Check,
  AlertCircle
} from "lucide-react";

export default function ProductosPage() {
  const {
    productos,
    categorias,
    empresa,
    guardarProducto,
    eliminarProducto,
    generarSiguienteSKU,
    recargarDatos
  } = useERP();

  const [tab, setTab] = useState<"catalogo" | "categorias">("catalogo");
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");

  // Modales
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [productoEdit, setProductoEdit] = useState<Partial<Producto> | null>(null);
  const [porcentajeAjuste, setPorcentajeAjuste] = useState<string>("");
  const [mensaje, setMensaje] = useState<string | null>(null);

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: empresa?.moneda || "CLP" }).format(monto);
  };

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchCat = filtroCategoria === "todas" || p.categoria_id === filtroCategoria;
      if (!matchCat) return false;
      if (!busqueda) return true;
      const term = busqueda.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(term) ||
        p.sku.toString().includes(term) ||
        (p.codigo_barras && p.codigo_barras.includes(term))
      );
    });
  }, [productos, filtroCategoria, busqueda]);

  const abrirModalNuevo = () => {
    setProductoEdit({
      sku: generarSiguienteSKU(),
      nombre: "",
      categoria_id: categorias[0]?.id || "",
      precio_compra: 0,
      precio_venta: 0,
      stock_actual: 0,
      stock_minimo: 5,
      unidad_medida: "unidad"
    });
    setModalProductoOpen(true);
  };

  const abrirModalEditar = (prod: Producto) => {
    setProductoEdit(prod);
    setModalProductoOpen(true);
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoEdit?.nombre || !productoEdit.precio_venta) return;

    const ok = await guardarProducto(productoEdit);
    if (ok) {
      setModalProductoOpen(false);
      setProductoEdit(null);
      setMensaje("Producto guardado correctamente.");
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${nombre}"?`)) {
      const ok = await eliminarProducto(id);
      if (ok) {
        setMensaje("Producto eliminado.");
        setTimeout(() => setMensaje(null), 3000);
      }
    }
  };

  const handleAjusteMasivo = async (e: React.FormEvent) => {
    e.preventDefault();
    const pct = Number(porcentajeAjuste);
    if (isNaN(pct) || pct === 0) return;

    try {
      const res = await fetch("/api/productos/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porcentajeAjuste: pct })
      });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        setModalAjusteOpen(false);
        setPorcentajeAjuste("");
        setMensaje(`Precios actualizados en un ${pct}%.`);
        setTimeout(() => setMensaje(null), 3000);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportarExcel = () => {
    const data = productos.map((p) => ({
      SKU: p.sku,
      "Código de Barras": p.codigo_barras || "",
      Nombre: p.nombre,
      Categoría: p.categoria_nombre || "Sin Categoría",
      "Precio Compra": p.precio_compra,
      "Precio Venta": p.precio_venta,
      "Margen %": p.precio_compra > 0 ? Math.round(((p.precio_venta - p.precio_compra) / p.precio_compra) * 100) + "%" : "100%",
      "Stock Actual": p.stock_actual,
      "Stock Mínimo": p.stock_minimo,
      Unidad: p.unidad_medida,
      "Fecha Vencimiento": p.fecha_vencimiento || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
    XLSX.writeFile(workbook, `Catalogo_Productos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Catálogo de Productos</h1>
            <p className="text-slate-400 text-sm">
              Gestión centralizada de SKUs, precios, márgenes y categorías.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setModalAjusteOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 text-sm font-medium transition-all"
          >
            <Percent className="w-4 h-4" />
            <span>Ajuste Masivo %</span>
          </button>
          <button
            onClick={exportarExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Excel</span>
          </button>
          <button
            onClick={abrirModalNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {mensaje && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setTab("catalogo")}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 ${
            tab === "catalogo"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Catálogo General ({productos.length})
        </button>
        <button
          onClick={() => setTab("categorias")}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 ${
            tab === "categorias"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Departamentos & Categorías ({categorias.length})
        </button>
      </div>

      {tab === "catalogo" ? (
        <>
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex-1">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
              />
            </div>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tabla de Productos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4">SKU / Código</th>
                    <th className="px-5 py-4">Nombre</th>
                    <th className="px-5 py-4">Categoría</th>
                    <th className="px-5 py-4 text-right">P. Compra</th>
                    <th className="px-5 py-4 text-right">P. Venta</th>
                    <th className="px-5 py-4 text-center">Margen</th>
                    <th className="px-5 py-4 text-center">Stock Actual</th>
                    <th className="px-5 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                        No hay productos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map((p) => {
                      const margen = p.precio_compra > 0
                        ? Math.round(((p.precio_venta - p.precio_compra) / p.precio_compra) * 100)
                        : 100;
                      const esCritico = p.stock_actual <= p.stock_minimo;

                      return (
                        <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-white text-xs">
                            <div>#{p.sku}</div>
                            {p.codigo_barras && (
                              <div className="text-[10px] text-slate-400 font-normal">{p.codigo_barras}</div>
                            )}
                          </td>
                          <td className="px-5 py-4 font-medium text-white">
                            {p.nombre}
                            {p.fecha_vencimiento && (
                              <div className="text-[11px] text-amber-400 mt-0.5">
                                Vence: {p.fecha_vencimiento}
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-slate-300">
                              {p.categoria_nombre || "General"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right text-slate-400">
                            {formatearDinero(p.precio_compra)}
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-emerald-400 text-base">
                            {formatearDinero(p.precio_venta)}
                          </td>
                          <td className="px-5 py-4 text-center font-semibold text-xs text-blue-400">
                            {margen}%
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                esCritico
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-slate-800 text-slate-200"
                              }`}
                            >
                              {p.stock_actual} {p.unidad_medida}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => abrirModalEditar(p)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminar(p.id, p.nombre)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Pestaña de Categorías / Departamentos */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categorias.map((cat) => {
            const prodsCat = productos.filter((p) => p.categoria_id === cat.id);
            const stockTotal = prodsCat.reduce((acc, p) => acc + p.stock_actual, 0);
            const valorTotal = prodsCat.reduce((acc, p) => acc + (p.stock_actual * p.precio_venta), 0);

            return (
              <div
                key={cat.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#3B82F6' }}></span>
                    <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono">
                      {prodsCat.length} SKUs
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-3">{cat.nombre}</h3>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Stock Total:</span>
                    <div className="font-bold text-white text-sm">{stockTotal} un.</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Valor en Venta:</span>
                    <div className="font-bold text-emerald-400 text-sm">{formatearDinero(valorTotal)}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFiltroCategoria(cat.id);
                    setTab("catalogo");
                  }}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl text-xs font-semibold transition-colors"
                >
                  Ver Productos de {cat.nombre}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Producto */}
      {modalProductoOpen && productoEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {productoEdit.id ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button
                onClick={() => setModalProductoOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarProducto} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
                  <input
                    type="number"
                    value={productoEdit.sku || ""}
                    onChange={(e) => setProductoEdit({ ...productoEdit, sku: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    value={productoEdit.codigo_barras || ""}
                    onChange={(e) => setProductoEdit({ ...productoEdit, codigo_barras: e.target.value })}
                    placeholder="EAN-13 o similar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  value={productoEdit.nombre || ""}
                  onChange={(e) => setProductoEdit({ ...productoEdit, nombre: e.target.value })}
                  placeholder="Ej: Aceite de Oliva 1L"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Categoría</label>
                <select
                  value={productoEdit.categoria_id || ""}
                  onChange={(e) => setProductoEdit({ ...productoEdit, categoria_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Compra ($)</label>
                  <input
                    type="number"
                    value={productoEdit.precio_compra || 0}
                    onChange={(e) => setProductoEdit({ ...productoEdit, precio_compra: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    value={productoEdit.precio_venta || 0}
                    onChange={(e) => setProductoEdit({ ...productoEdit, precio_venta: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={productoEdit.stock_actual || 0}
                    onChange={(e) => setProductoEdit({ ...productoEdit, stock_actual: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={productoEdit.stock_minimo || 5}
                    onChange={(e) => setProductoEdit({ ...productoEdit, stock_minimo: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unidad</label>
                  <input
                    type="text"
                    value={productoEdit.unidad_medida || "unidad"}
                    onChange={(e) => setProductoEdit({ ...productoEdit, unidad_medida: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalProductoOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ajuste Masivo % */}
      {modalAjusteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-400" />
              Ajuste Masivo de Precios
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa el porcentaje a modificar en el precio de venta de todos los productos (ej: 10 para +10%, -5 para rebajar 5%).
            </p>

            <form onSubmit={handleAjusteMasivo} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Porcentaje %</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 8.5"
                  value={porcentajeAjuste}
                  onChange={(e) => setPorcentajeAjuste(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAjusteOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold"
                >
                  Aplicar a Todo el Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
