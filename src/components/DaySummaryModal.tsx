"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Printer, 
  FileSpreadsheet, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Target,
  AlertTriangle,
  History,
  Activity,
  ArrowRight
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { db, Sale } from '@/lib/db';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

interface DaySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalUsd: number;
  onConfirm: () => void;
}

function MethodRow({ label, value, icon }: any) {
  const { formatUsd } = useCurrency();
  const numericValue = typeof value === 'number' ? value : 0;
  
  if (numericValue === 0) return null;
  
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <div className="flex items-center gap-3 text-brand-text/40">
        <div className="p-1.5 bg-brand-border/20 rounded-lg">
          {icon}
        </div>
        <span className="font-bold uppercase tracking-widest text-[10px]">{label}</span>
      </div>
      <span className="font-black text-white">{formatUsd(numericValue)}</span>
    </div>
  );
}

export default function DaySummaryModal({ isOpen, onClose, totalUsd: propTotalUsd, onConfirm }: DaySummaryModalProps) {
  const { formatUsd, formatVes, usdToVes, exchangeRate, iva, ivaEnabled } = useCurrency();
  const [summary, setSummary] = useState<any>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cashInHandUsd, setCashInHandUsd] = useState<string>('');
  const [cashInHandVes, setCashInHandVes] = useState<string>('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen]);

  const loadSummary = async () => {
    try {
      const start = new Date(new Date().setHours(0,0,0,0)).toISOString();
      const end = new Date(new Date().setHours(23,59,59,999)).toISOString();
      const [summaryData, salesData] = await Promise.all([
        db.getSalesByMethod(start, end),
        db.getSales(start, end)
      ]);
      setSummary(summaryData);
      setSales(salesData);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  };

  if (!isOpen) return null;

  const totalUsd = summary?.total_usd || propTotalUsd || 0;
  const totalVes = usdToVes(totalUsd);
  
  // Métricas adicionales
  const orderCount = sales.length;
  const averageTicket = orderCount > 0 ? totalUsd / orderCount : 0;
  const estimatedIvaUsd = ivaEnabled ? totalUsd * iva : 0;

  // Cálculos de cuadre
  const expectedCashUsd = summary?.cash_usd || 0;
  const expectedCashVes = summary?.cash_ves || 0;
  
  const diffUsd = parseFloat(cashInHandUsd || '0') - expectedCashUsd;
  const diffVes = parseFloat(cashInHandVes || '0') - expectedCashVes;

  const exportToExcel = () => {
    const data = [
      { Concepto: "Fecha de Cierre", Valor: new Date().toLocaleDateString() },
      { Concepto: "Tasa BCV", Valor: exchangeRate.toFixed(2) + " VES/$" },
      { Concepto: "Total Ventas (USD)", Valor: totalUsd.toFixed(2) },
      { Concepto: "Total Ventas (VES)", Valor: totalVes.toFixed(2) },
      { Concepto: "Ticket Promedio (USD)", Valor: averageTicket.toFixed(2) },
      { Concepto: "Total Órdenes", Valor: orderCount },
    ];

    if (ivaEnabled) {
      data.push({ Concepto: `Impuesto IVA (${(iva * 100).toFixed(0)}%) Est.`, Valor: estimatedIvaUsd.toFixed(2) });
    }

    if (summary) {
      if (summary.cash_usd > 0) data.push({ Concepto: "Efectivo USD (Sistema)", Valor: summary.cash_usd.toFixed(2) });
      if (cashInHandUsd) data.push({ Concepto: "Efectivo USD (Físico)", Valor: parseFloat(cashInHandUsd).toFixed(2) });
      if (summary.zelle > 0) data.push({ Concepto: "Zelle", Valor: summary.zelle.toFixed(2) });
      if (summary.pago_movil > 0) data.push({ Concepto: "Pago Movil", Valor: summary.pago_movil.toFixed(2) });
      if (summary.card > 0) data.push({ Concepto: "Punto de Venta", Valor: summary.card.toFixed(2) });
      if (summary.cash_ves > 0) data.push({ Concepto: "Efectivo VES (Sistema)", Valor: summary.cash_ves.toFixed(2) });
      if (cashInHandVes) data.push({ Concepto: "Efectivo VES (Físico)", Valor: parseFloat(cashInHandVes).toFixed(2) });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cierre de Caja");
    
    const fileName = `Cierre_Caja_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-[300] p-4">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card w-full max-w-2xl shadow-2xl overflow-hidden border-brand-accent/20 flex flex-col max-h-[95vh]"
      >
        {/* Header con gradiente */}
        <div className="bg-brand-accent p-8 text-white text-center relative shrink-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-20 -mb-20 blur-3xl" />
          
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 glass-card border-white/20 hover:bg-white/10 transition-colors z-10"
          >
            <X size={20} />
          </button>

          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl border border-white/30 backdrop-blur-md"
          >
            <Receipt size={32} strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Cierre de Jornada</h2>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Reporte de Auditoría Operativa</p>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          {/* Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-brand-dark/40 p-5 rounded-3xl border border-brand-border/30 group transition-all hover:bg-brand-dark/60">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest">Ingresos Totales (USD)</p>
                <div className="p-1.5 bg-brand-accent/10 rounded-lg text-brand-accent">
                  <DollarSign size={12} />
                </div>
              </div>
              <p className="text-3xl font-black text-white tracking-tighter">{formatUsd(totalUsd)}</p>
              <div className="mt-2 pt-2 border-t border-brand-border/10 flex justify-between items-center text-[10px] font-bold">
                <span className="text-brand-text/40 italic">Equivalente:</span>
                <span className="text-brand-highlight">{formatVes(totalVes)}</span>
              </div>
            </div>

            <div className="bg-brand-dark/40 p-5 rounded-3xl border border-brand-border/30 group transition-all hover:bg-brand-dark/60">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest">Estadísticas Hoy</p>
                <div className="p-1.5 bg-brand-highlight/10 rounded-lg text-brand-highlight">
                  <Activity size={12} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-brand-text/40 uppercase font-black">Órdenes:</span>
                  <span className="text-sm font-black text-white">{orderCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-brand-text/40 uppercase font-black">Ticket Prom:</span>
                  <span className="text-sm font-black text-white">{formatUsd(averageTicket)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auditoría de Efectivo (Cuadre) */}
          <div className="space-y-4 bg-brand-accent/5 p-6 rounded-[2rem] border border-brand-accent/10">
            <h3 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
              <Target size={14} /> Cuadre de Efectivo Físico
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Columna USD */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-text/40 px-1">
                  <span>Efectivo USD</span>
                  <span className="text-brand-text/60">Esperado: {formatUsd(expectedCashUsd)}</span>
                </div>
                <div className="relative group">
                  <input 
                    type="number"
                    placeholder="Monto en caja $"
                    value={cashInHandUsd}
                    onChange={(e) => setCashInHandUsd(e.target.value)}
                    className="w-full bg-brand-dark/60 border border-brand-border/30 rounded-2xl py-4 px-5 text-lg font-black text-white focus:outline-none focus:border-brand-accent transition-all pl-12"
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/20 group-focus-within:text-brand-accent" size={20} />
                </div>
                {cashInHandUsd && (
                  <div className={`text-[10px] font-black uppercase px-2 py-1.5 rounded-lg flex justify-between items-center ${diffUsd === 0 ? 'bg-green-500/10 text-green-500' : diffUsd > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                    <span>Diferencia:</span>
                    <span>{diffUsd > 0 ? '+' : ''}{formatUsd(diffUsd)}</span>
                  </div>
                )}
              </div>

              {/* Columna VES */}
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-text/40 px-1">
                  <span>Efectivo VES</span>
                  <span className="text-brand-text/60">Esperado: {formatVes(expectedCashVes)}</span>
                </div>
                <div className="relative group">
                  <input 
                    type="number"
                    placeholder="Monto en caja Bs"
                    value={cashInHandVes}
                    onChange={(e) => setCashInHandVes(e.target.value)}
                    className="w-full bg-brand-dark/60 border border-brand-border/30 rounded-2xl py-4 px-5 text-lg font-black text-white focus:outline-none focus:border-brand-highlight transition-all pl-12"
                  />
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/20 group-focus-within:text-brand-highlight" size={20} />
                </div>
                {cashInHandVes && (
                  <div className={`text-[10px] font-black uppercase px-2 py-1.5 rounded-lg flex justify-between items-center ${diffVes === 0 ? 'bg-green-500/10 text-green-500' : diffVes > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'}`}>
                    <span>Diferencia:</span>
                    <span>{diffVes > 0 ? '+' : ''}{formatVes(diffVes)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desglose por Métodos */}
          <div className="space-y-4 bg-brand-dark/20 p-6 rounded-[2rem] border border-brand-border/20">
            <h3 className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse" /> Desglose Financiero
            </h3>
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                <MethodRow label="Efectivo USD" value={summary.cash_usd} icon={<DollarSign size={14}/>} />
                <MethodRow label="Zelle" value={summary.zelle} icon={<Smartphone size={14}/>} />
                <MethodRow label="Pago Móvil" value={summary.pago_movil} icon={<Smartphone size={14}/>} />
                 <MethodRow label="Punto de Venta" value={summary.card} icon={<CreditCard size={14}/>} />
                 <MethodRow label="Efectivo VES" value={summary.cash_ves} icon={<Banknote size={14}/>} />
                 {ivaEnabled && (
                   <div className="flex justify-between items-center text-sm py-1">
                     <div className="flex items-center gap-3 text-brand-text/40">
                       <div className="p-1.5 bg-brand-border/20 rounded-lg">
                         <Target size={14}/>
                       </div>
                       <span className="font-bold uppercase tracking-widest text-[10px]">IVA Est. ({(iva * 100).toFixed(0)}%)</span>
                     </div>
                     <span className="font-black text-white/40">{formatUsd(estimatedIvaUsd)}</span>
                   </div>
                 )}
               </div>
             )}
            <div className="border-t border-brand-border/10 pt-4 mt-2 flex justify-between items-center">
              <span className="text-[10px] font-black text-brand-text/30 uppercase tracking-widest">Tasa aplicada hoy</span>
              <span className="font-black text-brand-accent bg-brand-accent/5 px-3 py-1 rounded-full text-xs">{exchangeRate.toFixed(2)} VES/$</span>
            </div>
          </div>

          {/* Acciones Finales */}
          <div className="flex flex-col gap-4 pt-4">
            <AnimatePresence mode="wait">
              {!showConfirmReset ? (
                <motion.button 
                  key="reset-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmReset(true)}
                  className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-brand-accent/20 transition-all"
                >
                  <CheckCircle2 size={24} strokeWidth={3} /> Cerrar Jornada y Zerar Caja
                </motion.button>
              ) : (
                <motion.div 
                  key="confirm-area"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle size={24} />
                    <p className="font-black text-xs uppercase tracking-widest">¿Confirmar cierre definitivo?</p>
                  </div>
                  <p className="text-[10px] text-brand-text/60 leading-relaxed font-bold">
                    Esta acción reseteará las ventas del día y liberará todas las mesas. Asegúrate de haber exportado tus reportes antes de continuar.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setShowConfirmReset(false)}
                      className="py-3 bg-brand-dark border border-brand-border/30 text-brand-text/60 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-border/10 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => {
                        onConfirm();
                        onClose();
                      }}
                      className="py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                    >
                      Sí, Zerar Caja
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={exportToExcel}
                className="py-4 bg-brand-dark border border-brand-border/30 hover:border-brand-highlight/40 text-brand-highlight rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <FileSpreadsheet size={18} /> Exportar Excel
              </button>
              <button 
                onClick={() => window.print()}
                className="py-4 bg-brand-dark border border-brand-border/30 hover:border-brand-text/40 text-brand-text/60 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <Printer size={18} /> Imprimir Cierre
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
