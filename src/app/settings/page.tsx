"use client";

import { useState, useEffect } from "react";
import { db, User } from "@/lib/db";
import { 
  ShieldAlert, 
  RefreshCcw, 
  Trash2, 
  Database, 
  Settings as SettingsIcon, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Key,
  Clock,
  Calendar,
  Box,
  Printer,
  Cloud,
  HardDrive,
  Save
} from "lucide-react";
import Link from "next/link";
import PrinterSettingsModal from "@/components/PrinterSettingsModal";
import RoleGuard from "@/components/RoleGuard";
import AuthGuard from "@/components/AuthGuard";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState<'full' | 'partial' | null>(null);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  
  // Estados para Licencia
  const [licenseInfo, setLicenseInfo] = useState<{ status: string, daysLeft: number, expiryDate?: string } | null>(null);
  const [licenseKey, setLicenseKey] = useState("");

  // Cloud Settings
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");

  useEffect(() => {
    const userJson = localStorage.getItem("gastro_user");
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }
    loadLicenseInfo();
    
    // Cargar configuración de almacenamiento
    setStorageMode((localStorage.getItem('gastro_storage_mode') as 'local' | 'cloud') || 'local');
    setSupabaseUrl(localStorage.getItem('gastro_supabase_url') || "");
    setSupabaseKey(localStorage.getItem('gastro_supabase_key') || "");
  }, []);

  const handleSaveCloudConfig = () => {
    localStorage.setItem('gastro_storage_mode', storageMode);
    localStorage.setItem('gastro_supabase_url', supabaseUrl);
    localStorage.setItem('gastro_supabase_key', supabaseKey);
    setMessage({ text: "Configuración guardada. Reiniciando para aplicar...", type: 'success' });
    setTimeout(() => window.location.reload(), 1500);
  };

  const loadLicenseInfo = async () => {
    const info = await db.getLicenseStatus();
    setLicenseInfo(info);
  };

  const handleActivateLicense = async () => {
    if (!licenseKey.trim()) return;
    setLoading(true);
    try {
      const result = await db.activateLicense(licenseKey);
      if (result.success) {
        setMessage({ text: "Licencia activada con éxito", type: 'success' });
        setLicenseKey("");
        loadLicenseInfo();
      } else {
        setMessage({ text: result.error || "Código inválido", type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Error de activación", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (mode: 'full' | 'partial') => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await db.resetDatabase(mode);
      if (result.success) {
        setMessage({ text: `Base de datos reiniciada con éxito (${mode === 'full' ? 'Total' : 'Parcial'})`, type: 'success' });
        // Si fue un reinicio total, cerramos sesión por seguridad
        if (mode === 'full') {
          setTimeout(() => {
            localStorage.removeItem("gastro_user");
            window.location.href = "/login";
          }, 2000);
        }
      } else {
        setMessage({ text: result.error || "Error al reiniciar la base de datos", type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Error de conexión con el sistema", type: 'error' });
    } finally {
      setLoading(false);
      setShowConfirm(null);
    }
  };

  const isRoot = currentUser?.role === 'root';

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['root']}>
        <main className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
          <header className="flex items-center justify-between border-b pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-2xl">
                  <SettingsIcon className="text-slate-600" size={32} />
                </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase">
                  Configuración <span className="text-blue-600">Avanzada</span>
                </h1>
                <p className="text-slate-500 font-medium">Gestión del sistema y herramientas de mantenimiento</p>
              </div>
            </div>
            <Link 
              href="/inventory"
              className="bg-white hover:bg-slate-50 text-blue-600 p-4 rounded-2xl border-2 border-slate-100 transition-all flex items-center gap-2 font-black text-sm uppercase shadow-sm"
            >
              <Box size={18} /> Inventario
            </Link>
            <Link 
              href="/"
              className="bg-white hover:bg-slate-50 text-slate-600 p-4 rounded-2xl border-2 border-slate-100 transition-all flex items-center gap-2 font-black text-sm uppercase shadow-sm"
            >
              <ArrowLeft size={18} /> Volver
            </Link>
          </header>

          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold animate-in zoom-in duration-300 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle2 /> : <XCircle />}
              {message.text}
            </div>
          )}

          {/* Gestión de Almacenamiento (Local vs Cloud) */}
          <section className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center gap-3">
              <Database className="text-white" size={24} />
              <h2 className="text-white font-black uppercase tracking-wider">Modo de Almacenamiento</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setStorageMode('local')}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${storageMode === 'local' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-2xl ${storageMode === 'local' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <HardDrive size={24} />
                    </div>
                    <span className={`text-xl font-black ${storageMode === 'local' ? 'text-blue-900' : 'text-slate-400'}`}>Local</span>
                  </div>
                  <p className="text-sm text-slate-500 pl-16">Los datos se guardan en este dispositivo. Rápido y privado.</p>
                </button>

                <button 
                  onClick={() => setStorageMode('cloud')}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${storageMode === 'cloud' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`p-3 rounded-2xl ${storageMode === 'cloud' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Cloud size={24} />
                    </div>
                    <span className={`text-xl font-black ${storageMode === 'cloud' ? 'text-blue-900' : 'text-slate-400'}`}>Cloud</span>
                  </div>
                  <p className="text-sm text-slate-500 pl-16">Sincronización multidispositivo con Supabase.</p>
                </button>
              </div>

              {storageMode === 'cloud' && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300 bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Supabase URL</label>
                      <input 
                        type="text" 
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        placeholder="https://xyz.supabase.co"
                        className="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-500 font-bold text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Supabase Anon Key</label>
                      <input 
                        type="password" 
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        placeholder="eyJhbG..."
                        className="w-full bg-white border-2 border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-500 font-bold text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleSaveCloudConfig}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                <Save size={20} /> Guardar Cambios de Almacenamiento
              </button>
            </div>
          </section>

          {/* Gestión de Licencia (Solo Root) */}
          {isRoot && (
            <section className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-blue-600 p-6 flex items-center gap-3">
                <Key className="text-white" size={24} />
                <h2 className="text-white font-black uppercase tracking-wider">Estado de Licencia del Software</h2>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      licenseInfo?.status === 'active' ? 'bg-green-100 text-green-600 shadow-green-100' : 'bg-red-100 text-red-600 shadow-red-100'
                    }`}>
                      <Clock size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Actual</p>
                      <p className={`text-xl font-black uppercase italic ${
                        licenseInfo?.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {licenseInfo?.status === 'active' ? 'Sistema Activado' : 'Licencia Requerida'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Calendar size={14} />
                        <span className="text-[10px] font-black uppercase">Vencimiento</span>
                      </div>
                      <p className="text-sm font-black text-slate-700">
                        {licenseInfo?.expiryDate === 'lifetime' 
                          ? 'PERMANENTE' 
                          : licenseInfo?.expiryDate 
                            ? new Date(licenseInfo.expiryDate).toLocaleDateString()
                            : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Clock size={14} />
                        <span className="text-[10px] font-black uppercase">Días Restantes</span>
                      </div>
                      <p className="text-sm font-black text-slate-700">
                        {licenseInfo?.daysLeft === 9999 ? '∞' : licenseInfo?.daysLeft || 0} DÍAS
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200">
                  <h3 className="text-sm font-black text-slate-900 uppercase italic">Activar Nuevo Código</h3>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      placeholder="GASTRO-XXXX-XXXX"
                      className="w-full bg-white border-2 border-slate-200 rounded-xl py-3 px-4 outline-none focus:border-blue-500 font-bold text-slate-700 uppercase"
                    />
                    <button
                      onClick={handleActivateLicense}
                      disabled={loading || !licenseKey}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                    >
                      {loading ? 'VALIDANDO...' : 'ACTIVAR LICENCIA'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-tighter">
                    Las licencias activadas se registran permanentemente en este dispositivo.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Panel de Root */}
          <section className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-amber-400" size={24} />
                <h2 className="text-white font-black uppercase tracking-wider">Zona de Mantenimiento Crítico</h2>
              </div>
              {!isRoot && (
                <span className="bg-red-500/20 text-red-400 text-xs font-black px-3 py-1 rounded-full uppercase">
                  Acceso Restringido
                </span>
              )}
            </div>

            <div className="p-8 space-y-8">
              {!isRoot ? (
                <div className="text-center py-12 space-y-4">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={40} className="text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-bold max-w-xs mx-auto">
                    Estas herramientas solo están disponibles para usuarios con privilegios <span className="text-slate-900 underline italic">ROOT</span>.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Reinicio Parcial */}
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200 space-y-4 hover:border-blue-200 transition-colors">
                    <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center">
                      <RefreshCcw className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase italic">Reiniciar Ciclo</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Borra todas las ventas y libera las mesas ocupadas. <span className="text-blue-600 font-bold">Mantiene productos y usuarios.</span>
                      </p>
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => setShowConfirm('partial')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-200"
                    >
                      EJECUTAR LIMPIEZA
                    </button>
                  </div>

                  {/* Reinicio Total */}
                  <div className="bg-red-50 p-6 rounded-[1.5rem] border border-red-100 space-y-4 hover:border-red-200 transition-colors">
                    <div className="bg-red-100 w-12 h-12 rounded-xl flex items-center justify-center">
                      <Trash2 className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-red-900 uppercase italic">Restablecimiento Total</h3>
                      <p className="text-red-600/70 text-sm font-medium leading-relaxed">
                        Borra absolutamente todo: productos, ventas, mesas y configuraciones. <span className="text-red-600 font-bold uppercase underline">Acción irreversible.</span>
                      </p>
                    </div>
                    <button
                      disabled={loading}
                      onClick={() => setShowConfirm('full')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-red-200"
                    >
                      BORRAR TODO EL SISTEMA
                    </button>
                  </div>

                  {/* Impresora Térmica */}
                  <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200 space-y-4 hover:border-brand-highlight/20 transition-colors">
                    <div className="bg-brand-highlight/10 w-12 h-12 rounded-xl flex items-center justify-center">
                      <Printer className="text-brand-highlight" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase italic">Impresora Térmica</h3>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed">
                        Configura la impresora de tickets para comandas y facturación. <span className="text-brand-highlight font-bold">Estado: Activa</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setIsPrinterModalOpen(true)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-slate-200"
                    >
                      CONFIGURAR DISPOSITIVO
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <PrinterSettingsModal isOpen={isPrinterModalOpen} onClose={() => setIsPrinterModalOpen(false)} />

          {/* Diálogo de Confirmación */}
          {showConfirm && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-in zoom-in duration-300">
                <div className="text-center space-y-4">
                  <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle size={40} className="text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                    ¿Estás absolutamente seguro?
                  </h2>
                  <p className="text-slate-500 font-medium">
                    Esta acción {showConfirm === 'full' ? 'eliminará todos los datos del negocio' : 'reiniciará el contador de ventas'}. No podrás deshacer esto.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowConfirm(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={() => handleReset(showConfirm)}
                    className={`flex-1 text-white font-black py-4 rounded-2xl transition-all shadow-lg ${
                      showConfirm === 'full' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                    }`}
                  >
                    {loading ? 'REINICIANDO...' : 'SÍ, PROCEDER'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <footer className="text-center">
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                <Database size={14} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Motor de Datos: {storageMode === 'cloud' ? 'Supabase Cloud' : 'SQLite/Local'} • Storage: {storageMode.toUpperCase()}
                </p>
              </div>
          </footer>
        </main>
      </RoleGuard>
    </AuthGuard>
  );
}
