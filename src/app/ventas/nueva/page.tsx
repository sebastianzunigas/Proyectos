"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useERP } from "@/context/erp-context";
import { Producto, Venta, Cliente } from "@/types";
import BarcodeScanner from "@/components/pos/BarcodeScanner";
import TicketModal from "@/components/pos/TicketModal";
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Camera,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Package
} from "lucide-react";

export default function POSPage() {
  const {
    productos,
    categorias,
    clientes,
    empresa,
    carrito,
    clienteSeleccionado,
    agregarAlCarrito,
    eliminarDelCarrito,
    actualizarCantidadCarrito,
    vaciarCarrito,
    setClienteSeleccionado,
    procesarVenta
  } = useERP();

  // Estados de interfaz POS
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState<string>("todas");
  const [metodoPago, setMetodoPago] = useState<Venta['metodo_pago']>("EFECTIVO");
  const [montoEfectivo, setMontoEfectivo] = useState<string>("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ultimaVenta, setUltimaVenta] = useState<Venta | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [errorVenta, setErrorVenta] = useState<string | null>(null);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);

  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Helper formatear moneda
  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: empresa?.moneda || "CLP" }).format(monto);
  };

  // 1. Hardware Scanner Listener (Pistolas de código de barras USB/Bluetooth/Wi-Fi)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo dentro de un input de texto
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTimeRef.current > 350) {
        barcodeBufferRef.current = "";
      }
      lastKeyTimeRef.current = currentTime;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length > 2) {
          const scannedCode = barcodeBufferRef.current.trim();
          handleScannedBarcode(scannedCode);
          barcodeBufferRef.current = "";
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [productos]);

  const handleScannedBarcode = (code: string) => {
    const found = productos.find(
      p => p.codigo_barras === code || p.sku.toString() === code
    );
    if (found) {
      agregarAlCarrito(found, 1);
    } else {
      setErrorVenta(`Código "${code}" no encontrado en el catálogo.`);
      setTimeout(() => setErrorVenta(null), 3000);
    }
  };

  // Filtro predictivo de productos
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const matchCat = categoriaActiva === "todas" || p.categoria_id === categoriaActiva;
      if (!matchCat) return false;

      if (!busqueda.trim()) return true;
      const terms = busqueda.toLowerCase().split(" ").filter(Boolean);
      const targetText = `${p.nombre} ${p.sku} ${p.codigo_barras || ""}`.toLowerCase();
      return terms.every(term => targetText.includes(term));
    });
  }, [productos, categoriaActiva, busqueda]);

  // Totales
  const totalCarrito = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const totalItemsCount = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  const montoRecibidoNum = Number(montoEfectivo) || totalCarrito;
  const vueltoCalculado = Math.max(0, montoRecibidoNum - totalCarrito);

  // Manejar cobro
  const handleConfirmarVenta = async () => {
    if (carrito.length === 0) return;
    if (metodoPago === "EFECTIVO" && montoEfectivo && Number(montoEfectivo) < totalCarrito) {
      setErrorVenta("El monto en efectivo ingresado es menor al total.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorVenta(null);

      const res = await procesarVenta(
        metodoPago,
        metodoPago === "EFECTIVO" ? (Number(montoEfectivo) || totalCarrito) : totalCarrito,
        metodoPago === "EFECTIVO" ? vueltoCalculado : 0
      );

      if (res.success && res.data) {
        // Armar objeto venta para el ticket
        const ventaFinal: Venta = {
          id: res.data.id,
          numero_folio: res.data.numero_folio,
          cliente_nombre: clienteSeleccionado?.nombre,
          subtotal: res.data.subtotal,
          impuesto: res.data.impuesto,
          total: res.data.total,
          metodo_pago: metodoPago,
          monto_recibido: res.data.monto_recibido,
          vuelto: res.data.vuelto,
          estado: 'COMPLETADA',
          created_at: new Date().toISOString(),
          detalles: carrito.map(i => ({
            producto_id: i.producto.id,
            producto_nombre: i.producto.nombre,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
            costo_unitario: i.producto.precio_compra,
            subtotal: i.subtotal
          }))
        };

        setUltimaVenta(ventaFinal);
        vaciarCarrito();
        setMontoEfectivo("");
        setIsTicketOpen(true);
      } else {
        setErrorVenta(res.error || "Error al procesar la venta.");
      }
    } catch (err: any) {
      setErrorVenta(err.message || "Error al procesar la venta.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-7.5rem)] min-h-[600px]">
      {/* Columna Izquierda: Catálogo & Búsqueda (60-65% ancho) */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Barra superior de búsqueda y cámara */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-medium text-sm transition-all shadow-sm"
            title="Escanear con cámara"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Cámara</span>
          </button>
        </div>

        {/* Pestañas de categorías */}
        <div className="flex overflow-x-auto p-2 border-b border-slate-800 gap-1.5 bg-slate-950/40 no-scrollbar">
          <button
            onClick={() => setCategoriaActiva("todas")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              categoriaActiva === "todas"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Todas ({productos.length})
          </button>
          {categorias.map((cat) => {
            const count = productos.filter(p => p.categoria_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  categoriaActiva === cat.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {cat.nombre} ({count})
              </button>
            );
          })}
        </div>

        {/* Cuadrícula táctil de productos */}
        <div className="flex-1 overflow-y-auto p-4">
          {productosFiltrados.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
              <Package className="w-12 h-12 mb-2 text-slate-600 stroke-1" />
              <p className="text-sm font-medium">No se encontraron productos</p>
              <p className="text-xs text-slate-600 mt-1">Prueba con otro término o categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {productosFiltrados.map((prod) => {
                const enCarrito = carrito.find(i => i.producto.id === prod.id);
                const sinStock = prod.stock_actual <= 0;

                return (
                  <button
                    key={prod.id}
                    onClick={() => agregarAlCarrito(prod, 1)}
                    className={`relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
                      enCarrito
                        ? "bg-blue-950/40 border-blue-500/50 shadow-md shadow-blue-500/10"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Badge de cantidad si está en carrito */}
                    {enCarrito && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-blue-500 text-white font-bold text-xs rounded-full">
                        {enCarrito.cantidad}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>SKU: {prod.sku}</span>
                        <span className={prod.stock_actual <= prod.stock_minimo ? "text-amber-400 font-bold" : ""}>
                          Stock: {prod.stock_actual}
                        </span>
                      </div>
                      <h4 className="font-semibold text-white text-sm line-clamp-2 mt-1">
                        {prod.nombre}
                      </h4>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-emerald-400 font-bold text-base">
                        {formatearDinero(prod.precio_venta)}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-blue-600 hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Carrito & Cobro (35-40% ancho) */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Header del carrito */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            <span>Ticket de Venta</span>
            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded-full">
              {totalItemsCount} items
            </span>
          </div>

          {carrito.length > 0 && (
            <button
              onClick={vaciarCarrito}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Vaciar
            </button>
          )}
        </div>

        {/* Selector de Cliente */}
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
            <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span className="truncate">
              {clienteSeleccionado ? clienteSeleccionado.nombre : "Cliente General (Boleta)"}
            </span>
          </div>
          <button
            onClick={() => setClienteModalOpen(true)}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex-shrink-0 ml-2"
          >
            {clienteSeleccionado ? "Cambiar" : "+ Asignar"}
          </button>
        </div>

        {/* Lista de Items en Carrito */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-800/80">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
              <ShoppingCart className="w-10 h-10 text-slate-600 mb-2 stroke-1" />
              <p className="text-sm font-medium">Carrito Vacío</p>
              <p className="text-xs text-slate-600">Haz clic en los productos para agregarlos</p>
            </div>
          ) : (
            carrito.map((item) => (
              <div key={item.producto.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0 pr-2">
                  <h5 className="text-sm font-medium text-white truncate">{item.producto.nombre}</h5>
                  <div className="text-xs text-slate-400">
                    {formatearDinero(item.precio_unitario)} c/u
                  </div>
                </div>

                {/* Control de Cantidad */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => actualizarCantidadCarrito(item.producto.id, item.cantidad - 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-white">{item.cantidad}</span>
                  <button
                    onClick={() => actualizarCantidadCarrito(item.producto.id, item.cantidad + 1)}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-200"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Subtotal del item */}
                <div className="text-right min-w-[70px]">
                  <div className="text-sm font-bold text-emerald-400">
                    {formatearDinero(item.subtotal)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel de Cobro y Métodos de Pago */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3">
          {/* Selector de Método de Pago */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
              { id: 'TARJETA_DEBITO', label: 'Débito', icon: CreditCard },
              { id: 'TARJETA_CREDITO', label: 'Crédito', icon: CreditCard },
              { id: 'TRANSFERENCIA', label: 'Transfer', icon: Smartphone },
            ].map(m => {
              const Icon = m.icon;
              const isSelected = metodoPago === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMetodoPago(m.id as any)}
                  className={`flex flex-col items-center p-2 rounded-xl border text-[11px] font-semibold transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Calculador de Efectivo y Vuelto */}
          {metodoPago === "EFECTIVO" && carrito.length > 0 && (
            <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Paga con:</span>
                <input
                  type="number"
                  placeholder={totalCarrito.toString()}
                  value={montoEfectivo}
                  onChange={(e) => setMontoEfectivo(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-right text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              {Number(montoEfectivo) > totalCarrito && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pt-1 border-t border-slate-800">
                  <span>Vuelto a entregar:</span>
                  <span className="text-sm font-mono">{formatearDinero(vueltoCalculado)}</span>
                </div>
              )}
            </div>
          )}

          {/* Alerta de Error */}
          {errorVenta && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorVenta}</span>
            </div>
          )}

          {/* Botón Principal de Confirmación */}
          <button
            onClick={handleConfirmarVenta}
            disabled={carrito.length === 0 || isProcessing}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-between transition-all shadow-lg ${
              carrito.length === 0 || isProcessing
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-[0.99]"
            }`}
          >
            <span>{isProcessing ? "Procesando Venta..." : "Cobrar Venta"}</span>
            <span className="text-lg font-black">{formatearDinero(totalCarrito)}</span>
          </button>
        </div>
      </div>

      {/* Modal de Escáner por Cámara */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onScan={(code) => {
          handleScannedBarcode(code);
          setIsScannerOpen(false);
        }}
        onClose={() => setIsScannerOpen(false)}
      />

      {/* Modal de Impresión de Ticket Térmico */}
      <TicketModal
        venta={ultimaVenta}
        empresa={empresa}
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
      />

      {/* Modal de Selección de Cliente */}
      {clienteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Asignar Cliente a la Venta
              </h3>
              <button onClick={() => setClienteModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-slate-800">
              <button
                onClick={() => {
                  setClienteSeleccionado(null);
                  setClienteModalOpen(false);
                }}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 text-sm text-slate-300 flex items-center justify-between"
              >
                <span>Cliente General (Sin Datos)</span>
                {!clienteSeleccionado && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
              {clientes.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setClienteSeleccionado(c);
                    setClienteModalOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-800 text-sm text-white flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{c.nombre}</div>
                    <div className="text-xs text-slate-400">{c.rut_identificador || c.telefono || "Sin RUT"}</div>
                  </div>
                  {clienteSeleccionado?.id === c.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
