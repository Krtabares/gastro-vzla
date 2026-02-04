"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { X, Receipt, CreditCard, Banknote, Smartphone, CheckCircle2, DollarSign, Lock, ShieldAlert, Plus, Trash2, ArrowRight } from 'lucide-react';
import { db, User, Payment } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableNumber: string;
  subtotalUsd: number;
  items: any[];
  onComplete: () => void;
  type?: 'table' | 'takeaway' | 'delivery';
}

export default function BillingModal({ isOpen, onClose, tableNumber, subtotalUsd, items, onComplete, type }: BillingModalProps) {
  const { formatUsd, formatVes, usdToVes, vesToUsd, iva, igtf } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<'cash_usd' | 'cash_ves' | 'zelle' | 'pago_movil' | 'card'>('cash_usd');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amountInput, setAmountInput] = useState<string>('');
  const [vesAmountInput, setVesAmountInput] = useState<string>('');
  const [isLicenseActive, setIsLicenseActive] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // ... (otros efectos y variables)

  const handleUsdChange = (val: string) => {
    setAmountInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const igtfAmount = (paymentMethod === 'cash_usd' || paymentMethod === 'zelle') ? num * igtf : 0;
      setVesAmountInput(usdToVes(num + igtfAmount).toFixed(2));
    } else {
      setVesAmountInput('');
    }
  };

  const handleVesChange = (val: string) => {
    setVesAmountInput(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const usdWithIgtf = vesToUsd(num);
      const isIgtfMethod = paymentMethod === 'cash_usd' || paymentMethod === 'zelle';
      const baseUsd = isIgtfMethod ? usdWithIgtf / (1 + igtf) : usdWithIgtf;
      setAmountInput(baseUsd.toFixed(2));
    } else {
      setAmountInput('');
    }
  };

  useEffect(() => {
    handleUsdChange(amountInput);
  }, [paymentMethod]);

  useEffect(() => {
    const storedUser = localStorage.getItem('gastro_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    
    if (isOpen) {
      checkLicense();
      setPayments([]);
      handleUsdChange(''); // Reset con lógica de conversión
    }
  }, [isOpen]);

  const ivaAmount = subtotalUsd * iva;
  const baseTotalUsd = subtotalUsd + ivaAmount;

  const currentTotalWithIgtf = payments.reduce((acc, p) => acc + p.amountUsd + (p.igtfUsd || 0), 0);
  const totalBasePaid = payments.reduce((acc, p) => acc + p.amountUsd, 0);
  const remainingBaseUsd = Math.max(0, baseTotalUsd - totalBasePaid);

  useEffect(() => {
    if (isOpen && remainingBaseUsd > 0) {
      handleUsdChange(remainingBaseUsd.toFixed(2));
    }
  }, [isOpen, totalBasePaid, baseTotalUsd]);

  const isWaiter = currentUser?.role === 'waiter';
  const canFinalize = isLicenseActive && !isWaiter && totalBasePaid >= (baseTotalUsd - 0.01);

  const checkLicense = async () => {
    const license = await db.getLicenseStatus();
    setIsLicenseActive(license.status === 'active');
  };
  
  if (!isOpen) return null;

  const needsIgtf = paymentMethod === 'cash_usd' || paymentMethod === 'zelle';
  
  const handleAddPayment = () => {
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) return;

    const igtfAmount = needsIgtf ? amount * igtf : 0;
    
    const newPayment: Payment = {
      method: paymentMethod,
      amountUsd: amount,
      igtfUsd: igtfAmount,
      amountVes: usdToVes(amount + igtfAmount)
    };

    setPayments([...payments, newPayment]);
    setAmountInput('');
    setVesAmountInput('');
  };

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

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
        totalUsd: currentTotalWithIgtf,
        payments: payments,
      });
    } catch (e) {
      console.error("Error saving sale:", e);
    }
    onComplete();
  };

  const totalIgtfPaid = payments.reduce((acc, p) => acc + (p.igtfUsd || 0), 0);

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-5xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col md:flex-row border-brand-accent/20"
      >
        {/* Resumen de Factura */}
        <div className="bg-brand-dark/40 p-8 w-full md:w-[40%] border-b md:border-b-0 md:border-r border-brand-border/30 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-8 text-brand-text/30">
            <Receipt size={24} />
            <span className="font-black uppercase tracking-[0.3em] text-[10px]">Facturación</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-6 tracking-tighter">
            {type && type !== 'table' ? tableNumber : `Mesa #${tableNumber}`}
          </h2>

          <div className="space-y-4 border-b border-brand-border/30 pb-6 mb-6">
            <div className="flex justify-between text-brand-text/60 text-sm">
              <span>Subtotal</span>
              <span className="text-white font-bold">{formatUsd(subtotalUsd)}</span>
            </div>
            <div className="flex justify-between text-brand-text/60 text-sm">
              <span>IVA (16%)</span>
              <span className="text-white font-bold">{formatUsd(ivaAmount)}</span>
            </div>
            {totalIgtfPaid > 0 && (
              <div className="flex justify-between text-brand-highlight text-sm font-bold animate-in fade-in slide-in-from-left-2">
                <span>IGTF (3%)</span>
                <span>{formatUsd(totalIgtfPaid)}</span>
              </div>
            )}
            <div className="flex justify-between text-white font-black pt-2 border-t border-brand-border/10">
              <span>Total a Pagar</span>
              <span className="text-2xl tracking-tighter">{formatUsd(baseTotalUsd + totalIgtfPaid)}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-end">
              <span className="text-brand-text/40 font-black uppercase tracking-widest text-[10px]">Total Recibido (Inc. IGTF)</span>
              <span className="text-3xl font-black text-brand-highlight tracking-tighter">{formatUsd(currentTotalWithIgtf)}</span>
            </div>
            
            <div className="space-y-2">
               <span className="text-brand-text/40 font-black uppercase tracking-widest text-[10px]">Pagos Registrados</span>
               <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {payments.length === 0 ? (
                  <div className="text-[10px] text-brand-text/20 uppercase font-bold text-center py-4 border-2 border-dashed border-brand-border/10 rounded-xl">
                    No hay pagos registrados
                  </div>
                ) : (
                  payments.map((p, i) => (
                    <motion.div 
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      key={i} 
                      className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-brand-border/20 group"
                    >
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-brand-accent uppercase">{p.method.replace('_', ' ')}</span>
                         <span className="text-sm font-bold text-white">{formatUsd(p.amountUsd + (p.igtfUsd || 0))}</span>
                         <span className="text-[9px] text-brand-text/40 font-bold">{formatVes(p.amountVes || 0)}</span>
                         {p.igtfUsd ? <span className="text-[9px] text-brand-highlight font-bold">Incluye IGTF {formatUsd(p.igtfUsd)}</span> : null}
                       </div>
                      <button 
                        onClick={() => removePayment(i)}
                        className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </motion.div>
                  ))
                )}
               </div>
            </div>
          </div>

           <div className="pt-6 border-t border-brand-border/30">
             <div className="flex justify-between items-center mb-4">
               <span className="text-brand-text/40 font-black uppercase tracking-widest text-[10px]">Saldo Restante</span>
               <div className="text-right">
                <span className={`text-2xl font-black block tracking-tighter ${remainingBaseUsd > 0 ? 'text-white' : 'text-green-400'}`}>
                  {remainingBaseUsd > 0 ? formatUsd(remainingBaseUsd) : 'PAGADO'}
                </span>
                {remainingBaseUsd > 0 && (
                  <span className="text-[10px] font-black text-brand-highlight uppercase tracking-widest">
                    {formatVes(usdToVes(remainingBaseUsd))}
                  </span>
                )}
               </div>
             </div>
           </div>
        </div>

        {/* Selección y Monto */}
        <div className="p-8 w-full md:w-[60%] flex flex-col relative bg-brand-card/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-brand-text/40 uppercase tracking-[0.3em]">Gestión de Pagos</h3>
            <button onClick={onClose} className="p-2 glass-card hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
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

            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 border-brand-accent/30 space-y-4">
                <span className="text-[10px] font-black text-brand-text/40 uppercase tracking-widest">Monto a pagar</span>
                 
                 <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/40 font-bold">$</div>
                      <input 
                        type="number" 
                        value={amountInput}
                        onChange={(e) => handleUsdChange(e.target.value)}
                        className="w-full bg-brand-dark/40 border border-brand-border/30 rounded-xl py-4 pl-10 pr-4 text-2xl font-black text-white focus:outline-none focus:border-brand-accent transition-colors"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/40 font-bold text-xs">Bs.</div>
                      <input 
                        type="number" 
                        value={vesAmountInput}
                        onChange={(e) => handleVesChange(e.target.value)}
                        className="w-full bg-brand-dark/40 border border-brand-border/30 rounded-xl py-4 pl-12 pr-4 text-xl font-black text-brand-highlight focus:outline-none focus:border-brand-accent transition-colors"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                 </div>

                 <div className="flex justify-between items-start pt-4 border-t border-brand-border/10">
                    <span className="text-[10px] font-black text-brand-text/40 uppercase tracking-widest mt-1">Resumen</span>
                    <div className="text-right">
                        <div className="text-white text-lg font-black tracking-tighter leading-none mb-1">
                          {formatUsd(parseFloat(amountInput || '0'))}
                        </div>
                        <div className="text-brand-highlight text-[11px] font-bold leading-none">
                          {formatVes(parseFloat(vesAmountInput || '0'))}
                        </div>
                    </div>
                 </div>
                 
                 {needsIgtf && (
                  <div className="flex justify-between items-center text-[10px] font-black text-brand-highlight uppercase italic">
                    <span>+ IGTF (3%)</span>
                    <span>{formatUsd(parseFloat(amountInput || '0') * igtf)}</span>
                  </div>
                )}

                <button 
                  onClick={handleAddPayment}
                  disabled={!amountInput || parseFloat(amountInput) <= 0}
                  className="w-full bg-brand-accent hover:bg-brand-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Plus size={18} strokeWidth={3} /> Agregar Pago
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-end gap-4">
                <motion.button 
                  whileHover={canFinalize ? { scale: 1.02 } : {}}
                  whileTap={canFinalize ? { scale: 0.98 } : {}}
                  onClick={handleFinalize}
                  disabled={!canFinalize}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-2xl transition-all ${
                    canFinalize 
                      ? 'bg-brand-highlight text-brand-dark shadow-brand-highlight/20' 
                      : 'bg-brand-border/20 text-brand-text/20 cursor-not-allowed border border-brand-border/30'
                  }`}
                >
                  {isWaiter ? (
                    <>
                      <ShieldAlert size={20} /> Solo Cajeros
                    </>
                  ) : isLicenseActive ? (
                    <>
                      <CheckCircle2 size={20} strokeWidth={3} /> Finalizar Operación
                    </>
                  ) : (
                    <>
                      <Lock size={18} /> Licencia Inactiva
                    </>
                  )}
                </motion.button>
              </div>
            </div>
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
