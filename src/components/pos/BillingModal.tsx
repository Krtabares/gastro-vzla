"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { X, Receipt, CreditCard, Banknote, Smartphone, CheckCircle2, DollarSign, Lock } from 'lucide-react';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  subtotalUsd: number;
  items: any[];
  onComplete: () => void;
}

export default function BillingModal({ isOpen, onClose, tableNumber, subtotalUsd, items, onComplete }: BillingModalProps) {
  const { formatUsd, formatVes, usdToVes, iva, igtf } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<'cash_usd' | 'cash_ves' | 'zelle' | 'pago_movil' | 'card'>('cash_usd');
  const [isLicenseActive, setIsLicenseActive] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkLicense();
    }
  }, [isOpen]);

  const checkLicense = async () => {
    const license = await db.getLicenseStatus();
    setIsLicenseActive(license.status === 'active');
  };
  
  if (!isOpen) return null;

  const needsIgtf = paymentMethod === 'cash_usd' || paymentMethod === 'zelle';
  const ivaAmount = subtotalUsd * iva;
  const igtfAmount = needsIgtf ? (subtotalUsd + ivaAmount) * igtf : 0;
  const totalUsd = subtotalUsd + ivaAmount + igtfAmount;
  const totalVes = usdToVes(totalUsd);

  const handleFinalize = async () => {
    try {
      await db.saveSale({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        items: items.map(i => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          status: 'delivered'
        })),
        totalUsd: totalUsd,
        paymentMethod: paymentMethod,
      });
    } catch (e) {
      console.error("Error saving sale:", e);
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row border-brand-accent/20"
      >
        {/* Resumen de Factura */}
        <div className="bg-brand-dark/40 p-10 w-full md:w-1/2 border-b md:border-b-0 md:border-r border-brand-border/30">
          <div className="flex items-center gap-3 mb-10 text-brand-text/30">
            <Receipt size={24} />
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Facturación</span>
          </div>

          <h2 className="text-4xl font-black text-white mb-8 tracking-tighter">Mesa #{tableNumber}</h2>

          <div className="space-y-5 border-b border-brand-border/30 pb-8 mb-8">
            <div className="flex justify-between text-brand-text/60 font-medium">
              <span>Subtotal</span>
              <span className="text-white">{formatUsd(subtotalUsd)}</span>
            </div>
            <div className="flex justify-between text-brand-text/60 font-medium">
              <span>IVA (16%)</span>
              <span className="text-white">{formatUsd(ivaAmount)}</span>
            </div>
            <AnimatePresence>
              {needsIgtf && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex justify-between text-brand-highlight font-bold italic"
                >
                  <span>Impuesto IGTF (3%)</span>
                  <span>{formatUsd(igtfAmount)}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <span className="text-brand-text/40 font-black uppercase tracking-widest text-[10px]">Total a Cobrar</span>
              <span className="text-5xl font-black text-white tracking-tighter">{formatUsd(totalUsd)}</span>
            </div>
            <motion.div 
              layout
              className="flex justify-between items-center bg-brand-highlight/10 border border-brand-highlight/20 text-brand-highlight px-6 py-4 rounded-2xl"
            >
              <span className="text-xs font-black uppercase tracking-widest">Importe en VES</span>
              <span className="text-2xl font-black tracking-tighter">{formatVes(totalVes)}</span>
            </motion.div>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="p-10 w-full md:w-1/2 flex flex-col relative bg-brand-card/20">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-black text-brand-text/40 uppercase tracking-[0.3em]">Seleccionar Pago</h3>
            <button onClick={onClose} className="p-2 glass-card hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <PaymentOption 
              id="cash_usd"
              active={paymentMethod === 'cash_usd'}
              onClick={() => setPaymentMethod('cash_usd')}
              icon={<DollarSign size={20} />}
              label="Efectivo USD"
              desc="Aplica IGTF 3%"
            />
            <PaymentOption 
              id="zelle"
              active={paymentMethod === 'zelle'}
              onClick={() => setPaymentMethod('zelle')}
              icon={<Smartphone size={20} />}
              label="Zelle"
              desc="Aplica IGTF 3%"
            />
            <PaymentOption 
              id="pago_movil"
              active={paymentMethod === 'pago_movil'}
              onClick={() => setPaymentMethod('pago_movil')}
              icon={<Smartphone size={20} />}
              label="Pago Móvil"
              desc="Tasa Oficial BCV"
            />
            <PaymentOption 
              id="card"
              active={paymentMethod === 'card'}
              onClick={() => setPaymentMethod('card')}
              icon={<CreditCard size={20} />}
              label="Punto de Venta"
              desc="Tarjeta Débito/Crédito"
            />
            <PaymentOption 
              id="cash_ves"
              active={paymentMethod === 'cash_ves'}
              onClick={() => setPaymentMethod('cash_ves')}
              icon={<Banknote size={20} />}
              label="Efectivo VES"
              desc="Bolívares en Caja"
            />
          </div>

          <div className="mt-8 space-y-4">
            <motion.button 
              whileHover={isLicenseActive ? { scale: 1.02 } : {}}
              whileTap={isLicenseActive ? { scale: 0.98 } : {}}
              onClick={handleFinalize}
              disabled={!isLicenseActive}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl transition-all ${
                isLicenseActive 
                  ? 'bg-brand-accent text-white shadow-brand-accent/20' 
                  : 'bg-brand-border/20 text-brand-text/20 cursor-not-allowed border border-brand-border/30'
              }`}
            >
              {isLicenseActive ? (
                <>
                  <CheckCircle2 size={20} strokeWidth={3} /> Finalizar Operación
                </>
              ) : (
                <>
                  <Lock size={18} /> Licencia Inactiva
                </>
              )}
            </motion.button>
            {!isLicenseActive && (
              <p className="text-[10px] text-red-400 font-black text-center uppercase tracking-widest">
                Sistema bloqueado por falta de licencia
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PaymentOption({ active, onClick, icon, label, desc }: any) {
  return (
    <motion.button 
      whileHover={{ x: 5 }}
      onClick={onClick}
      className={`flex items-center gap-5 p-5 rounded-2xl border transition-all text-left relative overflow-hidden ${
        active 
        ? 'border-brand-accent/50 bg-brand-accent/10' 
        : 'border-brand-border/30 bg-brand-dark/20 hover:border-brand-border/60'
      }`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
        active ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'bg-brand-border/20 text-brand-text/30'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`font-black text-sm ${active ? 'text-white' : 'text-brand-text/60'}`}>{label}</p>
        <p className="text-[10px] font-bold text-brand-text/30 uppercase tracking-widest">{desc}</p>
      </div>
      {active && (
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }}
          className="text-brand-accent"
        >
          <CheckCircle2 size={24} strokeWidth={3} />
        </motion.div>
      )}
    </motion.button>
  );
}
