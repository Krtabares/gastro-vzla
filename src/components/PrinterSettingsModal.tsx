"use client";

import { useState, useEffect } from "react";
import { Printer, RefreshCw, CheckCircle2, AlertCircle, X } from "lucide-react";

interface PrinterDevice {
  vendorId: number;
  productId: number;
  name: string;
}

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterDevice | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPrinters();
      const saved = localStorage.getItem('selectedPrinter');
      if (saved) setSelectedPrinter(JSON.parse(saved));
    }
  }, [isOpen]);

  const loadPrinters = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const list = await window.ipcRenderer.invoke('list-printers');
      setPrinters(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (printer: PrinterDevice) => {
    setSelectedPrinter(printer);
    localStorage.setItem('selectedPrinter', JSON.stringify(printer));
    setStatus({ type: 'success', message: 'Impresora seleccionada' });
  };

  const testPrint = async () => {
    setStatus(null);
    try {
      // @ts-ignore
      const result = await window.ipcRenderer.invoke('print-test', selectedPrinter);
      if (result.success) {
        setStatus({ type: 'success', message: 'Prueba enviada correctamente' });
      } else {
        setStatus({ type: 'error', message: result.error || 'Error al imprimir' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Error de comunicación con Electron' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Printer size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Configurar Impresora</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Dispositivos USB</p>
            <button 
              onClick={loadPrinters} 
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm font-medium"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {printers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Printer className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-gray-400 text-sm">No se detectaron impresoras USB</p>
              </div>
            ) : (
              printers.map((p) => (
                <button
                  key={`${p.vendorId}-${p.productId}`}
                  onClick={() => handleSelect(p)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                    selectedPrinter?.vendorId === p.vendorId && selectedPrinter?.productId === p.productId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Printer size={18} className={selectedPrinter?.vendorId === p.vendorId ? 'text-blue-600' : 'text-gray-400'} />
                    <div className="text-left">
                      <p className="font-bold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">VID: {p.vendorId} | PID: {p.productId}</p>
                    </div>
                  </div>
                  {selectedPrinter?.vendorId === p.vendorId && selectedPrinter?.productId === p.productId && (
                    <CheckCircle2 size={18} className="text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>

          {status && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            disabled={!selectedPrinter}
            onClick={testPrint}
            className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer size={18} /> Imprimir Prueba
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
