"use client";

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Percent, 
  LayoutDashboard, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  X,
  Store,
  DollarSign
} from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

import { db } from '@/lib/db';

export default function OnboardingWizard({ isOpen, onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const { exchangeRate, setExchangeRate, iva, setIva, igtf, setIgtf } = useCurrency();
  
  const [tempRate, setTempRate] = useState(exchangeRate);
  const [tempIva, setTempIva] = useState(iva * 100);
  const [tempIgtf, setTempIgtf] = useState(igtf * 100);
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  if (!isOpen) return null;

  const totalSteps = 5;

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleFinish = async () => {
    localStorage.setItem('gastro_storage_mode', storageMode);
    if (storageMode === 'cloud') {
      localStorage.setItem('gastro_supabase_url', supabaseUrl);
      localStorage.setItem('gastro_supabase_key', supabaseKey);
    }
    
    setExchangeRate(tempRate);
    setIva(tempIva / 100);
    setIgtf(tempIgtf / 100);

    // Re-instanciar DB o recargar para aplicar cambios si es necesario
    // Pero por ahora solo guardamos y cerramos
    
    // Crear 8 mesas por defecto en la base de datos si no hay mesas
    try {
      const existingTables = await db.getTables();
      if (existingTables.length === 0) {
        for (let i = 1; i <= 8; i++) {
          await db.saveTable({
            id: Math.random().toString(36).substr(2, 9),
            number: i.toString().padStart(2, '0'),
            status: 'available'
          });
        }
      }
    } catch (e) {
      console.error("Error creating initial tables:", e);
    }

    onClose();
    window.location.reload(); // Recargar para que db.ts tome la nueva configuración
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Header con Progreso */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">Configuración Inicial</h2>
              <p className="text-sm text-gray-400 font-medium">Paso {step} de {totalSteps}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 w-8 rounded-full transition-all ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Contenido Dinámico */}
        <div className="flex-1 p-10 overflow-y-auto">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Bienvenido a GastroVnzla</h3>
                <p className="text-gray-500 leading-relaxed text-lg">
                  Elige cómo quieres guardar tus datos. Puedes cambiar esto más tarde.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setStorageMode('local')}
                  className={`p-6 rounded-[2rem] border-2 text-left transition-all ${storageMode === 'local' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-2xl ${storageMode === 'local' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <LayoutDashboard size={24} />
                    </div>
                    <span className={`text-xl font-black ${storageMode === 'local' ? 'text-blue-900' : 'text-gray-400'}`}>Local (Solo este PC)</span>
                  </div>
                  <p className="text-sm text-gray-500 pl-16">Tus datos se guardan en el disco duro. Es más rápido y no requiere internet para funcionar.</p>
                </button>

                <button 
                  onClick={() => setStorageMode('cloud')}
                  className={`p-6 rounded-[2rem] border-2 text-left transition-all ${storageMode === 'cloud' ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-2xl ${storageMode === 'cloud' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <TrendingUp size={24} />
                    </div>
                    <span className={`text-xl font-black ${storageMode === 'cloud' ? 'text-blue-900' : 'text-gray-400'}`}>Cloud (Multidispositivo)</span>
                  </div>
                  <p className="text-sm text-gray-500 pl-16">Usa Supabase para sincronizar camareros con tablets y móviles. Requiere internet.</p>
                </button>
              </div>

              {storageMode === 'cloud' && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300 bg-white p-6 rounded-3xl border border-blue-100 shadow-sm">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supabase URL</label>
                    <input 
                      type="text" 
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xyz.supabase.co"
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Supabase Anon Key</label>
                    <input 
                      type="password" 
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      placeholder="eyJhbG..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 px-4 text-sm font-medium outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Tasa de Cambio</h3>
                <p className="text-gray-500 leading-relaxed text-lg">
                  Configura la <strong>Tasa BCV</strong> del día para el cálculo automático en bolívares.
                </p>
              </div>
              <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 space-y-4">
                <label className="text-sm font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} /> Tasa Actual (VES/$)
                </label>
                <input 
                  type="number" 
                  value={tempRate}
                  onChange={(e) => setTempRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl py-4 px-6 text-4xl font-black text-blue-900 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">Impuestos y Fiscalidad</h3>
                <p className="text-gray-500 text-lg">
                  Configura los porcentajes de ley. Podrás cambiarlos luego si es necesario.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-3">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Percent size={16} /> IVA General
                  </label>
                  <input 
                    type="number" 
                    value={tempIva}
                    onChange={(e) => setTempIva(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl py-4 px-6 text-3xl font-black text-gray-800 outline-none"
                  />
                  <p className="text-xs text-gray-400 font-medium">Estándar: 16%</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-3">
                  <label className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Percent size={16} /> IGTF (Divisas)
                  </label>
                  <input 
                    type="number" 
                    value={tempIgtf}
                    onChange={(e) => setTempIgtf(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border-2 border-gray-100 focus:border-blue-500 rounded-2xl py-4 px-6 text-3xl font-black text-gray-800 outline-none"
                  />
                  <p className="text-xs text-gray-400 font-medium">Estándar: 3%</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-center py-6">
              <div className="bg-orange-50 w-20 h-20 rounded-[2rem] flex items-center justify-center text-orange-600 mx-auto mb-6 shadow-xl shadow-orange-100">
                <LayoutDashboard size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Plano de Comedor</h3>
              <p className="text-gray-500 text-lg max-w-sm mx-auto">
                Por defecto, hemos creado las primeras 8 mesas para ti. Puedes editarlas o añadir más en el módulo POS.
              </p>
              <div className="grid grid-cols-4 gap-3 max-w-xs mx-auto mt-8">
                {[1,2,3,4,5,6,7,8].map(n => (
                  <div key={n} className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-400 text-sm">
                    #{n}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in duration-500 text-center py-6">
              <div className="bg-green-500 w-24 h-24 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-green-200">
                <CheckCircle2 size={56} />
              </div>
              <h3 className="text-3xl font-black text-gray-900">¡Todo Listo!</h3>
              <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
                Tu restaurante ya está configurado para operar con <strong>bolívares y dólares</strong> de forma legal y eficiente.
              </p>
              <div className="bg-gray-50 p-6 rounded-3xl max-w-sm mx-auto space-y-2">
                <div className="flex justify-between text-sm font-bold text-gray-600">
                  <span>Tasa Inicial</span>
                  <span>{tempRate.toFixed(2)} VES/$</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-600">
                  <span>IVA Configurado</span>
                  <span>{tempIva}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navegación */}
        <div className="p-8 border-t border-gray-100 flex gap-4 bg-gray-50/50">
          {step > 1 && (
            <button 
              onClick={prevStep}
              className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-white hover:text-gray-700 border-2 border-transparent hover:border-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} /> Atrás
            </button>
          )}
          {step < totalSteps ? (
            <button 
              onClick={nextStep}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-blue-200 transition-all"
            >
              Continuar <ChevronRight size={24} />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-green-200 transition-all animate-bounce-short"
            >
              ¡Comenzar a Vender! <CheckCircle2 size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
