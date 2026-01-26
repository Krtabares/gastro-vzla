"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("gastro_user");
    
    if (!user && pathname !== "/login") {
      router.push("/login");
    } else if (user && pathname === "/login") {
      router.push("/");
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  if (!isAuthorized && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 nebula-accent-glow opacity-30" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin shadow-2xl shadow-brand-accent/20"></div>
          <p className="text-brand-text/40 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Iniciando Nebula OS</p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
