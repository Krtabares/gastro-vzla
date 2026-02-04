"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Layers, Trash2, Plus } from 'lucide-react';
import { db, PreparationZone } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';

interface ZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ZonesModal({ isOpen, onClose }: ZonesModalProps) {
  const [zones, setZones] = useState<PreparationZone[]>([]);
  const [newZoneName, setNewZoneName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadZones();
    }
  }, [isOpen]);

  const loadZones = async () => {
    const data = await db.getZones();
    setZones(data);
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    const newZone: PreparationZone = {
      id: Math.random().toString(36).substr(2, 9),
      name: newZoneName.trim().toUpperCase()
    };

    await db.saveZone(newZone);
    setNewZoneName('');
    loadZones();
  };

  const handleDeleteZone = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta zona? Los productos asignados a ella quedarán sin zona.')) {
      await db.deleteZone(id);
      loadZones();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-card w-full max-w-md shadow-2xl overflow-hidden border-brand-accent/20"
        >
          <div className="p-8 border-b border-brand-border/30 flex justify-between items-center bg-brand-accent/5">
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Zonas de Preparación</h2>
              <p className="text-[10px] font-bold text-brand-text/40 uppercase tracking-[0.4em] mt-1">Configuración Multizona</p>
            </div>
            <button onClick={onClose} className="p-3 glass-card hover:bg-red-500/20 text-brand-text/40"><X size={20} /></button>
          </div>

          <div className="p-8 space-y-6">
            <form onSubmit={handleAddZone} className="flex gap-3">
              <input 
                type="text" 
                value={newZoneName}
                onChange={(e) => setNewZoneName(e.target.value)}
                placeholder="EJ. BARRA, POSTRES..."
                className="flex-1 bg-brand-dark/50 border border-brand-border/50 rounded-xl px-4 py-3 text-sm font-black uppercase text-white outline-none focus:border-brand-accent"
              />
              <button type="submit" className="bg-brand-accent text-white p-3 rounded-xl hover:bg-brand-accent/90 transition-all">
                <Plus size={20} />
              </button>
            </form>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
              {zones.length === 0 ? (
                <p className="text-center text-brand-text/20 py-10 uppercase text-[10px] font-black tracking-widest">No hay zonas creadas</p>
              ) : (
                zones.map(zone => (
                  <div key={zone.id} className="flex items-center justify-between p-4 bg-brand-dark/30 border border-brand-border/30 rounded-2xl group hover:border-brand-accent/30 transition-all">
                    <div className="flex items-center gap-3">
                      <Layers size={16} className="text-brand-accent" />
                      <span className="text-sm font-black text-white uppercase">{zone.name}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteZone(zone.id)}
                      className="text-brand-text/10 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
