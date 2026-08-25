"use client";

import React, { useState } from "react";
import { useERP } from "@/context/erp-context";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Settings,
  Building,
  UploadCloud,
  Database,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  CloudCheck
} from "lucide-react";

export default function ConfiguracionPage() {
  const {
    empresa,
    actualizarEmpresa,
    inicializarBaseDeDatos,
    recargarDatos
  } = useERP();

  const [formEmpresa, setFormEmpresa] = useState({
    nombre: empresa?.nombre || "Mi Negocio Nexus",
    rut_identificador: empresa?.rut_identificador || "76.123.456-7",
    telefono: empresa?.telefono || "+56 9 1234 5678",
    email: empresa?.email || "contacto@minegocio.cl",
    direccion: empresa?.direccion || "Av. Principal #123",
    moneda: empresa?.moneda || "CLP",
    iva_porcentaje: empresa?.iva_porcentaje || 19.0,
  });

  const [archivoCargando, setArchivoCargando] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleGuardarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await actualizarEmpresa(formEmpresa);
    if (ok) {
      setDbStatus("Datos de la empresa guardados correctamente.");
      setTimeout(() => setDbStatus(null), 3000);
    }
  };

  // Carga Masiva de Archivo CSV o Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoCargando(true);
    setImportStatus(null);

    const fileExt = file.name.split(".").pop()?.toLowerCase();

    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await procesarProductosImportados(results.data);
        },
        error: (err) => {
          setImportStatus(`Error al leer CSV: ${err.message}`);
          setArchivoCargando(false);
        }
      });
    } else if (fileExt === "xlsx" || fileExt === "xls") {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          await procesarProductosImportados(data);
        } catch (err: any) {
          setImportStatus(`Error al procesar Excel: ${err.message}`);
          setArchivoCargando(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setImportStatus("Formato no soportado. Debe ser un archivo .CSV o .XLSX");
      setArchivoCargando(false);
    }
  };

  const procesarProductosImportados = async (rows: any[]) => {
    try {
      const productosNormalizados = rows.map((r, i) => ({
        sku: Number(r.sku || r.SKU || r.codigo || r.Codigo) || undefined,
        codigo_barras: (r.codigo_barras || r.CodigoBarras || r.barcode || r.sku || "").toString().trim(),
        nombre: (r.nombre || r.Nombre || r.producto || r.Producto || `Producto ${i + 1}`).toString().trim(),
        precio_compra: Number(r.precio_compra || r.costo || r.PrecioCompra || 0),
        precio_venta: Number(r.precio_venta || r.precio || r.PrecioVenta || 1000),
        stock_actual: Number(r.stock_actual || r.stock || r.Stock || 10),
        stock_minimo: Number(r.stock_minimo || r.StockMinimo || 5),
        unidad_medida: (r.unidad || r.unidad_medida || "unidad").toString().trim(),
        categoria_id: "cat_abarrotes"
      }));

      const res = await fetch("/api/productos/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: productosNormalizados })
      });
      const data = await res.json();

      if (data.success) {
        await recargarDatos();
        setImportStatus(`✅ ${data.message}`);
      } else {
        setImportStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setImportStatus(`❌ Error de conexión: ${err.message}`);
    } finally {
      setArchivoCargando(false);
    }
  };

  // Inicializar tablas en Turso
  const handleInitDB = async () => {
    const res = await inicializarBaseDeDatos();
    if (res.success) {
      setDbStatus("✅ Tablas creadas e inicializadas en Turso.");
    } else {
      setDbStatus(`❌ Error: ${res.error}`);
    }
  };

  // Sembrar datos de prueba
  const handleSembrarDemo = async () => {
    try {
      setIsSeeding(true);
      const demoItems = [
        { sku: 1001, nombre: "Torta Tres Leches (Porción)", precio_compra: 1400, precio_venta: 3500, stock_actual: 15, stock_minimo: 4, categoria_id: "cat_pasteleria", unidad_medida: "porción" },
        { sku: 1002, nombre: "Pie de Limón Merengue (Porción)", precio_compra: 1100, precio_venta: 2800, stock_actual: 12, stock_minimo: 3, categoria_id: "cat_pasteleria", unidad_medida: "porción" },
        { sku: 1003, nombre: "Empanada de Pino al Horno", precio_compra: 1200, precio_venta: 2600, stock_actual: 24, stock_minimo: 5, categoria_id: "cat_pasteleria", unidad_medida: "unidad" },
        { sku: 1004, nombre: "Bebida Coca Cola 1.5L Original", precio_compra: 1300, precio_venta: 2100, stock_actual: 30, stock_minimo: 8, categoria_id: "cat_bebidas", unidad_medida: "botella" },
        { sku: 1005, nombre: "Jugo Néctar Andina 1.5L Durazno", precio_compra: 1050, precio_venta: 1750, stock_actual: 20, stock_minimo: 6, categoria_id: "cat_bebidas", unidad_medida: "botella" },
        { sku: 1006, nombre: "Leche Entera Colun 1L Tetra", precio_compra: 850, precio_venta: 1290, stock_actual: 40, stock_minimo: 10, categoria_id: "cat_lacteos", unidad_medida: "unidad" },
        { sku: 1007, nombre: "Queso Gauda Laminado 250g", precio_compra: 1900, precio_venta: 2890, stock_actual: 18, stock_minimo: 4, categoria_id: "cat_lacteos", unidad_medida: "unidad" },
        { sku: 1008, nombre: "Papas Fritas Lays 250g", precio_compra: 1500, precio_venta: 2490, stock_actual: 25, stock_minimo: 5, categoria_id: "cat_snacks", unidad_medida: "unidad" },
        { sku: 1009, nombre: "Aceite Vegetal Belmont 900ml", precio_compra: 1450, precio_venta: 2190, stock_actual: 35, stock_minimo: 10, categoria_id: "cat_abarrotes", unidad_medida: "botella" },
        { sku: 1010, nombre: "Detergente Omo Polvo 800g", precio_compra: 1800, precio_venta: 2790, stock_actual: 14, stock_minimo: 4, categoria_id: "cat_limpieza", unidad_medida: "unidad" }
      ];

      const res = await fetch("/api/productos/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productos: demoItems })
      });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        setDbStatus("✅ 10 productos demo cargados en tu base de datos Turso.");
      }
    } catch (err: any) {
      setDbStatus(`❌ Error: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // Resetear base de datos
  const handleReset = async (action: string) => {
    if (confirm("⚠️ ¿Estás seguro? Esta acción borrará registros de tu base de datos Turso.")) {
      try {
        const res = await fetch(`/api/configuracion?action=${action}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          await recargarDatos();
          setDbStatus("✅ Base de datos reseteada.");
        }
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Configuración del Sistema</h1>
            <p className="text-slate-400 text-sm">
              Datos comerciales, importador masivo CSV/Excel y mantenimiento de Turso Cloud.
            </p>
          </div>
        </div>
      </div>

      {dbStatus && (
        <div className="p-4 bg-slate-900 border border-blue-500/40 rounded-2xl text-blue-300 text-sm flex items-center gap-2">
          <span>{dbStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Datos del Negocio */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
            <Building className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">Datos de tu Empresa / Negocio</h2>
          </div>

          <form onSubmit={handleGuardarEmpresa} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Comercial</label>
              <input
                type="text"
                value={formEmpresa.nombre}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, nombre: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">RUT / Identificador</label>
                <input
                  type="text"
                  value={formEmpresa.rut_identificador}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, rut_identificador: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formEmpresa.telefono}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, telefono: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formEmpresa.email}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Moneda</label>
                <input
                  type="text"
                  value={formEmpresa.moneda}
                  onChange={(e) => setFormEmpresa({ ...formEmpresa, moneda: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección Comercial</label>
              <input
                type="text"
                value={formEmpresa.direccion}
                onChange={(e) => setFormEmpresa({ ...formEmpresa, direccion: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-600/30"
              >
                Guardar Cambios de Empresa
              </button>
            </div>
          </form>
        </div>

        {/* 2. Carga Masiva CSV / Excel */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Importación Masiva de Catálogo</h2>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Sube un archivo **CSV o Excel (.xlsx)** con las columnas: <br/>
              <code className="text-blue-300 bg-slate-950 px-1.5 py-0.5 rounded text-[11px]">
                sku, nombre, precio_compra, precio_venta, stock_actual, codigo_barras
              </code>
            </p>

            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition-all">
              <UploadCloud className="w-10 h-10 text-emerald-400 mb-2 stroke-1" />
              <span className="text-sm font-semibold text-white">
                {archivoCargando ? "Procesando productos..." : "Seleccionar archivo CSV o Excel"}
              </span>
              <span className="text-xs text-slate-500 mt-1">Arrastra aquí o haz clic para buscar</span>
              <input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
                disabled={archivoCargando}
                className="hidden"
              />
            </label>

            {importStatus && (
              <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                {importStatus}
              </div>
            )}
          </div>
        </div>

        {/* 3. Herramientas de Base de Datos Turso */}
        <div className="col-span-full bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
            <Database className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Herramientas de Base de Datos Turso Cloud</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Inicializar Tablas */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Inicializar Esquema</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Crea las tablas, índices y categorías maestras en tu base de datos de Turso.
                </p>
              </div>
              <button
                onClick={handleInitDB}
                className="mt-4 w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                Crear Tablas en Turso
              </button>
            </div>

            {/* Sembrar Productos Demo */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">Cargar Productos Demo</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Inserta 10 productos de prueba de minimarket/pastelería para probar el POS de inmediato.
                </p>
              </div>
              <button
                onClick={handleSembrarDemo}
                disabled={isSeeding}
                className="mt-4 w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeeding ? "Insertando..." : "Sembrar 10 Productos"}</span>
              </button>
            </div>

            {/* Vaciar / Resetear */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-rose-400 text-sm">Zona de Peligro (Reset)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Borra todos los productos, ventas y movimientos para empezar desde cero.
                </p>
              </div>
              <button
                onClick={() => handleReset("reset_todo")}
                className="mt-4 w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Resetear Todo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
