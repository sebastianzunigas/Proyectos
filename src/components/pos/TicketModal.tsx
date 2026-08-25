"use client";

import React from "react";
import { Printer, X, CheckCircle, FileText } from "lucide-react";
import { Venta, Empresa } from "@/types";

interface TicketModalProps {
  venta: Venta | null;
  empresa: Empresa | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TicketModal({ venta, empresa, isOpen, onClose }: TicketModalProps) {
  if (!isOpen || !venta) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatearDinero = (monto: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: empresa?.moneda || "CLP" }).format(monto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header modal */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span>Venta Exitosa #{venta.numero_folio}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vista previa del ticket */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950 flex justify-center">
          <div
            id="ticket-termico"
            className="w-full max-w-[80mm] bg-white text-black p-4 rounded shadow font-mono text-xs leading-tight"
          >
            <div className="text-center pb-2 border-b border-dashed border-gray-400 mb-2">
              <h2 className="font-bold text-sm uppercase">{empresa?.nombre || "NEXUS ERP"}</h2>
              <p>{empresa?.rut_identificador || "RUT: 76.123.456-7"}</p>
              <p>{empresa?.direccion || "Dirección Comercial"}</p>
              <p>Tel: {empresa?.telefono || "+56 9 1234 5678"}</p>
            </div>

            <div className="pb-2 border-b border-dashed border-gray-400 mb-2 text-[11px]">
              <div className="flex justify-between">
                <span>BOLETA ELECTRÓNICA:</span>
                <span className="font-bold">N° {venta.numero_folio}</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>{new Date(venta.created_at || Date.now()).toLocaleString("es-CL")}</span>
              </div>
              {venta.cliente_nombre && (
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span>{venta.cliente_nombre}</span>
                </div>
              )}
            </div>

            {/* Lista de productos */}
            <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="py-1">CANT/ITEM</th>
                    <th className="py-1 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {venta.detalles?.map((det, idx) => (
                    <tr key={idx}>
                      <td className="py-0.5 pr-1">
                        <div>{det.producto_nombre || "Producto"}</div>
                        <div className="text-[10px] text-gray-600">
                          {det.cantidad} x {formatearDinero(det.precio_unitario)}
                        </div>
                      </td>
                      <td className="py-0.5 text-right font-semibold align-top">
                        {formatearDinero(det.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="space-y-1 pb-2 border-b border-dashed border-gray-400 mb-2">
              <div className="flex justify-between text-sm font-bold">
                <span>TOTAL:</span>
                <span>{formatearDinero(venta.total)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-700">
                <span>MÉTODO:</span>
                <span className="uppercase">{venta.metodo_pago}</span>
              </div>
              {venta.monto_recibido !== undefined && venta.monto_recibido > 0 && (
                <>
                  <div className="flex justify-between text-[11px] text-gray-700">
                    <span>PAGÓ CON:</span>
                    <span>{formatearDinero(venta.monto_recibido)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-800">
                    <span>VUELTO:</span>
                    <span>{formatearDinero(venta.vuelto || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="text-center text-[10px] text-gray-500 mt-2">
              <p>¡Gracias por su compra!</p>
              <p>Documento generado por Nexus ERP</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors"
          >
            Nueva Venta
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>
    </div>
  );
}
