"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { Lock, User, AlertCircle, ChefHat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await db.login(username, password);
      if (user) {
        localStorage.setItem("gastro_user", JSON.stringify(user));
        window.location.href = "/";
      } else {
        setError("Usuario o contraseña incorrectos");
      }
    } catch (err) {
      setError("Error crítico al conectar con la base de datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] nebula-accent-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] nebula-accent-glow opacity-50" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 3 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="bg-brand-accent w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-brand-accent/20"
          >
            <ChefHat size={48} className="text-white" />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            GASTRO<span className="text-brand-accent">VNZLA</span>
          </h1>
          <p className="text-brand-text/60 font-medium mt-2">Elite Restaurant Management</p>
        </div>

        <div className="glass-card p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text/40 uppercase tracking-widest flex items-center gap-2 px-2">
                <User size={14} /> Usuario
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-brand-dark/50 border border-brand-border rounded-2xl py-4 px-6 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all font-medium text-brand-text placeholder:text-brand-text/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-text/40 uppercase tracking-widest flex items-center gap-2 px-2">
                <Lock size={14} /> Contraseña
              </label>
              <div className="relative group">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-dark/50 border border-brand-border rounded-2xl py-4 px-6 outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all font-medium text-brand-text placeholder:text-brand-text/20"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm font-semibold flex items-center gap-3"
                >
                  <AlertCircle size={18} />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent/90 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-brand-accent/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "INGRESAR AL SISTEMA"}
            </motion.button>
          </form>

          <div className="mt-10 pt-8 border-t border-brand-border/30 text-center space-y-4">
            <div className="flex justify-center gap-4">
              <span className="px-3 py-1 bg-brand-highlight/10 text-brand-highlight text-[10px] font-black rounded-full uppercase tracking-wider">Modo Offline</span>
              <span className="px-3 py-1 bg-brand-border/50 text-brand-text/40 text-[10px] font-black rounded-full uppercase tracking-wider">v2.0.0</span>
            </div>
            <p className="text-[10px] font-bold text-brand-text/20 uppercase tracking-[0.3em]">
              Powered by <span className="text-brand-text/40">Midnight Nebula UI</span>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
