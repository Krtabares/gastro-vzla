"use client";

import { useState, useEffect, useRef } from "react";
import { useOrders } from "@/context/OrdersContext";
import { 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Utensils, 
  AlertCircle,
  Timer,
  StickyNote,
  BellRing,
  ShoppingBag,
  Bike
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function KitchenPage() {
  const { orders, markAsReady } = useOrders();
  const prevOrdersRef = useRef(orders);
  const audioNewRef = useRef<HTMLAudioElement | null>(null);
  const audioUpdateRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    // Inicializar audios
    audioNewRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audioUpdateRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
  }, []);

  useEffect(() => {
    if (!audioEnabled) {
      prevOrdersRef.current = orders;
      return;
    }

    const currentLength = orders.length;
    const prevLength = prevOrdersRef.current.length;

    if (currentLength > prevLength) {
      // Nueva orden
      audioNewRef.current?.play().catch(console.error);
    } else if (currentLength === prevLength && currentLength > 0) {
      // Verificar si alguna orden existente cambió sus items o nota
      const isAnyUpdated = orders.some(order => {
        const prev = prevOrdersRef.current.find(p => p.id === order.id);
        const itemsChanged = prev && JSON.stringify(prev.items) !== JSON.stringify(order.items);
        const noteChanged = prev && (prev as any).note !== (order as any).note;
        return itemsChanged || noteChanged;
      });

      if (isAnyUpdated) {
        console.log("Detectada actualización en órdenes, reproduciendo sonido...");
        if (audioUpdateRef.current) {
          audioUpdateRef.current.currentTime = 0;
          audioUpdateRef.current.play().catch(console.error);
        }
      }
    }

    prevOrdersRef.current = orders;
  }, [orders, audioEnabled]);

  const enableAudio = () => {
    setAudioEnabled(true);
    // Reproducir un silencio o el sonido de prueba para desbloquear el audio en el navegador
    audioUpdateRef.current?.play().then(() => {
      audioUpdateRef.current?.pause();
      if (audioUpdateRef.current) audioUpdateRef.current.currentTime = 0;
    }).catch(() => {});
  };

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
        
        <div className="flex items-center gap-4">
          {!audioEnabled ? (
            <button 
              onClick={enableAudio}
              className="bg-brand-highlight/10 text-brand-highlight border border-brand-highlight/30 px-4 py-2 rounded-xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-brand-highlight/20 transition-all animate-pulse"
            >
              <BellRing size={16} /> Activar Sonidos
            </button>
          ) : (
            <div className="text-brand-text/20 flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em]">
              <BellRing size={14} /> Sonidos Activos
            </div>
          )}
          <div className="bg-brand-card/60 backdrop-blur-md px-6 py-3 rounded-bento border border-brand-border flex items-center gap-3 shadow-2xl">
            <div className="w-3 h-3 bg-brand-accent rounded-full animate-pulse shadow-[0_0_12px_rgba(124,58,237,0.5)]"></div>
            <span className="font-bold text-lg tracking-tight">{orders.length} Pedidos</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 25,
                layout: { duration: 0.3 }
              }}
            >
              <OrderCard order={order} onReady={() => markAsReady(order.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {orders.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-32 flex flex-col items-center justify-center text-brand-text/20 border-2 border-dashed border-brand-border rounded-[40px] bg-brand-card/20"
          >
            <Utensils size={80} className="mb-6 opacity-10" />
            <p className="text-2xl font-bold tracking-tight">Cocina despejada</p>
            <p className="text-sm">Esperando nuevos pedidos...</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

function OrderCard({ order, onReady }: { order: any, onReady: () => void }) {
  const [timeElapsed, setTimeElapsed] = useState("");
  const prevItemsHash = useRef(JSON.stringify(order.items));
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    const currentItemsHash = JSON.stringify(order.items);
    if (prevItemsHash.current !== currentItemsHash) {
      setIsUpdated(true);
      // Animación más larga (5 segundos)
      setTimeout(() => setIsUpdated(false), 5000);
      prevItemsHash.current = currentItemsHash;
    }
  }, [order.items]);

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

  const isTakeaway = order.type === 'takeaway';
  const isDelivery = order.type === 'delivery';
  const isExternal = isTakeaway || isDelivery;

  return (
    <motion.div 
      animate={isUpdated ? { 
        scale: [1, 1.05, 1],
        rotate: [0, -1, 1, -1, 0]
      } : {}}
      transition={{ duration: 0.5 }}
      className={`bg-brand-card rounded-bento overflow-hidden border border-brand-border flex flex-col h-fit transition-all duration-500 ${isUpdated ? 'ring-4 ring-brand-highlight shadow-[0_0_50px_rgba(6,182,212,0.3)]' : isDelayed ? 'shadow-[0_0_40px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50' : 'shadow-xl'}`}
    >
      <div className={`p-5 flex justify-between items-center ${isUpdated ? 'bg-brand-highlight/20' : isDelayed ? 'bg-red-500/10' : 'bg-brand-border/30'}`}>
        <div className="flex items-center gap-2">
          {isExternal ? (
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white uppercase truncate max-w-[150px]">{order.tableNumber}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-highlight flex items-center gap-1">
                {isTakeaway ? <ShoppingBag size={10} /> : <Bike size={10} />}
                {isTakeaway ? 'Llevar' : 'Delivery'}
              </span>
            </div>
          ) : (
            <span className="text-3xl font-black tracking-tighter text-white">#{order.tableNumber}</span>
          )}
          {isUpdated && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-brand-highlight text-brand-dark text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter"
            >
              ¡Actualizada!
            </motion.span>
          )}
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

        {order.note && (
          <div className="mt-6 bg-brand-highlight/10 border-2 border-brand-highlight/30 p-4 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-highlight" />
            <div className="flex items-start gap-3">
              <StickyNote size={18} className="text-brand-highlight shrink-0 mt-1" />
              <div>
                <p className="text-[10px] font-black text-brand-highlight uppercase tracking-[0.2em] mb-1">Nota Especial</p>
                <p className="text-lg font-black text-white leading-tight italic">
                  "{order.note}"
                </p>
              </div>
            </div>
          </div>
        )}
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
    </motion.div>
  );
}
