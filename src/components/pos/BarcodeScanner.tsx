"use client";

import React, { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, X, Check, Volume2, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, isOpen, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const codeReader = new BrowserMultiFormatReader();
    let controls: any = null;

    async function startScanner() {
      try {
        setErrorMsg(null);
        controls = await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result, err) => {
            if (result) {
              const text = result.getText();
              setLastScanned(text);
              onScan(text);
            }
          }
        );
      } catch (err: any) {
        console.error("Error al iniciar cámara:", err);
        setErrorMsg("No se pudo acceder a la cámara. Asegúrate de otorgar permisos de cámara.");
      }
    }

    startScanner();

    return () => {
      if (controls) {
        controls.stop();
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Camera className="w-5 h-5 text-blue-400" />
            <span>Escáner de Código de Barras</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center">
          {errorMsg ? (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border-2 border-dashed border-blue-500/50 flex items-center justify-center">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-2 border-emerald-500/60 rounded-xl pointer-events-none animate-pulse"></div>
            </div>
          )}

          {lastScanned && (
            <div className="mt-4 px-4 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-mono flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Detectado: {lastScanned}</span>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400 text-center">
            Apunta la cámara hacia el código de barras (EAN-13, CODE-128 o QR) del producto.
          </p>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition-colors"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </div>
  );
}
