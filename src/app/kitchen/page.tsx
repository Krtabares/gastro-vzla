"use client";

import { useState, useEffect } from "react";
import { useOrders } from "@/context/OrdersContext";
import { 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Utensils, 
  AlertCircle,
  Timer
} from "lucide-react";
import Link from "next/link";

export default function KitchenPage() {
  const { orders, markAsReady } = useOrders();

  return (
    <main className="min-h-screen bg-brand-dark p-4 md:p-8 text-brand-text">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative">
        <div className="nebula-accent-glow -top-40 -left-40" />
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-3 bg-brand-card rounded-2xl border border-brand-border text-brand-text/60 hover:text-brand-text hover:border-brand-accent/50 transition-all active:scale-95"
          >
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 uppercase">Monitor de Cocina</h1>
            <p className="text-brand-text/40 font-medium">Ordenes activas en tiempo real • KDS</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-brand-card/60 backdrop-blur-md px-6 py-3 rounded-bento border border-brand-border flex items-center gap-3 shadow-2xl">
            <div className="w-3 h-3 bg-brand-accent rounded-full animate-pulse shadow-[0_0_12px_rgba(124,58,237,0.5)]"></div>
            <span className="font-bold text-lg tracking-tight">{orders.length} Pedidos</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onReady={() => markAsReady(order.id)} />
        ))}
        
        {orders.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-brand-text/20 border-2 border-dashed border-brand-border rounded-[40px] bg-brand-card/20">
            <Utensils size={80} className="mb-6 opacity-10" />
            <p className="text-2xl font-bold tracking-tight">Cocina despejada</p>
            <p className="text-sm">Esperando nuevos pedidos...</p>
          </div>
        )}
      </div>
    </main>
  );
}

function OrderCard({ order, onReady }: { order: any, onReady: () => void }) {
  const [timeElapsed, setTimeElapsed] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const diff = Math.floor((new Date().getTime() - order.createdAt.getTime()) / 1000 / 60);
      setTimeElapsed(`${diff} min`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  const isDelayed = parseInt(timeElapsed) > 15;

  return (
    <div className={`bg-brand-card rounded-bento overflow-hidden border border-brand-border flex flex-col h-fit transition-all duration-500 ${isDelayed ? 'shadow-[0_0_40px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50' : 'shadow-xl'}`}>
      <div className={`p-5 flex justify-between items-center ${isDelayed ? 'bg-red-500/10' : 'bg-brand-border/30'}`}>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-black tracking-tighter text-white">#{order.tableNumber}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${isDelayed ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-dark text-brand-text/60 border border-brand-border'}`}>
          <Clock size={14} />
          {timeElapsed}
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 bg-gradient-to-b from-transparent to-brand-dark/20">
        {order.items.map((item: { quantity: number; name: string }, idx: number) => (
          <div key={idx} className="flex items-start gap-4 group">
            <div className="bg-brand-accent/10 text-brand-accent w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border border-brand-accent/20 group-hover:bg-brand-accent group-hover:text-white transition-all">
              {item.quantity}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white uppercase tracking-tight leading-tight">{item.name}</span>
              <span className="text-[10px] text-brand-text/30 font-bold tracking-widest uppercase">Preparación estándar</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-5 bg-brand-dark/40 border-t border-brand-border">
        <button 
          onClick={onReady}
          className="w-full bg-brand-accent hover:bg-brand-accent/80 text-white py-4 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-brand-accent/20 group"
        >
          <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" /> 
          Despachar Pedido
        </button>
      </div>
    </div>
  );
}
