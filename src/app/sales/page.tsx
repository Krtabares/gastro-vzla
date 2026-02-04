"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  Search, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag,
  Clock,
  X,
  Trash2,
  Filter,
  CreditCard,
  Smartphone,
  Banknote
} from 'lucide-react';
import Link from 'next/link';
import { db, Sale } from '@/lib/db';
import { useCurrency } from '@/context/CurrencyContext';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function SalesHistoryPage() {
  const { formatUsd, formatVes, exchangeRate, iva, igtf, ivaEnabled, igtfEnabled } = useCurrency();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setHours(0,0,0,0)).toISOString(),
    end: new Date(new Date().setHours(23,59,59,999)).toISOString()
  });

  useEffect(() => {
    loadSales();
  }, [dateRange, statusFilter]);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await db.getSales(
        statusFilter === 'all' ? dateRange.start : undefined, 
        statusFilter === 'all' ? dateRange.end : undefined, 
        statusFilter === 'all'
      );
      setSales(data);
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas anular esta venta? Esta acción eliminará el registro de la base de datos.")) {
      await db.deleteSale(id);
      loadSales();
      setSelectedSale(null);
    }
  };

  const exportToExcel = () => {
    const data = sales.map(s => {
      const dateObj = new Date(s.timestamp);
      
      // Calcular impuestos basados en los pagos si existen
      const totalIgtf = s.payments?.reduce((acc, p) => acc + (p.igtfUsd || 0), 0) || 0;
      const subtotalConIva = s.totalUsd - totalIgtf;
      const subtotalBase = ivaEnabled ? subtotalConIva / (1 + iva) : subtotalConIva;
      const montoIva = ivaEnabled ? subtotalConIva - subtotalBase : 0;

      // Desglose de pagos
      const p_efectivo_usd = s.payments?.filter(p => p.method === 'cash_usd').reduce((acc, p) => acc + p.amountUsd + (p.igtfUsd || 0), 0) || (s.paymentMethod === 'cash_usd' ? s.totalUsd : 0);
      const p_zelle = s.payments?.filter(p => p.method === 'zelle').reduce((acc, p) => acc + p.amountUsd + (p.igtfUsd || 0), 0) || (s.paymentMethod === 'zelle' ? s.totalUsd : 0);
      const p_pago_movil = s.payments?.filter(p => p.method === 'pago_movil').reduce((acc, p) => acc + (p.amountUsd || 0), 0) || (s.paymentMethod === 'pago_movil' ? s.totalUsd : 0);
      const p_punto = s.payments?.filter(p => p.method === 'card').reduce((acc, p) => acc + (p.amountUsd || 0), 0) || (s.paymentMethod === 'card' ? s.totalUsd : 0);
      const p_efectivo_ves = s.payments?.filter(p => p.method === 'cash_ves').reduce((acc, p) => acc + (p.amountUsd || 0), 0) || (s.paymentMethod === 'cash_ves' ? s.totalUsd : 0);

      const row: any = {
        'ID VENTA': s.id.slice(0, 8).toUpperCase(),
        'FECHA': dateObj.toLocaleDateString(),
        'HORA': dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        'ESTADO': s.status === 'closed' ? 'CERRADA' : 'ABIERTA',
        'ITEMS': s.items.length,
        'DETALLE': s.items.map(i => `${i.quantity}x ${i.name}`).join(' | '),
        'SUBTOTAL USD': Number(subtotalBase.toFixed(2))
      };

      if (ivaEnabled) {
        row[`IVA (${(iva * 100).toFixed(0)}%) USD`] = Number(montoIva.toFixed(2));
      }

      if (igtfEnabled || totalIgtf > 0) {
        row[`IGTF (${(igtf * 100).toFixed(0)}%) USD`] = Number(totalIgtf.toFixed(2));
      }

      row['TOTAL USD'] = Number(s.totalUsd.toFixed(2));
      row['TASA BCV'] = exchangeRate;
      row['TOTAL BS'] = Number((s.totalUsd * exchangeRate).toFixed(2));
      row['PAGO EFEC USD'] = Number(p_efectivo_usd.toFixed(2));
      row['PAGO ZELLE'] = Number(p_zelle.toFixed(2));
      row['PAGO P. MOVIL'] = Number(p_pago_movil.toFixed(2));
      row['PAGO PUNTO'] = Number(p_punto.toFixed(2));
      row['PAGO EFEC VES'] = Number(p_efectivo_ves.toFixed(2));

      return row;
    });

    // Crear hoja de trabajo
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Configurar anchos de columna
    const wscols = [
      { wch: 12 }, // ID
      { wch: 12 }, // FECHA
      { wch: 10 }, // HORA
      { wch: 8 },  // ITEMS
      { wch: 40 }, // DETALLE
      { wch: 15 }, // SUBTOTAL
      { wch: 15 }, // IVA
      { wch: 15 }, // IGTF
      { wch: 15 }, // TOTAL USD
      { wch: 12 }, // TASA
      { wch: 20 }, // TOTAL BS
      { wch: 15 }, // EFEC USD
      { wch: 15 }, // ZELLE
      { wch: 15 }, // PAGO MOVIL
      { wch: 15 }, // PUNTO
      { wch: 15 }  // EFEC VES
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial de Ventas");

    // Generar archivo
    XLSX.writeFile(workbook, `Reporte_GastroPos_${dateRange.start.split('T')[0]}.xlsx`);
  };

  const filteredSales = sales.filter(s => s.id.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPeriodUsd = sales.reduce((acc, s) => acc + s.totalUsd, 0);

  const paymentBreakdown = sales.reduce((acc: any, sale) => {
    if (sale.payments) {
      sale.payments.forEach(p => {
        if (!acc[p.method]) acc[p.method] = { count: 0, usd: 0, ves: 0 };
        acc[p.method].count += 1;
        acc[p.method].usd += p.amountUsd + (p.igtfUsd || 0);
        acc[p.method].ves += p.amountVes || 0;
      });
    } else {
      // Fallback para ventas antiguas sin array de pagos
      const method = sale.paymentMethod || 'cash_usd';
      if (!acc[method]) acc[method] = { count: 0, usd: 0, ves: 0 };
      acc[method].count += 1;
      acc[method].usd += sale.totalUsd;
      acc[method].ves += sale.totalUsd * exchangeRate;
    }
    return acc;
  }, {});

  const chartData = sales.reduce((acc: any[], sale) => {
    const hour = new Date(sale.timestamp).getHours() + ":00";
    const existing = acc.find(item => item.name === hour);
    if (existing) {
      existing.value += sale.totalUsd;
    } else {
      acc.push({ name: hour, value: sale.totalUsd });
    }
    return acc;
  }, []).sort((a, b) => parseInt(a.name) - parseInt(b.name));

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 nebula-accent-glow opacity-20" />
      
      {/* Header */}
      <header className="bg-brand-card/20 backdrop-blur-xl border-b border-brand-border/30 px-8 py-6 flex flex-col md:flex-row items-center justify-between sticky top-0 z-40 gap-6">
        <div className="flex items-center gap-6">
          <motion.div whileHover={{ scale: 1.1, x: -5 }}>
            <Link href="/" className="w-12 h-12 rounded-2xl bg-brand-dark/50 border border-brand-border/50 flex items-center justify-center text-brand-text/40 hover:text-white hover:border-brand-accent transition-all shadow-2xl">
              <ArrowLeft size={20} strokeWidth={3} />
            </Link>
          </motion.div>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
              <TrendingUp className="text-brand-accent" /> Historial Operativo
            </h1>
            <p className="text-brand-text/40 text-[10px] font-black uppercase tracking-[0.4em]">Auditoría Financiera</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="glass-card !p-1 flex rounded-2xl">
            <button 
              onClick={() => setStatusFilter('open')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'open' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-brand-text/40 hover:text-brand-text'}`}
            >
              Abiertas
            </button>
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-brand-text/40 hover:text-brand-text'}`}
            >
              Histórico
            </button>
          </div>

          {statusFilter === 'all' && (
            <div className="glass-card !p-1 flex rounded-2xl">
              <button 
                onClick={() => setDateRange({
                  start: new Date(new Date().setHours(0,0,0,0)).toISOString(),
                  end: new Date(new Date().setHours(23,59,59,999)).toISOString()
                })}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${new Date(dateRange.start).getDate() === new Date().getDate() ? 'bg-brand-highlight text-brand-dark shadow-lg shadow-brand-highlight/20' : 'text-brand-text/40 hover:text-brand-text'}`}
              >
                Hoy
              </button>
              <button 
                onClick={() => {
                  const start = new Date();
                  start.setDate(start.getDate() - 7);
                  setDateRange({
                    start: start.toISOString(),
                    end: new Date().toISOString()
                  });
                }}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${new Date(dateRange.start).getDate() !== new Date().getDate() ? 'bg-brand-highlight text-brand-dark shadow-lg shadow-brand-highlight/20' : 'text-brand-text/40 hover:text-brand-text'}`}
              >
                7 Días
              </button>
            </div>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportToExcel}
            className="bg-brand-highlight hover:bg-brand-highlight/90 text-brand-dark px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-brand-highlight/20"
          >
            <Download size={18} strokeWidth={3} /> Excel
          </motion.button>
        </div>
      </header>

      <main className="p-8 flex-1 overflow-auto max-w-7xl mx-auto w-full space-y-8 relative z-10">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox 
            label="Facturación Total" 
            value={formatUsd(totalPeriodUsd)} 
            subValue={formatVes(totalPeriodUsd * exchangeRate)}
            icon={<DollarSign size={24} />}
            accent="accent"
          />
          <StatBox 
            label="Órdenes Cerradas" 
            value={sales.length.toString()} 
            subValue="Transacciones procesadas"
            icon={<ShoppingBag size={24} />}
            accent="highlight"
          />
          <StatBox 
            label="Ticket Promedio" 
            value={formatUsd(sales.length > 0 ? totalPeriodUsd / sales.length : 0)} 
            subValue="Por cada comanda"
            icon={<TrendingUp size={24} />}
            accent="accent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Gráfica */}
          <div className="lg:col-span-2 glass-card p-8 h-[450px] relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-brand-text/40 uppercase tracking-[0.4em] flex items-center gap-3">
                <Filter size={14} className="text-brand-accent" /> Flujo de Caja por Hora
              </h3>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-brand-highlight" />
              </div>
            </div>
            
            <div className="h-full pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272A" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#EDEDED', opacity: 0.3, fontSize: 10, fontWeight: 900}} 
                    dy={15}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#EDEDED', opacity: 0.3, fontSize: 10, fontWeight: 900}}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(124, 58, 237, 0.05)'}}
                    contentStyle={{
                      backgroundColor: '#161618',
                      borderRadius: '16px',
                      border: '1px solid #27272A',
                      padding: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#7C3AED', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="url(#colorValue)" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Listado lateral - AHORA CON BUSQUEDA Y VENTAS */}
          <div className="glass-card flex flex-col h-[450px]">
            <div className="p-6 border-b border-brand-border/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/20" size={16} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ID DE VENTA..."
                  className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-xl pl-12 pr-4 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-brand-accent transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/20">Cargando...</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredSales.map((sale, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={sale.id}
                      onClick={() => setSelectedSale(sale)}
                      className={`p-4 glass-card border-brand-border/20 hover:border-brand-accent/30 cursor-pointer transition-all flex justify-between items-center group ${sale.status === 'closed' ? 'bg-brand-dark/10 opacity-60' : 'bg-brand-dark/20'}`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock size={12} className="text-brand-text/30" />
                          <span className="text-[10px] font-black text-white">
                            {new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {sale.status === 'closed' && (
                            <span className="bg-brand-text/10 text-brand-text/40 px-2 py-0.5 rounded text-[8px] font-black uppercase">Cerrada</span>
                          )}
                        </div>
                        <p className="text-[9px] font-bold text-brand-text/20 uppercase">#{sale.id.slice(0, 8)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-white text-sm leading-none mb-1">{formatUsd(sale.totalUsd)}</p>
                        <p className="text-[9px] font-bold text-brand-highlight uppercase leading-none">{formatVes(sale.totalUsd * exchangeRate)}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              {!loading && filteredSales.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-brand-text/20 opacity-30">
                  <ShoppingBag size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin registros</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métodos de Pago (Ahora abajo en cuadrícula) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <PaymentStatCard 
            label="Efectivo USD"
            method="cash_usd"
            stats={paymentBreakdown.cash_usd}
            icon={<DollarSign className="text-yellow-500" size={20} />}
            gradient="from-yellow-500/10 via-transparent to-transparent"
          />
          <PaymentStatCard 
            label="Zelle"
            method="zelle"
            stats={paymentBreakdown.zelle}
            icon={<CreditCard className="text-purple-500" size={20} />}
            gradient="from-purple-500/10 via-transparent to-transparent"
          />
          <PaymentStatCard 
            label="Pago Móvil"
            method="pago_movil"
            stats={paymentBreakdown.pago_movil}
            icon={<Smartphone className="text-cyan-500" size={20} />}
            gradient="from-cyan-500/10 via-transparent to-transparent"
            showVes
          />
          <PaymentStatCard 
            label="Efectivo BS"
            method="cash_ves"
            stats={paymentBreakdown.cash_ves}
            icon={<Banknote className="text-green-500" size={20} />}
            gradient="from-green-500/10 via-transparent to-transparent"
            showVes
          />
          <PaymentStatCard 
            label="Punto Venta"
            method="card"
            stats={paymentBreakdown.card}
            icon={<CreditCard className="text-orange-500" size={20} />}
            gradient="from-orange-500/10 via-transparent to-transparent"
            showVes
          />
        </div>

      </main>

      {/* Modal Detalle Venta */}
      <AnimatePresence>
        {selectedSale && (
          <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden border-brand-accent/20 flex flex-col"
            >
              <div className="bg-brand-accent p-6 md:p-10 text-white relative shrink-0">
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="absolute right-6 top-6 p-2 glass-card border-white/20 hover:bg-white/10 transition-colors z-10"
                >
                  <X size={20} />
                </button>
                <h2 className="text-2xl font-black uppercase tracking-tight">Venta #{(selectedSale.id || '').slice(0, 8)}</h2>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Ticket Detallado</p>
              </div>

              <div className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-brand-text/40 uppercase tracking-[0.3em] flex items-center gap-3">
                    <span className="w-6 h-[1px] bg-brand-border" /> Items Comandados
                  </h3>
                  <div className="space-y-3">
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-brand-dark/40 border border-brand-border/20 p-4 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="bg-brand-accent/10 w-10 h-10 rounded-xl flex items-center justify-center font-black text-brand-accent border border-brand-accent/20 shrink-0">
                            {item.quantity}
                          </div>
                          <span className="font-black text-white text-sm line-clamp-1">{item.name}</span>
                        </div>
                        <span className="font-black text-white shrink-0 ml-2">{formatUsd(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-brand-border/30 pt-6 space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-brand-text/40 uppercase tracking-widest">Total en Divisas</span>
                    <span className="text-4xl font-black text-white tracking-tighter">{formatUsd(selectedSale.totalUsd)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-brand-highlight/5 border border-brand-highlight/20 p-5 rounded-2xl">
                    <span className="text-xs font-black text-brand-highlight uppercase tracking-widest">Bolívares Totales</span>
                    <span className="text-2xl font-black text-brand-highlight tracking-tighter">{formatVes(selectedSale.totalUsd * exchangeRate)}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10 pt-0 shrink-0">
                <div className="flex gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => deleteSale(selectedSale.id)}
                    className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all flex-1"
                  >
                    <Trash2 size={18} /> Anular
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSale(null)}
                    className="flex-[2] bg-brand-accent text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.4em] transition-all shadow-xl shadow-brand-accent/20"
                  >
                    Regresar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBox({ label, value, subValue, icon, accent }: { label: string, value: string, subValue: string, icon: React.ReactNode, accent: 'accent' | 'highlight' }) {
  const accentColor = accent === 'accent' ? 'text-brand-accent' : 'text-brand-highlight';
  const accentBg = accent === 'accent' ? 'bg-brand-accent/10 border-brand-accent/20' : 'bg-brand-highlight/10 border-brand-highlight/20';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card p-5 flex items-center gap-5 group"
    >
      <div className={`${accentBg} ${accentColor} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[10px] font-black text-brand-text/40 uppercase tracking-[0.2em] mb-0.5 truncate">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter truncate leading-tight">{value}</p>
        <p className={`text-[10px] font-bold uppercase tracking-tight ${accentColor} opacity-60 truncate`}>{subValue}</p>
      </div>
    </motion.div>
  );
}

function PaymentStatCard({ label, stats, icon, gradient, showVes }: any) {
  const { formatUsd, formatVes } = useCurrency();
  const usdVal = stats?.usd || 0;
  const vesVal = stats?.ves || 0;
  const count = stats?.count || 0;

  return (
    <div className={`p-4 rounded-2xl border border-brand-border/20 bg-gradient-to-br ${gradient} flex items-center justify-between group hover:border-brand-accent/40 transition-all`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-dark/50 flex items-center justify-center border border-brand-border/30 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-black text-white">{label}</h4>
          <p className="text-[9px] font-bold text-brand-text/30 uppercase tracking-widest">{count} ENTRADAS</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-black text-white tracking-tighter leading-none">{formatUsd(usdVal)}</p>
        {showVes && (
          <p className="text-[10px] font-bold text-brand-highlight tracking-tight mt-1">{formatVes(vesVal)}</p>
        )}
      </div>
    </div>
  );
}
