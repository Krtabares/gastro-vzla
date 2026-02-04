"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useOrders } from "@/context/OrdersContext";
import { db, PreparationZone } from "@/lib/db";
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
  Bike,
  Layers
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function KitchenContent() {
  const { orders, markAsReady, revertToKitchen } = useOrders();
  const searchParams = useSearchParams();
  const zoneIdParam = searchParams.get('zoneId');
  
  const [zones, setZones] = useState<PreparationZone[]>([]);
  const [currentZone, setCurrentZone] = useState<PreparationZone | null>(null);

  const prevOrdersRef = useRef(orders);
  const audioNewRef = useRef<HTMLAudioElement | null>(null);
  const audioUpdateRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    loadZones();
    // Inicializar audios
    audioNewRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audioUpdateRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3");
  }, []);

  const loadZones = async () => {
    const zns = await db.getZones();
    setZones(zns);
    if (zoneIdParam) {
      const zone = zns.find(z => z.id === zoneIdParam);
      if (zone) setCurrentZone(zone);
    }
  };

  // Filtrar órdenes por zona
  const filteredOrders = orders.filter(o => {
    if (!zoneIdParam) return !o.zoneId; // Si no hay param, mostramos lo que no tiene zona (general)
    return o.zoneId === zoneIdParam;
  });

  const pendingOrders = filteredOrders.filter(o => o.status !== 'ready');
  const historyOrders = filteredOrders
    .filter(o => o.status === 'ready')
    .sort((a, b) => (b.dispatchedAt?.getTime() || 0) - (a.dispatchedAt?.getTime() || 0));

  useEffect(() => {
    if (!audioEnabled) {
      prevOrdersRef.current = orders;
      return;
    }

    // Solo nos interesan los cambios en las órdenes filtradas por zona para el sonido
    const prevFilteredPending = prevOrdersRef.current.filter(o => {
      const isPending = o.status !== 'ready';
      const isCorrectZone = !zoneIdParam ? !o.zoneId : o.zoneId === zoneIdParam;
      return isPending && isCorrectZone;
    });

    if (pendingOrders.length > prevFilteredPending.length) {
      // Nueva orden para esta zona
      audioNewRef.current?.play().catch(console.error);
    } else if (pendingOrders.length === prevFilteredPending.length && pendingOrders.length > 0) {
      // Verificar si alguna orden existente de esta zona cambió sus items o nota
      const isAnyUpdated = pendingOrders.some(order => {
        const prev = prevFilteredPending.find(p => p.id === order.id);
        if (!prev) return false;
        const itemsChanged = JSON.stringify(prev.items) !== JSON.stringify(order.items);
        const noteChanged = (prev as any).note !== (order as any).note;
        return itemsChanged || noteChanged;
      });

      if (isAnyUpdated) {
        if (audioUpdateRef.current) {
          audioUpdateRef.current.currentTime = 0;
          audioUpdateRef.current.play().catch(console.error);
        }
      }
    }

    prevOrdersRef.current = orders;
  }, [orders, audioEnabled, pendingOrders.length, zoneIdParam]);

  const enableAudio = () => {
    setAudioEnabled(true);
    audioUpdateRef.current?.play().then(() => {
      audioUpdateRef.current?.pause();
      if (audioUpdateRef.current) audioUpdateRef.current.currentTime = 0;
    }).catch(() => {});
  };

  return (
    <main className="min-h-screen bg-brand-dark p-4 md:p-8 text-brand-text">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative">
        <div className="nebula-accent-glow -top-40 -left-40" />
        <div className="flex flex-col md:flex-row md:items-center gap-6 w-full md:w-auto">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-3 bg-brand-card rounded-2xl border border-brand-border text-brand-text/60 hover:text-brand-text hover:border-brand-accent/50 transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 uppercase flex items-center gap-3">
                Monitor: {currentZone ? currentZone.name : 'Cocina General'}
                <Layers className="text-brand-accent" size={24} />
              </h1>
              <p className="text-brand-text/40 font-bold text-[10px] uppercase tracking-[0.2em]">{activeTab === 'pending' ? 'Ordenes activas en tiempo real' : 'Historial de despacho reciente'}</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-brand-card/40 p-1.5 rounded-2xl border border-brand-border/50">
            <button 
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-brand-text/40 hover:text-white'}`}
            >
              <Timer size={14} />
              Pendientes
              {pendingOrders.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-[9px]">{pendingOrders.length}</span>}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-brand-accent text-white shadow-lg shadow-brand-accent/20' : 'text-brand-text/40 hover:text-white'}`}
            >
              <CheckCircle2 size={14} />
              Historial
            </button>
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
            <div className={`w-3 h-3 ${activeTab === 'pending' ? 'bg-brand-accent animate-pulse' : 'bg-brand-text/20'} rounded-full shadow-[0_0_12px_rgba(124,58,237,0.5)]`}></div>
            <span className="font-bold text-lg tracking-tight">{activeTab === 'pending' ? pendingOrders.length : historyOrders.length} Pedidos</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {(activeTab === 'pending' ? pendingOrders : historyOrders).map((order) => (
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
              <OrderCard 
                order={order} 
                onReady={() => markAsReady(order.id)} 
                onRecover={() => revertToKitchen(order.id)}
                isHistory={activeTab === 'history'}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {activeTab === 'pending' && pendingOrders.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-32 flex flex-col items-center justify-center text-brand-text/20 border-2 border-dashed border-brand-border rounded-[40px] bg-brand-card/20"
          >
            <Utensils size={80} className="mb-6 opacity-10" />
            <p className="text-2xl font-bold tracking-tight uppercase">Zona despejada</p>
            <p className="text-xs font-black tracking-widest opacity-40 uppercase">Esperando nuevos pedidos...</p>
          </motion.div>
        )}

        {activeTab === 'history' && historyOrders.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full py-32 flex flex-col items-center justify-center text-brand-text/20 border-2 border-dashed border-brand-border rounded-[40px] bg-brand-card/20"
          >
            <CheckCircle2 size={80} className="mb-6 opacity-10" />
            <p className="text-2xl font-bold tracking-tight uppercase">Historial vacío</p>
            <p className="text-xs font-black tracking-widest opacity-40 uppercase">No hay órdenes despachadas recientemente.</p>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function KitchenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      </div>
    }>
      <KitchenContent />
    </Suspense>
  );
}

function OrderCard({ order, onReady, onRecover, isHistory }: { order: any, onReady: () => void, onRecover?: () => void, isHistory?: boolean }) {
  const [timeElapsed, setTimeElapsed] = useState("");
  const prevItemsHash = useRef(JSON.stringify(order.items));
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    if (isHistory) return;
    const currentItemsHash = JSON.stringify(order.items);
    if (prevItemsHash.current !== currentItemsHash) {
      setIsUpdated(true);
      // Animación más larga (5 segundos)
      setTimeout(() => setIsUpdated(false), 5000);
      prevItemsHash.current = currentItemsHash;
    }
  }, [order.items, isHistory]);

  useEffect(() => {
    const updateTimer = () => {
      const startTime = isHistory && order.dispatchedAt ? order.createdAt : order.createdAt;
      const endTime = isHistory && order.dispatchedAt ? order.dispatchedAt : new Date();
      
      const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);
      setTimeElapsed(`${diff} min`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [order.createdAt, order.dispatchedAt, isHistory]);

  const isDelayed = !isHistory && parseInt(timeElapsed) > 15;

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
      className={`bg-brand-card rounded-bento overflow-hidden border border-brand-border flex flex-col h-fit transition-all duration-500 ${isHistory ? 'opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : isUpdated ? 'ring-4 ring-brand-highlight shadow-[0_0_50px_rgba(6,182,212,0.3)]' : isDelayed ? 'shadow-[0_0_40px_rgba(239,68,68,0.15)] ring-1 ring-red-500/50' : 'shadow-xl'}`}
    >
      <div className={`p-5 flex justify-between items-center ${isHistory ? 'bg-white/5' : isUpdated ? 'bg-brand-highlight/20' : isDelayed ? 'bg-red-500/10' : 'bg-brand-border/30'}`}>
        <div className="flex items-center gap-2">
          {isExternal ? (
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white uppercase truncate max-w-[150px]">{order.tableNumber}</span>
              <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${isHistory ? 'text-brand-text/40' : 'text-brand-highlight'}`}>
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
        <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${isHistory ? 'bg-brand-accent/20 text-brand-accent' : isDelayed ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-dark text-brand-text/60 border border-brand-border'}`}>
          <Clock size={14} />
          {isHistory ? `Listo en ${timeElapsed}` : timeElapsed}
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 bg-gradient-to-b from-transparent to-brand-dark/20">
        {order.items.map((item: { quantity: number; name: string }, idx: number) => (
          <div key={idx} className="flex items-start gap-4 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg border transition-all ${isHistory ? 'bg-white/5 text-white/20 border-white/5' : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 group-hover:bg-brand-accent group-hover:text-white'}`}>
              {item.quantity}
            </div>
            <div className="flex flex-col">
              <span className={`text-xl font-bold uppercase tracking-tight leading-tight ${isHistory ? 'text-white/40' : 'text-white'}`}>{item.name}</span>
              {!isHistory && <span className="text-[10px] text-brand-text/30 font-bold tracking-widest uppercase">Preparación estándar</span>}
            </div>
          </div>
        ))}

        {order.note && (
          <div className={`mt-6 p-4 rounded-2xl relative overflow-hidden group border-2 ${isHistory ? 'bg-white/5 border-white/10 opacity-40' : 'bg-brand-highlight/10 border-brand-highlight/30'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${isHistory ? 'bg-brand-text/20' : 'bg-brand-highlight'}`} />
            <div className="flex items-start gap-3">
              <StickyNote size={18} className={`${isHistory ? 'text-brand-text/20' : 'text-brand-highlight'} shrink-0 mt-1`} />
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isHistory ? 'text-brand-text/20' : 'text-brand-highlight'}`}>Nota Especial</p>
                <p className={`text-lg font-black leading-tight italic ${isHistory ? 'text-white/20' : 'text-white'}`}>
                  "{order.note}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-brand-dark/40 border-t border-brand-border">
        {isHistory ? (
          <button 
            onClick={onRecover}
            className="w-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white py-4 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all active:scale-95 border border-white/5"
          >
            <Clock size={20} /> 
            Recuperar Orden
          </button>
        ) : (
          <button 
            onClick={onReady}
            className="w-full bg-brand-accent hover:bg-brand-accent/80 text-white py-4 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-brand-accent/20 group"
          >
            <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" /> 
            Despachar Pedido
          </button>
        )}
      </div>
    </motion.div>
  );
}
