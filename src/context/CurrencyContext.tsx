"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/db';

interface CurrencyContextType {
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  iva: number;
  setIva: (rate: number) => void;
  igtf: number;
  setIgtf: (rate: number) => void;
  ivaEnabled: boolean;
  setIvaEnabled: (enabled: boolean) => void;
  igtfEnabled: boolean;
  setIgtfEnabled: (enabled: boolean) => void;
  usdToVes: (usd: number) => number;
  vesToUsd: (ves: number) => number;
  formatUsd: (amount: number) => string;
  formatVes: (amount: number) => string;
  loading: boolean;
  suggestedRate: number | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [exchangeRate, setExchangeRate] = useState(36.50); 
  const [iva, setIva] = useState(0.16);
  const [igtf, setIgtf] = useState(0.03);
  const [ivaEnabled, setIvaEnabled] = useState(true);
  const [igtfEnabled, setIgtfEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [suggestedRate, setSuggestedRate] = useState<number | null>(null);

  // Cargar settings iniciales
  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await db.getSettings();
        if (settings) {
          setExchangeRate(settings.exchangeRate);
          setIva(settings.iva);
          setIgtf(settings.igtf);
          setIvaEnabled(settings.ivaEnabled ?? true);
          setIgtfEnabled(settings.igtfEnabled ?? true);
        }
        
        // Intentar obtener tasa oficial
        try {
          const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
          const data = await response.json();
          if (data && data.promedio) {
            setSuggestedRate(data.promedio);
          }
        } catch (apiError) {
          console.warn("Could not fetch BCV rate:", apiError);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSetExchangeRate = (rate: number) => {
    setExchangeRate(rate);
    db.updateSetting('exchangeRate', rate);
  };

  const handleSetIva = (rate: number) => {
    setIva(rate);
    db.updateSetting('iva', rate);
  };

  const handleSetIgtf = (rate: number) => {
    setIgtf(rate);
    db.updateSetting('igtf', rate);
  };

  const handleSetIvaEnabled = (enabled: boolean) => {
    setIvaEnabled(enabled);
    db.updateSetting('ivaEnabled', enabled);
  };

  const handleSetIgtfEnabled = (enabled: boolean) => {
    setIgtfEnabled(enabled);
    db.updateSetting('igtfEnabled', enabled);
  };

  const usdToVes = (usd: number) => usd * exchangeRate;
  const vesToUsd = (ves: number) => ves / exchangeRate;

  const formatUsd = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatVes = (amount: number) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
    }).format(amount);
  };

  return (
    <CurrencyContext.Provider value={{ 
      exchangeRate, 
      setExchangeRate: handleSetExchangeRate, 
      iva, 
      setIva: handleSetIva,
      igtf, 
      setIgtf: handleSetIgtf,
      ivaEnabled,
      setIvaEnabled: handleSetIvaEnabled,
      igtfEnabled,
      setIgtfEnabled: handleSetIgtfEnabled,
      usdToVes, 
      vesToUsd, 
      formatUsd, 
      formatVes,
      loading,
      suggestedRate
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
