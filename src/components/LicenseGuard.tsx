"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { db, User } from "@/lib/db";
import { ShieldAlert, History, Key } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'active' | 'restricted'>('loading');
  const [isRoot, setIsRoot] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function checkLicense() {
      try {
        const userJson = localStorage.getItem("gastro_user");
        if (userJson) {
          const user: User = JSON.parse(userJson);
          if (user.role === 'root') {
            setIsRoot(true);
            setStatus('active');
            return;
          }
        }

        const license = await db.getLicenseStatus();
        setStatus(license.status === 'active' ? 'active' : 'restricted');
      } catch (error) {
        console.error("License check failed:", error);
        setStatus('restricted');
      }
    }
    checkLicense();
  }, [pathname]); // Re-check on navigation to ensure consistency

  // Paths that are ALWAYS accessible
  const publicPaths = ["/login", "/sales"];
  
  // Settings must be accessible to activate the license
  const isSettings = pathname === "/settings";

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isRestrictedPath = !publicPaths.includes(pathname) && !isSettings;

  if (status === 'restricted' && isRestrictedPath) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute top-0 left-0 nebula-accent-glow opacity-30" />
        <div className="absolute bottom-0 right-0 nebula-accent-glow opacity-20" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-card p-12 max-w-lg w-full text-center space-y-8 relative z-10 border-red-500/20 shadow-2xl shadow-red-500/10"
        >
          <div className="bg-red-500/10 w-24 h-24 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500 border border-red-500/20 shadow-inner">
            <ShieldAlert size={48} strokeWidth={2.5} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              Sistema <span className="text-red-500">Bloqueado</span>
            </h1>
            <p className="text-brand-text/50 font-medium text-sm leading-relaxed">
              El acceso a las operaciones ha sido restringido. <br />
              Se requiere una licencia activa para continuar usando todas las funciones del sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Link 
              href="/sales" 
              className="bg-brand-accent text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-brand-accent/20 hover:scale-[1.02] transition-all"
            >
              <History size={18} /> Ver Historial
            </Link>
            
            <Link 
              href="/settings" 
              className="bg-white/5 hover:bg-white/10 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 border border-white/10 transition-all hover:scale-[1.02]"
            >
              <Key size={18} /> Activar Licencia
            </Link>
          </div>

          <div className="pt-4">
            <p className="text-[10px] font-black text-brand-text/20 uppercase tracking-[0.5em]">Kenat Powerhouse</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
