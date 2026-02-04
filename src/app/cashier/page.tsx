"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { useOrders } from "@/context/OrdersContext";
import { db, Table, supabase, Order } from "@/lib/db";
import { 
  ChevronLeft, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Utensils, 
  Package, 
  ShoppingBag, 
  Bike,
  Search,
  ArrowRight,
  LayoutDashboard,
  History
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CashierMonitorPage() {
  const { formatUsd, formatVes, usdToVes } = useCurrency();
  const { orders } = useOrders();
  const [tables, setTables] = useState<Table[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    loadTables();
    loadHistory();

    if (supabase) {
      const currentSupabase = supabase;
      const channel = currentSupabase
        .channel('realtime-cashier-tables')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tables' },
          () => loadTables()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
          () => loadHistory()
        )
        .subscribe();

      return () => {
        currentSupabase.removeChannel(channel);
      };
    }
  }, []);

  const loadTables = async () => {
    const data = await db.getTables();
    setTables(data.filter(t => t.status !== 'available'));
  };

  const loadHistory = async () => {
    const data = await db.getSales(undefined, undefined, true);
    setSalesHistory(data);
  };

  const filteredTables = tables.filter(t => 
    t.number.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = salesHistory.filter(s => {
    const searchLower = search.toLowerCase();
    const idMatches = s.id.toLowerCase().includes(searchLower);
    const itemMatches = s.items?.some((item: any) => 
      item.name.toLowerCase().includes(searchLower)
    );
    return idMatches || itemMatches;
  });

  // Helper to determine order state
  const getOrderState = (table: Table) => {
    const kitchenOrder = orders.find(o => o.tableNumber === table.number);
    if (table.status === 'partially_ready') return { label: 'DESPACHO PARCIAL', color: 'text-orange-400 bg-orange-400/10', icon: <CheckCircle2 size={14} /> };
    if (kitchenOrder) return { label: 'EN COCINA', color: 'text-brand-accent bg-brand-accent/10', icon: <Utensils size={14} /> };
    if (table.status === 'ready') return { label: 'LISTO / DESPACHADO', color: 'text-[#00FF9D] bg-[#00FF9D]/10', icon: <CheckCircle2 size={14} /> };
    if (table.status === 'billing') return { label: 'PIDIÓ CUENTA', color: 'text-brand-highlight bg-brand-highlight/10', icon: <DollarSign size={14} /> };
    return { label: 'CONSUMIENDO', color: 'text-white/40 bg-white/5', icon: <Clock size={14} /> };
  };

  return (
    <main className="min-h-screen bg-brand-dark p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 nebula-accent-glow opacity-20" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-5">
              <Link 
                href="/" 
                className="p-3 glass-card text-brand-text/40 hover:text-white transition-all"
              >
                <ChevronLeft size={24} />
              </Link>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight uppercase">Monitor de Caja</h1>
                <p className="text-brand-text/40 font-bold uppercase tracking-[0.4em] text-[10px]">Control de Órdenes {activeTab === 'active' ? 'Activas' : 'Finalizadas'}</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-brand-card/40 p-1.5 rounded-2xl border border-brand-border/50">
              <button 
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-brand-text/40 hover:text-white'}`}
              >
                <LayoutDashboard size={14} />
                Activos
                {tables.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[9px]">{tables.length}</span>}
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-brand-text/40 hover:text-white'}`}
              >
                <History size={14} />
                Historial
              </button>
            </div>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/20" size={20} />
            <input 
              type="text"
              placeholder={activeTab === 'active' ? "BUSCAR MESA..." : "BUSCAR POR ID O PRODUCTO..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-brand-card/40 border border-brand-border/50 rounded-2xl py-4 pl-12 pr-4 text-xs font-black uppercase tracking-widest focus:border-brand-accent outline-none transition-all placeholder:text-brand-text/10"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {activeTab === 'active' ? (
              filteredTables.map((table, idx) => (
                <CashierCard 
                  key={table.id} 
                  table={table} 
                  state={getOrderState(table)}
                  idx={idx}
                  formatUsd={formatUsd}
                  formatVes={formatVes}
                  usdToVes={usdToVes}
                />
              ))
            ) : (
              filteredHistory.map((sale, idx) => (
                <HistoryCard 
                  key={sale.id}
                  sale={sale}
                  idx={idx}
                  formatUsd={formatUsd}
                  formatVes={formatVes}
                  usdToVes={usdToVes}
                />
              ))
            )}
          </AnimatePresence>

          {activeTab === 'active' && filteredTables.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-brand-text/20 border-2 border-dashed border-brand-border rounded-[40px] bg-brand-card/20">
              <LayoutDashboard size={80} className="mb-6 opacity-10" />
              <p className="text-2xl font-bold tracking-tight uppercase">No hay órdenes activas</p>
              <p className="text-xs font-black tracking-widest opacity-40">Todo está al día en caja.</p>
            </div>
          )}

          {activeTab === 'history' && filteredHistory.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-brand-text/20 border-2 border-dashed border-brand-border rounded-[40px] bg-brand-card/20">
              <History size={80} className="mb-6 opacity-10" />
              <p className="text-2xl font-bold tracking-tight uppercase">Historial vacío</p>
              <p className="text-xs font-black tracking-widest opacity-40">No se encontraron ventas finalizadas.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function HistoryCard({ sale, idx, formatUsd, formatVes, usdToVes }: any) {
  const date = new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fullDate = new Date(sale.timestamp).toLocaleDateString([], { day: '2-digit', month: 'short' });
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="glass-card flex flex-col h-full border border-white/5 hover:border-brand-accent/20 transition-all overflow-hidden group"
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tighter uppercase leading-none">
                VENTA #{sale.id.slice(0, 8)}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} /> {date}
                </p>
                <span className="w-1 h-1 bg-brand-text/20 rounded-full" />
                <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest">
                  {fullDate}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="bg-brand-dark/20 rounded-2xl p-4 border border-brand-border/20 max-h-[150px] overflow-y-auto custom-scrollbar">
            <p className="text-[9px] font-black text-brand-text/20 uppercase tracking-[0.2em] mb-3">Resumen de Venta</p>
            <div className="space-y-2">
              {sale.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-[11px]">
                  <span className="text-white/60 font-bold uppercase truncate max-w-[140px]">
                    <span className="text-brand-accent/60 mr-1">{item.quantity}x</span> {item.name}
                  </span>
                  <span className="text-brand-text/30 font-black">{formatUsd(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest">Total Pagado</span>
              <span className="text-2xl font-black text-brand-accent tracking-tighter">{formatUsd(sale.totalUsd)}</span>
            </div>
            <div className="flex justify-between items-center text-brand-highlight/60 text-[11px] font-black uppercase">
              <span className="text-[9px]">En Bolívares</span>
              <span>{formatVes(usdToVes(sale.totalUsd))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-3 bg-white/5 flex items-center justify-between">
        <span className="text-[9px] font-black text-brand-text/40 uppercase tracking-widest">Método:</span>
        <span className="text-[9px] font-black text-white uppercase tracking-widest bg-brand-accent/20 px-2 py-1 rounded-md">
          {sale.paymentMethod?.replace('_', ' ') || 'Varios'}
        </span>
      </div>
    </motion.div>
  );
}


function CashierCard({ table, state, idx, formatUsd, formatVes, usdToVes }: any) {
  const isExternal = table.type === 'takeaway' || table.type === 'delivery';
  const total = table.currentTotalUsd || 0;
  
  // Parsear items de la orden
  let items = [];
  try {
    if (table.orderData) {
      items = JSON.parse(table.orderData);
    }
  } catch (e) {
    console.error("Error parsing orderData:", e);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -5 }}
      className="glass-card flex flex-col h-full border-2 border-transparent hover:border-brand-accent/20 transition-all overflow-hidden"
    >
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isExternal ? (table.type === 'takeaway' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-highlight/10 text-brand-highlight') : 'bg-white/5 text-white/40'}`}>
              {table.type === 'takeaway' ? <ShoppingBag size={20} /> : table.type === 'delivery' ? <Bike size={20} /> : <Utensils size={20} />}
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                {isExternal ? table.number : `MESA #${table.number}`}
              </h3>
              <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest mt-1">
                {table.type === 'delivery' ? 'Delivery' : table.type === 'takeaway' ? 'Para Llevar' : 'Comedor'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${state.color}`}>
            {state.icon}
            {state.label}
          </div>

          {/* Lista de Items */}
          <div className="bg-brand-dark/20 rounded-2xl p-4 border border-brand-border/20 max-h-[150px] overflow-y-auto custom-scrollbar">
            <p className="text-[9px] font-black text-brand-text/20 uppercase tracking-[0.2em] mb-3">Detalle del Pedido</p>
            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-white/80 font-bold uppercase truncate max-w-[140px]">
                      <span className="text-brand-accent mr-1">{item.quantity}x</span> {item.product.name}
                    </span>
                    <span className="text-brand-text/40 font-black">{formatUsd(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-brand-text/10 italic py-2 text-center">Sin productos registrados</p>
            )}
          </div>

          <div className="bg-brand-dark/40 rounded-2xl p-4 border border-brand-border/30 mt-auto">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest">Total a Cobrar</span>
              <span className="text-2xl font-black text-white tracking-tighter">{formatUsd(total)}</span>
            </div>
            <div className="flex justify-between items-center text-brand-highlight text-[11px] font-black uppercase">
              <span>Monto en Bs.</span>
              <span>{formatVes(usdToVes(total))}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-brand-dark/60 border-t border-brand-border/50">
        <Link href={`/pos?tableId=${table.id}`}>
          <button className="w-full bg-brand-accent hover:bg-brand-accent/80 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-brand-accent/20">
            Ir a Cobrar <ArrowRight size={16} />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}
