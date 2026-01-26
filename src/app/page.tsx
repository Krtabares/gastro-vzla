"use client";

import { 
  DollarSign, 
  TrendingUp, 
  Utensils, 
  LayoutDashboard, 
  PlusCircle, 
  Settings, 
  LogOut, 
  Printer, 
  Eye, 
  EyeOff,
  History,
  ShieldCheck,
  ExternalLink,
  Users
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { useOrders } from "@/context/OrdersContext";
import { useState, useEffect } from "react";
import ExchangeRateModal from "@/components/ExchangeRateModal";
import DaySummaryModal from "@/components/DaySummaryModal";
import OnboardingWizard from "@/components/OnboardingWizard";
import PrinterSettingsModal from "@/components/PrinterSettingsModal";
import Link from "next/link";
import { db, User } from "@/lib/db";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { exchangeRate, formatUsd, formatVes, usdToVes } = useCurrency();
  const { orders } = useOrders();
  const [dailySalesUsd, setDailySalesUsd] = useState(0);
  const [activeTablesCount, setActiveTablesCount] = useState(0);
  const [showValues, setShowValues] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const userJson = localStorage.getItem('gastro_user');
    if (userJson) setCurrentUser(JSON.parse(userJson));
    
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    if (!hasOnboarded) {
      setIsWizardOpen(true);
      localStorage.setItem('hasOnboarded', 'true');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('gastro_user');
    router.push('/login');
  };

  const loadDashboardData = async () => {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const [todaySales, tables] = await Promise.all([
        db.getSales(startOfDay.toISOString(), endOfDay.toISOString()),
        db.getTables()
      ]);

      setDailySalesUsd(todaySales.reduce((acc, sale) => acc + sale.totalUsd, 0));
      setActiveTablesCount(tables.filter(t => t.status !== 'available').length);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  const maskValue = (val: string) => showValues ? val : "*****";

  return (
    <main className="min-h-screen p-4 md:p-8 relative overflow-hidden bg-brand-dark">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 right-0 nebula-accent-glow opacity-30" />
      <div className="absolute bottom-0 left-0 nebula-accent-glow opacity-20" />

      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-5">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="bg-brand-accent text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-brand-accent/20 border border-white/10"
          >
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'G'}
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Hola, {currentUser?.name || 'Usuario'}
              <button onClick={handleLogout} className="text-brand-text/30 hover:text-red-400 transition-colors">
                <LogOut size={20} />
              </button>
            </h1>
            <p className="text-brand-text/40 font-bold uppercase tracking-[0.2em] text-[10px]">Elite Control Panel</p>
          </div>
          <button 
            onClick={() => setShowValues(!showValues)}
            className="p-3 glass-card !rounded-2xl text-brand-text/40 hover:text-brand-highlight transition-all ml-2"
          >
            {showValues ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-4 flex items-center gap-5 w-full md:w-auto min-w-[280px]"
        >
          <div className="bg-brand-highlight/10 p-3 rounded-2xl text-brand-highlight shadow-inner">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-brand-text/40 uppercase font-black tracking-widest mb-1">Tasa BCV</p>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white leading-none">{maskValue(exchangeRate.toFixed(2))}</span>
                <span className="text-[10px] font-black text-brand-text/30 uppercase">VES/$</span>
              </div>
              <button 
                onClick={() => setIsRateModalOpen(true)}
                className="p-2 hover:bg-white/5 rounded-lg text-brand-accent transition-colors"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <StatCard 
          title="Mesas Ocupadas" 
          value={maskValue(activeTablesCount.toString())} 
          icon={<LayoutDashboard />} 
          accent="highlight" 
          delay={0.1}
        />
        <StatCard 
          title="Ventas Hoy (USD)" 
          value={maskValue(formatUsd(dailySalesUsd))} 
          icon={<DollarSign />} 
          accent="accent" 
          delay={0.2}
        />
        <StatCard 
          title="Ventas Hoy (VES)" 
          value={maskValue(formatVes(usdToVes(dailySalesUsd)))} 
          icon={<TrendingUp />} 
          accent="highlight" 
          delay={0.3}
        />
        <StatCard 
          title="Órdenes Pendientes" 
          value={maskValue(orders.length.toString())} 
          icon={<Utensils />} 
          accent="accent" 
          delay={0.4}
        />
      </div>

      <div className="mt-14 relative z-10">
        <h2 className="text-sm font-black mb-8 text-brand-text/40 uppercase tracking-[0.4em] flex items-center gap-4">
          <span className="w-8 h-[1px] bg-brand-border" />
          Operaciones Principales
          <span className="flex-1 h-[1px] bg-brand-border" />
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          <DashboardLink href="/pos" icon={<PlusCircle size={28} />} label="Comedor / POS" accent="accent" />
          
          {(currentUser?.role === 'root' || currentUser?.role === 'admin') && (
            <DashboardLink href="/menu" icon={<Utensils size={28} />} label="Menú / Precios" accent="highlight" />
          )}
          
          <div className="relative group">
            <DashboardLink href="/kitchen" icon={<LayoutDashboard size={28} />} label="Monitor Cocina" accent="accent" />
            <button 
              onClick={async (e) => {
                e.preventDefault();
                await (window as any).ipcRenderer.invoke('open-kitchen-window');
              }}
              className="absolute top-4 right-4 p-2 glass-card !rounded-xl text-brand-text/40 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20"
            >
              <ExternalLink size={16} />
            </button>
          </div>

          {(currentUser?.role === 'root' || currentUser?.role === 'admin') && (
            <DashboardLink href="/sales" icon={<History size={28} />} label="Historial" accent="highlight" />
          )}
          
          {(currentUser?.role === 'root' || currentUser?.role === 'admin') && (
            <motion.button 
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setIsSummaryModalOpen(true)}
              className="glass-card p-8 flex flex-col items-center justify-center group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors" />
              <div className="bg-red-500/10 text-red-500 w-16 h-16 rounded-[2rem] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-red-500/10">
                <LogOut size={28} />
              </div>
              <span className="font-black text-brand-text text-xs uppercase tracking-widest text-center">Cierre de Caja</span>
            </motion.button>
          )}

          {currentUser?.role === 'root' && (
            <DashboardLink href="/users" icon={<Users size={28} />} label="Usuarios" accent="accent" />
          )}
        </div>

        {currentUser?.role === 'root' && (
          <div className="mt-5">
            <DashboardLink href="/settings" icon={<ShieldCheck size={28} />} label="Configuración Root" accent="accent" fullWidth />
          </div>
        )}
      </div>

      <footer className="mt-16 flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10 opacity-40 hover:opacity-100 transition-opacity">
        <p className="text-[10px] font-black text-brand-text/50 uppercase tracking-[0.4em]">
          Powered by <span className="text-brand-accent">Kenat PowerHouse</span>
        </p>
      </footer>

      {/* Modals remain the same but will inherit the new styles from glass-card */}
      <ExchangeRateModal isOpen={isRateModalOpen} onClose={() => { setIsRateModalOpen(false); loadDashboardData(); }} />
      <DaySummaryModal isOpen={isSummaryModalOpen} onClose={() => setIsSummaryModalOpen(false)} totalUsd={dailySalesUsd} onConfirm={() => loadDashboardData()} />
      <OnboardingWizard isOpen={isWizardOpen} onClose={() => { setIsWizardOpen(false); loadDashboardData(); }} />
      <PrinterSettingsModal isOpen={isPrinterModalOpen} onClose={() => setIsPrinterModalOpen(false)} />
    </main>
  );
}

