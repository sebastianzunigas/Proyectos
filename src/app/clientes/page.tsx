"use client";

import React, { useState } from "react";
import { useERP } from "@/context/erp-context";
import { Cliente } from "@/types";
import { Users, Plus, Search, Mail, Phone, MapPin, Trash2, X, Check, DollarSign } from "lucide-react";

export default function ClientesPage() {
  const { clientes, guardarCliente, empresa, recargarDatos } = useERP();
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteForm, setClienteForm] = useState<Partial<Cliente>>({
    nombre: "",
    rut_identificador: "",
    email: "",
    telefono: "",
    direccion: ""
  });
  const [mensaje, setMensaje] = useState<string | null>(null);

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: empresa?.moneda || "CLP" }).format(monto);
  };

  const clientesFiltrados = clientes.filter((c) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      (c.rut_identificador && c.rut_identificador.toLowerCase().includes(term)) ||
      (c.telefono && c.telefono.includes(term))
    );
  });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteForm.nombre) return;

    const ok = await guardarCliente(clienteForm);
    if (ok) {
      setModalOpen(false);
      setClienteForm({ nombre: "", rut_identificador: "", email: "", telefono: "", direccion: "" });
      setMensaje("Cliente registrado exitosamente.");
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (confirm(`¿Eliminar al cliente "${nombre}"?`)) {
      await fetch(`/api/clientes?id=${id}`, { method: "DELETE" });
      await recargarDatos();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">CRM de Clientes</h1>
            <p className="text-slate-400 text-sm">
              Directorio de clientes, historial de compras acumuladas y datos de facturación.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {mensaje && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* Buscador */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 max-w-md">
        <Search className="w-4 h-4 text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Buscar por nombre, RUT o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Grid de Tarjetas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No se encontraron clientes registrados.
          </div>
        ) : (
          clientesFiltrados.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 font-mono rounded-lg">
                    {c.rut_identificador || "Sin RUT"}
                  </span>
                  <button
                    onClick={() => handleEliminar(c.id, c.nombre)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white mt-3">{c.nombre}</h3>

                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  {c.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-400" />
                      <span>{c.telefono}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-purple-400" />
                      <span>{c.email}</span>
                    </div>
                  )}
                  {c.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{c.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total Histórico Comprado:</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatearDinero(c.total_comprado || 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Registrar Nuevo Cliente
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo / Razón Social</label>
                <input
                  type="text"
                  value={clienteForm.nombre}
                  onChange={(e) => setClienteForm({ ...clienteForm, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">RUT / Identificador Tributario</label>
                <input
                  type="text"
                  value={clienteForm.rut_identificador}
                  onChange={(e) => setClienteForm({ ...clienteForm, rut_identificador: e.target.value })}
                  placeholder="12.345.678-9"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={clienteForm.telefono}
                    onChange={(e) => setClienteForm({ ...clienteForm, telefono: e.target.value })}
                    placeholder="+56 9..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={clienteForm.email}
                    onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección</label>
                <input
                  type="text"
                  value={clienteForm.direccion}
                  onChange={(e) => setClienteForm({ ...clienteForm, direccion: e.target.value })}
                  placeholder="Calle, Número, Comuna/Ciudad"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
