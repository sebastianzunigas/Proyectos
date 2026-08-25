"use client";

import React, { useState } from "react";
import { useERP } from "@/context/erp-context";
import { Proveedor } from "@/types";
import { Truck, Plus, Search, Mail, Phone, MapPin, Trash2, X, Check, UserCheck } from "lucide-react";

export default function ProveedoresPage() {
  const { proveedores, guardarProveedor, recargarDatos } = useERP();
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [provForm, setProvForm] = useState<Partial<Proveedor>>({
    nombre: "",
    rut_identificador: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: ""
  });
  const [mensaje, setMensaje] = useState<string | null>(null);

  const proveedoresFiltrados = proveedores.filter((p) => {
    if (!busqueda) return true;
    const term = busqueda.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      (p.rut_identificador && p.rut_identificador.toLowerCase().includes(term)) ||
      (p.contacto && p.contacto.toLowerCase().includes(term))
    );
  });

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provForm.nombre) return;

    const ok = await guardarProveedor(provForm);
    if (ok) {
      setModalOpen(false);
      setProvForm({ nombre: "", rut_identificador: "", contacto: "", email: "", telefono: "", direccion: "" });
      setMensaje("Proveedor registrado exitosamente.");
      setTimeout(() => setMensaje(null), 3000);
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (confirm(`¿Eliminar proveedor "${nombre}"?`)) {
      await fetch(`/api/proveedores?id=${id}`, { method: "DELETE" });
      await recargarDatos();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Directorio de Proveedores</h1>
            <p className="text-slate-400 text-sm">
              Gestión de proveedores, ejecutivos de cuenta y datos de compras.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proveedor</span>
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
          placeholder="Buscar por razón social, RUT o contacto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none w-full"
        />
      </div>

      {/* Grid de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedoresFiltrados.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
            No se encontraron proveedores registrados.
          </div>
        ) : (
          proveedoresFiltrados.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 font-mono rounded-lg">
                    {p.rut_identificador || "Sin RUT"}
                  </span>
                  <button
                    onClick={() => handleEliminar(p.id, p.nombre)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{p.nombre}</h3>

                {p.contacto && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-1 font-medium">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Contacto: {p.contacto}</span>
                  </div>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                  {p.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.telefono}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.email}</span>
                    </div>
                  )}
                  {p.direccion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.direccion}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Proveedor */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" />
                Registrar Proveedor
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Razón Social / Nombre Comercial</label>
                <input
                  type="text"
                  value={provForm.nombre}
                  onChange={(e) => setProvForm({ ...provForm, nombre: e.target.value })}
                  placeholder="Ej: Distribuidora Central S.A."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">RUT Empresa</label>
                  <input
                    type="text"
                    value={provForm.rut_identificador}
                    onChange={(e) => setProvForm({ ...provForm, rut_identificador: e.target.value })}
                    placeholder="76.543.210-K"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    value={provForm.contacto}
                    onChange={(e) => setProvForm({ ...provForm, contacto: e.target.value })}
                    placeholder="Ej: Carlos López (Ventas)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={provForm.telefono}
                    onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })}
                    placeholder="+56 2..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={provForm.email}
                    onChange={(e) => setProvForm({ ...provForm, email: e.target.value })}
                    placeholder="contacto@distribuidora.cl"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección / Centro Distribución</label>
                <input
                  type="text"
                  value={provForm.direccion}
                  onChange={(e) => setProvForm({ ...provForm, direccion: e.target.value })}
                  placeholder="Av. Industrial #500"
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
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
