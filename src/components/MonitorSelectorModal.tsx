"use client";

import React, { useState, useEffect } from 'react';
import { X, Layers, ExternalLink, Utensils } from 'lucide-react';
import { db, PreparationZone } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MonitorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MonitorSelectorModal({ isOpen, onClose }: MonitorSelectorModalProps) {
  const [zones, setZones] = useState<PreparationZone[]>([]);

  useEffect(() => {
    if (isOpen) {
      db.getZones().then(setZones);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-lg shadow-2xl overflow-hidden border-brand-accent/20"
        >
          <div className="p-8 border-b border-brand-border/30 flex justify-between items-center bg-brand-accent/5">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Seleccionar Monitor</h2>
              <p className="text-[10px] font-bold text-brand-text/40 uppercase tracking-[0.4em] mt-1">Sistemas de Preparación</p>
            </div>
            <button onClick={onClose} className="p-3 glass-card hover:bg-red-500/20 text-brand-text/40"><X size={20} /></button>
          </div>

          <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/kitchen" onClick={onClose}>
              <div className="glass-card p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-accent transition-all group cursor-pointer h-full">
                <div className="bg-brand-accent/10 p-4 rounded-2xl text-brand-accent group-hover:scale-110 transition-transform">
                  <Utensils size={32} />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-widest text-center">Cocina General</span>
              </div>
            </Link>

            {zones.map(zone => (
              <div key={zone.id} className="relative group">
                <Link href={`/kitchen?zoneId=${zone.id}`} onClick={onClose}>
                  <div className="glass-card p-6 flex flex-col items-center justify-center gap-4 hover:border-brand-highlight transition-all group cursor-pointer h-full">
                    <div className="bg-brand-highlight/10 p-4 rounded-2xl text-brand-highlight group-hover:scale-110 transition-transform">
                      <Layers size={32} />
                    </div>
                    <span className="text-xs font-black text-white uppercase tracking-widest text-center">{zone.name}</span>
                  </div>
                </Link>
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    if ((window as any).ipcRenderer) {
                      await (window as any).ipcRenderer.invoke('open-kitchen-window', `?zoneId=${zone.id}`);
                    } else {
                      window.open(`/kitchen?zoneId=${zone.id}`, '_blank');
                    }
                  }}
                  className="absolute top-2 right-2 p-2 text-brand-text/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ExternalLink size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
