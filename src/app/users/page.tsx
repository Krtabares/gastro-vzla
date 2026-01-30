'use client';

import { useState, useEffect } from 'react';
import { db, User } from '@/lib/db';
import RoleGuard from '@/components/RoleGuard';
import AuthGuard from '@/components/AuthGuard';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Shield, 
  ChevronLeft,
  Search,
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'cashier' as User['role']
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
    const storedUser = localStorage.getItem('gastro_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      console.log('Cargando usuarios...');
      const data = await db.getUsers();
      console.log('Usuarios recibidos:', data);
      setUsers(data || []);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (id === 'root-000' || id === currentUser?.id) {
      alert('No puedes eliminar este usuario.');
      return;
    }
    
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      await db.deleteUser(id);
      loadUsers();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password || !formData.name) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (users.find(u => u.username === formData.username)) {
      setError('El nombre de usuario ya existe');
      return;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      ...formData
    };

    try {
      await db.createUser(newUser);
      setIsModalOpen(false);
      setFormData({ username: '', password: '', name: '', role: 'cashier' });
      loadUsers();
    } catch (err) {
      setError('Error al crear usuario');
    }
  }

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={['root']}>
        <div className="min-h-screen bg-slate-950 text-white p-6">
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-slate-900 rounded-full transition-colors text-slate-400">
                <ChevronLeft size={24} />
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
                  <Users className="text-cyan-500" />
                  Gestión de Usuarios
                </h1>
                <p className="text-slate-400 text-sm">Control de acceso y roles del sistema</p>
              </div>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-cyan-900/20"
            >
              <UserPlus size={20} />
              Nuevo Usuario
            </button>
          </header>

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nombre o usuario..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl h-40 animate-pulse" />
                ))
              ) : (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.id || (user as any)._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-slate-800 p-3 rounded-xl text-cyan-500">
                        <Users size={24} />
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(user.id || (user as any)._id)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          disabled={(user.id || (user as any)._id) === 'root-000' || (user.id || (user as any)._id) === currentUser?.id}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">{user.name || 'Sin nombre'}</h3>
                    <p className="text-slate-400 text-sm mb-4">@{user.username || 'sin-usuario'}</p>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
                        user.role === 'root' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        user.role === 'admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        user.role === 'waiter' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        <Shield size={12} />
                        {user.role}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Create User Modal */}
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 relative overflow-hidden shadow-2xl"
                >
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute right-6 top-6 text-slate-500 hover:text-white"
                  >
                    <X size={24} />
                  </button>

                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <UserPlus className="text-cyan-500" />
                    Nuevo Usuario
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                        <AlertCircle size={18} />
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Nombre Completo</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Usuario</label>
                      <input 
                        type="text"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Contraseña</label>
                      <input 
                        type="password"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Rol de Usuario</label>
                      <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
                      >
                        <option value="waiter">Camarero (Solo Comandas)</option>
                        <option value="cashier">Cajero (Ventas y Cocina)</option>
                        <option value="admin">Administrador (Todo menos Usuarios)</option>
                        <option value="root">Superusuario (Todo)</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-xl font-bold mt-4 transition-all"
                    >
                      Crear Usuario
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
