"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, TrendingUp, DollarSign, Receipt, Printer, FileSpreadsheet, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { db } from '@/lib/db';
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
  const { formatUsd, formatVes, usdToVes, exchangeRate } = useCurrency();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadSummary();
    }
  }, [isOpen]);

  const loadSummary = async () => {
    try {
      const start = new Date(new Date().setHours(0,0,0,0)).toISOString();
      const end = new Date(new Date().setHours(23,59,59,999)).toISOString();
      const data = await db.getSalesByMethod(start, end);
      setSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
  };

  if (!isOpen) return null;

  const totalUsd = summary?.total_usd || propTotalUsd || 0;
  const totalVes = usdToVes(totalUsd);

  const exportToExcel = () => {
    const data = [
      { Concepto: "Fecha de Cierre", Valor: new Date().toLocaleDateString() },
      { Concepto: "Tasa BCV", Valor: exchangeRate.toFixed(2) + " VES/$" },
      { Concepto: "Total Ventas (USD)", Valor: totalUsd.toFixed(2) },
      { Concepto: "Total Ventas (VES)", Valor: totalVes.toFixed(2) },
      { Concepto: "Impuesto IVA (16%)", Valor: (totalUsd * 0.16).toFixed(2) },
    ];

    if (summary) {
      if (summary.cash_usd > 0) data.push({ Concepto: "Efectivo USD", Valor: summary.cash_usd.toFixed(2) });
      if (summary.zelle > 0) data.push({ Concepto: "Zelle", Valor: summary.zelle.toFixed(2) });
      if (summary.pago_movil > 0) data.push({ Concepto: "Pago Movil", Valor: summary.pago_movil.toFixed(2) });
      if (summary.card > 0) data.push({ Concepto: "Punto de Venta", Valor: summary.card.toFixed(2) });
      if (summary.cash_ves > 0) data.push({ Concepto: "Efectivo VES", Valor: summary.cash_ves.toFixed(2) });
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
        className="glass-card w-full max-w-xl shadow-2xl overflow-hidden border-brand-accent/20 flex flex-col max-h-[90vh]"
      >
        <div className="bg-brand-accent p-10 text-white text-center relative shrink-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
          <button 
            onClick={onClose}
            className="absolute right-6 top-6 p-2 glass-card border-white/20 hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30"
          >
            <Receipt size={40} strokeWidth={2.5} />
          </motion.div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Cierre de Jornada</h2>
          <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Resumen Operativo Diario</p>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-brand-dark/40 p-6 rounded-3xl border border-brand-border/30 group hover:border-brand-accent/30 transition-colors">
              <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest mb-2">Ingresos USD</p>
              <p className="text-3xl font-black text-white tracking-tighter">{formatUsd(totalUsd)}</p>
            </div>
            <div className="bg-brand-dark/40 p-6 rounded-3xl border border-brand-border/30 group hover:border-brand-highlight/30 transition-colors">
              <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest mb-2">Ingresos VES</p>
              <p className="text-3xl font-black text-brand-highlight tracking-tighter">{formatVes(totalVes)}</p>
            </div>
          </div>

          <div className="space-y-4 bg-brand-dark/20 p-8 rounded-[2rem] border border-brand-border/20">
            <h3 className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-brand-border" /> Desglose Financiero
            </h3>
            {summary && (
              <div className="space-y-3">
                <MethodRow label="Efectivo USD" value={summary.cash_usd} icon={<DollarSign size={14}/>} />
                <MethodRow label="Zelle" value={summary.zelle} icon={<Smartphone size={14}/>} />
                <MethodRow label="Pago Móvil" value={summary.pago_movil} icon={<Smartphone size={14}/>} />
                <MethodRow label="Punto de Venta" value={summary.card} icon={<CreditCard size={14}/>} />
                <MethodRow label="Efectivo VES" value={summary.cash_ves} icon={<Banknote size={14}/>} />
              </div>
            )}
            <div className="border-t border-brand-border/30 pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-brand-text/30 uppercase tracking-widest">Tasa aplicada</span>
                <span className="font-black text-brand-accent">{exchangeRate.toFixed(2)} VES/$</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl shadow-brand-accent/20 transition-all"
            >
              <CheckCircle2 size={24} strokeWidth={3} /> Zerar Caja Actual
            </motion.button>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={exportToExcel}
                className="py-4 bg-brand-dark border border-brand-border/30 hover:border-brand-highlight/40 text-brand-highlight rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <FileSpreadsheet size={18} /> Excel Report
              </button>
              <button 
                onClick={() => window.print()}
                className="py-4 bg-brand-dark border border-brand-border/30 hover:border-brand-text/40 text-brand-text/60 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <Printer size={18} /> Print X-Report
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
