"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Utensils, DollarSign, Tag, Box, Layers } from 'lucide-react';
import { db, Category, Product, PreparationZone } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: { id?: string, name: string, category: string, priceUsd: number, stock?: number, minStock?: number, zoneId?: string }) => void;
  editingProduct?: Product | null;
}

export default function ProductModal({ isOpen, onClose, onSave, editingProduct }: ProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [stock, setStock] = useState('');
  const [minStock, setMinStock] = useState('');
  const [hasStock, setHasStock] = useState(false);
  const [zoneId, setZoneId] = useState('');
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [zones, setZones] = useState<PreparationZone[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (editingProduct) {
        setName(editingProduct.name);
        setCategory(editingProduct.category);
        setPriceUsd(editingProduct.price.toString());
        setHasStock(editingProduct.stock !== undefined && editingProduct.stock !== -1);
        setStock(editingProduct.stock?.toString() || '');
        setMinStock(editingProduct.minStock?.toString() || '');
        setZoneId(editingProduct.zoneId || '');
      } else {
        setName('');
        setPriceUsd('');
        setStock('');
        setMinStock('');
        setHasStock(false);
        setZoneId('');
      }
    }
  }, [isOpen, editingProduct]);

  const loadInitialData = async () => {
    const [cats, zns] = await Promise.all([
      db.getCategories(),
      db.getZones()
    ]);
    setCustomCategories(cats);
    setZones(zns);
    
    if (editingProduct) {
      setCategory(editingProduct.category);
      setZoneId(editingProduct.zoneId || '');
    } else {
      if (cats.length > 0) setCategory(cats[0].name);
      else setCategory('');
      
      if (zns.length > 0) setZoneId(zns[0].id);
      else setZoneId('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !priceUsd) return;
    onSave({
      id: editingProduct?.id,
      name,
      category,
      priceUsd: parseFloat(priceUsd),
      stock: hasStock ? parseFloat(stock) : undefined,
      minStock: hasStock ? parseFloat(minStock) : undefined,
      zoneId: zoneId || undefined
    });
    setName('');
    setPriceUsd('');
    setStock('');
    setMinStock('');
    setHasStock(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-card w-full max-w-lg shadow-2xl overflow-hidden border-brand-accent/20"
          >
            {/* Header */}
            <div className="p-8 border-b border-brand-border/30 flex justify-between items-center bg-brand-accent/5">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <p className="text-[10px] font-bold text-brand-text/40 uppercase tracking-[0.4em] mt-1">Gestión de Catálogo</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-3 glass-card hover:bg-red-500/20 hover:text-red-400 transition-all text-brand-text/40"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Nombre */}
                <div className="space-y-3 col-span-full">
                  <label className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Utensils size={14} className="text-brand-accent" /> Nombre del Ítem
                  </label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="EJ. PIZZA NEBULA SPECIAL..."
                    className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-2xl py-4 px-5 text-sm font-black uppercase tracking-widest text-white outline-none focus:border-brand-accent transition-all placeholder:text-brand-text/10"
                  />
                </div>

                {/* Categoría */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Layers size={14} className="text-brand-highlight" /> Categoría
                  </label>
                  <div className="relative">
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-2xl py-4 px-5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-highlight appearance-none transition-all"
                    >
                      {customCategories.length === 0 && (
                        <option value="" className="bg-brand-card">Sin categorías</option>
                      )}
                      {customCategories.map(cat => (
                        <option key={cat.id} value={cat.name} className="bg-brand-card">{cat.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-text/20">
                      <Tag size={16} />
                    </div>
                  </div>
                </div>

                  {/* Precio */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] flex items-center gap-2">
                      <DollarSign size={14} className="text-green-400" /> Precio (USD)
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={priceUsd}
                        onChange={(e) => setPriceUsd(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-2xl py-4 px-5 text-lg font-black text-white outline-none focus:border-brand-accent transition-all placeholder:text-brand-text/10 tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Zona de Preparación */}
                  <div className="space-y-3 col-span-full">
                    <label className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] flex items-center gap-2">
                      <Layers size={14} className="text-brand-accent" /> Zona de Preparación
                    </label>
                    <div className="relative">
                      <select 
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                        className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-2xl py-4 px-5 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-brand-accent appearance-none transition-all"
                      >
                        <option value="" className="bg-brand-card">General / Cocina</option>
                        {zones.map(zone => (
                          <option key={zone.id} value={zone.id} className="bg-brand-card">{zone.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-text/20">
                        <Tag size={16} />
                      </div>
                    </div>
                  </div>
                </div>


              {/* Inventario Toggle */}
              <div className="space-y-4 pt-4 border-t border-brand-border/20">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={hasStock}
                      onChange={(e) => setHasStock(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${hasStock ? 'bg-brand-highlight' : 'bg-brand-border/50'}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${hasStock ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-[10px] font-black text-brand-text/40 uppercase tracking-widest group-hover:text-brand-text transition-colors">Activar Control de Inventario</span>
                </label>
                
                <AnimatePresence>
                  {hasStock && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="grid grid-cols-2 gap-4 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-text/20 uppercase tracking-widest flex items-center gap-2">
                          <Box size={12} /> Stock Actual
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          required={hasStock}
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-brand-dark/30 border border-brand-border/30 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-brand-highlight transition-all tabular-nums"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-brand-text/20 uppercase tracking-widest flex items-center gap-2">
                          <X size={12} /> Stock Mínimo
                        </label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={minStock}
                          onChange={(e) => setMinStock(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-brand-dark/30 border border-brand-border/30 rounded-xl py-3 px-4 text-sm font-black text-white outline-none focus:border-brand-highlight transition-all tabular-nums"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Botones */}
              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-5 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-brand-text/40 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-brand-border/50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[1.5] bg-brand-accent hover:bg-brand-accent/90 text-white py-5 px-6 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-brand-accent/20 transition-all active:scale-[0.98] uppercase text-[10px] tracking-[0.2em]"
                >
                  <Save size={18} strokeWidth={3} /> {editingProduct ? 'Actualizar Ítem' : 'Guardar Ítem'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
