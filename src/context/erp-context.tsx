"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Producto, Categoria, Venta, Cliente, Proveedor, MovimientoInventario, Empresa, ItemCarrito } from "@/types";

interface ERPContextType {
  productos: Producto[];
  categorias: Categoria[];
  ventas: Venta[];
  clientes: Cliente[];
  proveedores: Proveedor[];
  movimientos: MovimientoInventario[];
  empresa: Empresa | null;
  cargando: boolean;
  carrito: ItemCarrito[];
  clienteSeleccionado: Cliente | null;
  // Operaciones
  recargarDatos: () => Promise<void>;
  agregarAlCarrito: (producto: Producto, cantidad?: number) => void;
  eliminarDelCarrito: (productoId: string) => void;
  actualizarCantidadCarrito: (productoId: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  setClienteSeleccionado: (cliente: Cliente | null) => void;
  procesarVenta: (metodoPago: Venta['metodo_pago'], montoRecibido?: number, vuelto?: number, observaciones?: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  guardarProducto: (producto: Partial<Producto>) => Promise<boolean>;
  eliminarProducto: (id: string) => Promise<boolean>;
  ajustarStock: (productoId: string, tipo: MovimientoInventario['tipo_movimiento'], cantidad: number, motivo?: string) => Promise<boolean>;
  guardarCliente: (cliente: Partial<Cliente>) => Promise<boolean>;
  guardarProveedor: (proveedor: Partial<Proveedor>) => Promise<boolean>;
  actualizarEmpresa: (datos: Partial<Empresa>) => Promise<boolean>;
  inicializarBaseDeDatos: () => Promise<{ success: boolean; message?: string; error?: string }>;
  generarSiguienteSKU: () => number;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export function ERPProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estado del Carrito POS
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);

  const recargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [prodRes, catRes, vtaRes, cliRes, provRes, empRes] = await Promise.all([
        fetch("/api/productos").then(r => r.json()),
        fetch("/api/categorias").then(r => r.json()),
        fetch("/api/ventas?limit=100").then(r => r.json()),
        fetch("/api/clientes").then(r => r.json()),
        fetch("/api/proveedores").then(r => r.json()),
        fetch("/api/configuracion").then(r => r.json()),
      ]);

      if (prodRes.success) setProductos(prodRes.data || []);
      if (catRes.success) setCategorias(catRes.data || []);
      if (vtaRes.success) setVentas(vtaRes.data || []);
      if (cliRes.success) setClientes(cliRes.data || []);
      if (provRes.success) setProveedores(provRes.data || []);
      if (empRes.success) setEmpresa(empRes.data || null);
    } catch (err) {
      console.error("Error al cargar datos del ERP:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargarDatos();
  }, [recargarDatos]);

  // Carrito helpers
  const agregarAlCarrito = (producto: Producto, cantidad = 1) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === producto.id);
      if (existe) {
        return prev.map(item =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + cantidad, subtotal: (item.cantidad + cantidad) * item.precio_unitario }
            : item
        );
      }
      return [...prev, {
        producto,
        cantidad,
        precio_unitario: producto.precio_venta,
        subtotal: cantidad * producto.precio_venta
      }];
    });
  };

  const eliminarDelCarrito = (productoId: string) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== productoId));
  };

  const actualizarCantidadCarrito = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(productoId);
      return;
    }
    setCarrito(prev =>
      prev.map(item =>
        item.producto.id === productoId
          ? { ...item, cantidad, subtotal: cantidad * item.precio_unitario }
          : item
      )
    );
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setClienteSeleccionado(null);
  };

  // Procesar venta en POS
  const procesarVenta = async (
    metodoPago: Venta['metodo_pago'],
    montoRecibido?: number,
    vuelto?: number,
    observaciones?: string
  ) => {
    if (carrito.length === 0) return { success: false, error: "Carrito vacío" };

    try {
      const payload = {
        items: carrito.map(i => ({
          producto_id: i.producto.id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario
        })),
        cliente_id: clienteSeleccionado?.id || null,
        metodo_pago: metodoPago,
        monto_recibido: montoRecibido,
        vuelto: vuelto || 0,
        observaciones
      };

      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        await recargarDatos();
        return { success: true, data: data.data };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const guardarProducto = async (producto: Partial<Producto>) => {
    try {
      const isEdit = !!producto.id;
      const res = await fetch("/api/productos", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto)
      });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const eliminarProducto = async (id: string) => {
    try {
      const res = await fetch(`/api/productos?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const ajustarStock = async (
    productoId: string,
    tipo: MovimientoInventario['tipo_movimiento'],
    cantidad: number,
    motivo?: string
  ) => {
    try {
      const res = await fetch("/api/inventario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto_id: productoId, tipo_movimiento: tipo, cantidad, motivo })
      });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const guardarCliente = async (cliente: Partial<Cliente>) => {
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente)
      });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const guardarProveedor = async (proveedor: Partial<Proveedor>) => {
    try {
      const res = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proveedor)
      });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const actualizarEmpresa = async (datos: Partial<Empresa>) => {
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos)
      });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const inicializarBaseDeDatos = async () => {
    try {
      const res = await fetch("/api/db/init", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await recargarDatos();
        return { success: true, message: data.message };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const generarSiguienteSKU = () => {
    if (productos.length === 0) return 1001;
    const skus = productos.map(p => Number(p.sku) || 0);
    return Math.max(...skus) + 1;
  };

  return (
    <ERPContext.Provider
      value={{
        productos,
        categorias,
        ventas,
        clientes,
        proveedores,
        movimientos,
        empresa,
        cargando,
        carrito,
        clienteSeleccionado,
        recargarDatos,
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidadCarrito,
        vaciarCarrito,
        setClienteSeleccionado,
        procesarVenta,
        guardarProducto,
        eliminarProducto,
        ajustarStock,
        guardarCliente,
        guardarProveedor,
        actualizarEmpresa,
        inicializarBaseDeDatos,
        generarSiguienteSKU
      }}
    >
      {children}
    </ERPContext.Provider>
  );
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error("useERP debe ser usado dentro de un ERPProvider");
  }
  return context;
}