function StatCard({ title, value, icon, accent, delay }: { title: string, value: string, icon: React.ReactNode, accent: 'accent' | 'highlight', delay: number }) {
  const accentColor = accent === 'accent' ? 'text-brand-accent' : 'text-brand-highlight';
  const accentBg = accent === 'accent' ? 'bg-brand-accent/10' : 'bg-brand-highlight/10';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card p-5 flex items-center gap-5 group"
    >
      <div className={`${accentBg} ${accentColor} w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
        {/* Reducimos el tamaño de los iconos dentro del contenedor si es necesario, 
            pero lucide-react por defecto usa 24px que está bien */}
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-[0.2em] mb-0.5 truncate">{title}</p>
        <p className="text-2xl font-black text-white tracking-tighter truncate">{value}</p>
      </div>
    </motion.div>
  );
}

function DashboardLink({ href, icon, label, accent, fullWidth }: { href: string, icon: React.ReactNode, label: string, accent: 'accent' | 'highlight', fullWidth?: boolean }) {
  const accentColor = accent === 'accent' ? 'text-brand-accent' : 'text-brand-highlight';
  const accentBg = accent === 'accent' ? 'bg-brand-accent/10' : 'bg-brand-highlight/10';
  const accentShadow = accent === 'accent' ? 'shadow-brand-accent/10' : 'shadow-brand-highlight/10';

  return (
    <Link href={href} className={`${fullWidth ? 'w-full' : ''}`}>
      <motion.div 
        whileHover={{ y: -5, scale: 1.02 }}
        className="glass-card p-8 flex flex-col items-center justify-center h-full group relative overflow-hidden"
      >
        <div className={`absolute inset-0 ${accentBg} opacity-0 group-hover:opacity-5 transition-opacity`} />
        <div className={`${accentBg} ${accentColor} w-16 h-16 rounded-[2rem] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg ${accentShadow}`}>
          {icon}
        </div>
        <span className="font-black text-brand-text text-xs uppercase tracking-widest text-center">{label}</span>
      </motion.div>
    </Link>
  );
}
