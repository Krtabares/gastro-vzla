"use client";

import React, { useState, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { X, Save, TrendingUp, Percent, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/lib/db';

export default function ExchangeRateModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { 
    exchangeRate, setExchangeRate, 
    iva, setIva, 
    igtf, setIgtf, 
    ivaEnabled, setIvaEnabled,
    igtfEnabled, setIgtfEnabled,
    suggestedRate 
  } = useCurrency();
  const [tempRate, setTempRate] = useState(exchangeRate);
  const [tempIva, setTempIva] = useState(iva * 100);
  const [tempIgtf, setTempIgtf] = useState(igtf * 100);
  const [tempIvaEnabled, setTempIvaEnabled] = useState(ivaEnabled);
  const [tempIgtfEnabled, setTempIgtfEnabled] = useState(igtfEnabled);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setTempRate(exchangeRate);
    setTempIva(iva * 100);
    setTempIgtf(igtf * 100);
    setTempIvaEnabled(ivaEnabled);
    setTempIgtfEnabled(igtfEnabled);
    const userJson = localStorage.getItem('gastro_user');
    if (userJson) setCurrentUser(JSON.parse(userJson));
  }, [exchangeRate, iva, igtf, ivaEnabled, igtfEnabled, isOpen]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'root' || currentUser?.role === 'admin';

  const handleSave = () => {
    if (!isAdmin) return;
    setExchangeRate(tempRate);
    setIva(tempIva / 100);
    setIgtf(tempIgtf / 100);
    setIvaEnabled(tempIvaEnabled);
    setIgtfEnabled(tempIgtfEnabled);
    onClose();
  };

  const applySuggested = () => {
    if (!isAdmin) return;
    if (suggestedRate) {
      setTempRate(suggestedRate);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[250] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card w-full max-w-md shadow-2xl overflow-hidden border-brand-accent/20"
      >
        <div className="p-8 border-b border-brand-border/30 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Economía</h2>
            <p className="text-[10px] font-bold text-brand-text/40 uppercase tracking-widest mt-1">Configuración Fiscal</p>
          </div>
          <button onClick={onClose} className="p-2 glass-card hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-brand-text/40 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                <TrendingUp size={14} className="text-brand-accent" /> Tasa de Cambio (VES/$)
              </label>
              {isAdmin && suggestedRate && suggestedRate !== tempRate && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  onClick={applySuggested}
                  className="text-[9px] font-black text-brand-highlight hover:text-white flex items-center gap-2 bg-brand-highlight/10 border border-brand-highlight/20 px-3 py-1 rounded-full transition-all"
                >
                  <ArrowUpRight size={12} /> Sugerido: {suggestedRate}
                </motion.button>
              )}
            </div>
            <div className="relative">
              <input 
                type="number" 
                step="0.01"
                disabled={!isAdmin}
                value={tempRate}
                onChange={(e) => setTempRate(parseFloat(e.target.value) || 0)}
                className={`w-full bg-brand-dark/50 border border-brand-border/50 rounded-2xl py-5 px-6 text-3xl font-black text-white focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 outline-none transition-all tracking-tighter ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-brand-text/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Percent size={14} className="text-brand-accent" /> IVA (%)
                </label>
                <button 
                  onClick={() => isAdmin && setTempIvaEnabled(!tempIvaEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${tempIvaEnabled ? 'bg-brand-accent' : 'bg-brand-border/30'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${tempIvaEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <input 
                type="number" 
                disabled={!isAdmin || !tempIvaEnabled}
                value={tempIva}
                onChange={(e) => setTempIva(parseFloat(e.target.value) || 0)}
                className={`w-full bg-brand-dark/50 border border-brand-border/50 rounded-2xl py-4 px-6 text-xl font-black text-white focus:border-brand-accent outline-none transition-all ${(!isAdmin || !tempIvaEnabled) ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-brand-text/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Percent size={14} className="text-brand-accent" /> IGTF (%)
                </label>
                <button 
                  onClick={() => isAdmin && setTempIgtfEnabled(!tempIgtfEnabled)}
                  className={`w-8 h-4 rounded-full transition-colors relative ${tempIgtfEnabled ? 'bg-brand-accent' : 'bg-brand-border/30'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${tempIgtfEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <input 
                type="number" 
                disabled={!isAdmin || !tempIgtfEnabled}
                value={tempIgtf}
                onChange={(e) => setTempIgtf(parseFloat(e.target.value) || 0)}
                className={`w-full bg-brand-dark/50 border border-brand-border/50 rounded-2xl py-4 px-6 text-xl font-black text-white focus:border-brand-accent outline-none transition-all ${(!isAdmin || !tempIgtfEnabled) ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-brand-dark/40 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest text-brand-text/40 hover:bg-brand-border/20 transition-all"
          >
            {isAdmin ? 'Cancelar' : 'Cerrar'}
          </button>
          {isAdmin && (
            <button 
              onClick={handleSave}
              className="flex-1 bg-brand-accent hover:bg-brand-accent/90 text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-brand-accent/20 transition-all"
            >
              <Save size={18} strokeWidth={3} /> Guardar
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
