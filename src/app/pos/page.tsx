"use client";

import { useState, useEffect } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { useOrders } from "@/context/OrdersContext";
import BillingModal from "@/components/pos/BillingModal";
import { db, Product, Table } from "@/lib/db";
import { 
  ChevronLeft, 
  Users, 
  Clock, 
  Plus, 
  Utensils,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  Send,
  PlusCircle,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function POSPage() {
  const { formatUsd, formatVes, usdToVes, iva } = useCurrency();
  const { addOrder, completeSale } = useOrders();
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isTableNameModalOpen, setIsTableNameModalOpen] = useState(false);
  const [suggestedTableName, setSuggestedTableName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [dbTables, dbProducts] = await Promise.all([
      db.getTables(),
      db.getProducts()
    ]);
    setTables(dbTables);
    setProducts(dbProducts);
    
    if (selectedTable) {
      const updated = dbTables.find(t => t.id === selectedTable.id);
      if (updated) {
        setSelectedTable(updated);
        if (updated.orderData) {
          setCart(JSON.parse(updated.orderData));
        }
      }
    }
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    if (table.orderData) {
      setCart(JSON.parse(table.orderData));
    } else {
      setCart([]);
    }
  };

  const createTable = async () => {
    const existingNumbers = tables.map(t => parseInt(t.number) || 0).sort((a, b) => a - b);
    let suggestedNum = 1;
    for (let num of existingNumbers) {
      if (num === suggestedNum) {
        suggestedNum++;
      } else if (num > suggestedNum) {
        break;
      }
    }
    setSuggestedTableName(suggestedNum.toString().padStart(2, '0'));
    setIsTableNameModalOpen(true);
  };

  const confirmCreateTable = async (tableName: string) => {
    const formattedNum = tableName.trim().padStart(2, '0');
    if (tables.some(t => t.number === formattedNum)) {
      alert(`La mesa #${formattedNum} ya existe en el comedor.`);
      return;
    }
    const newTable: Table = {
      id: Math.random().toString(36).substr(2, 9),
      number: formattedNum,
      status: 'available',
    };
    await db.saveTable(newTable);
    setIsTableNameModalOpen(false);
    loadData();
  };

  const deleteTable = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const table = tables.find(t => t.id === id);
    if (table?.status !== 'available') {
      alert("No puedes eliminar una mesa ocupada o por cobrar.");
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar la Mesa #${table.number}?`)) {
      await db.deleteTable(id);
      loadData();
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      alert(`El producto "${product.name}" está agotado.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing && product.stock !== undefined && existing.quantity >= product.stock) {
        alert(`No hay suficiente stock disponible para añadir más unidades de "${product.name}".`);
        return prev;
      }
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const subtotalUsd = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const ivaUsd = subtotalUsd * iva;
  const totalUsd = subtotalUsd + ivaUsd;

  const handleSendToKitchen = async () => {
    if (!selectedTable || cart.length === 0) return;
    addOrder(selectedTable.number, cart.map(item => ({
      name: item.product.name,
      quantity: item.quantity
    })));
    const now = new Date();
    await db.saveTable({ 
      ...selectedTable, 
      status: 'occupied',
      currentOrderId: Math.random().toString(36).substr(2, 9),
      currentTotalUsd: totalUsd,
      startTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderData: JSON.stringify(cart)
    });
    loadData();
    setSelectedTable(null);
    setCart([]);
  };

  const handlePaymentComplete = async () => {
    if (!selectedTable) return;
    completeSale(totalUsd);
    await db.saveTable({ 
      ...selectedTable, 
      status: 'available',
      currentOrderId: undefined,
      currentTotalUsd: 0,
      startTime: undefined,
      orderData: undefined
    });
    loadData();
    setIsBillingOpen(false);
    setSelectedTable(null);
    setCart([]);
  };

  if (selectedTable) {
    return (
      <main className="min-h-screen bg-brand-dark flex flex-col md:flex-row overflow-hidden h-screen relative">
        <div className="absolute top-0 left-0 nebula-accent-glow opacity-20" />
        
        {/* Productos */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.1, x: -5 }}
                onClick={() => setSelectedTable(null)}
                className="p-3 glass-card text-brand-text/60 hover:text-white transition-all"
              >
                <ChevronLeft size={24} />
              </motion.button>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Mesa #{selectedTable.number}</h2>
                <p className="text-brand-text/40 text-[10px] font-black uppercase tracking-[0.3em]">Selección de Menú</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {products.map((product, idx) => {
                const isOutOfStock = product.stock !== undefined && product.stock <= 0;
                const isLowStock = product.stock !== undefined && product.minStock !== undefined && product.stock <= product.minStock;

                return (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    whileTap={{ scale: 0.95 }}
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={isOutOfStock}
                    className={`glass-card p-5 text-left group transition-all relative overflow-hidden ${isOutOfStock ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:border-brand-accent/50'}`}
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-brand-accent/5 rounded-full -mr-10 -mt-10 group-hover:bg-brand-accent/10 transition-all" />
                    
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-inner ${isLowStock ? 'bg-red-500/10 text-red-400' : 'bg-brand-highlight/10 text-brand-highlight'}`}>
                      <Utensils size={24} />
                    </div>
                    
                    <h3 className="font-black text-white mb-1 group-hover:text-brand-accent transition-colors">{product.name}</h3>
                    <p className="text-[10px] font-bold text-brand-text/30 uppercase tracking-widest mb-4">{product.category}</p>
                    
                    {product.stock !== undefined && (
                      <div className={`text-[9px] font-black px-2 py-1 rounded-lg inline-block mb-4 ${isLowStock ? 'bg-red-500/10 text-red-400' : 'bg-brand-highlight/10 text-brand-highlight'}`}>
                        {isOutOfStock ? 'AGOTADO' : `STOCK: ${product.stock}`}
                      </div>
                    )}

                    <div className="mt-auto">
                      <p className="text-xl font-black text-white">{formatUsd(product.price)}</p>
                      <p className="text-[10px] font-black text-brand-highlight uppercase tracking-tighter">{formatVes(usdToVes(product.price))}</p>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Comanda */}
        <div className="w-full md:w-[420px] glass-card !rounded-none !border-y-0 !border-r-0 flex flex-col h-full bg-brand-card/20 backdrop-blur-2xl relative z-20 pb-16">
          <div className="p-8 border-b border-brand-border/30">
            <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-widest">
              <ShoppingCart size={22} className="text-brand-accent" /> Comanda
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <ShoppingCart size={64} className="mx-auto mb-6 text-brand-text/10" />
                  <p className="text-brand-text/20 font-black uppercase tracking-[0.3em] text-xs">Sin productos</p>
                </motion.div>
              ) : (
                cart.map(item => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    key={item.product.id} 
                    className="flex justify-between items-center bg-brand-dark/40 border border-brand-border/30 p-4 rounded-2xl group hover:border-brand-accent/30 transition-all"
                  >
                    <div className="flex-1">
                      <p className="font-black text-white text-sm mb-1">{item.product.name}</p>
                      <p className="text-[10px] font-bold text-brand-text/40 uppercase">
                        {item.quantity} x {formatUsd(item.product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-black text-white">{formatUsd(item.product.price * item.quantity)}</span>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-brand-text/20 hover:text-red-400 p-2 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="p-8 bg-brand-dark/60 border-t border-brand-border/50 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-brand-text/40 text-[10px] font-black uppercase tracking-widest">
                <span>Subtotal</span>
                <span>{formatUsd(subtotalUsd)}</span>
              </div>
              <div className="flex justify-between text-brand-text/40 text-[10px] font-black uppercase tracking-widest">
                <span>IVA (16%)</span>
                <span>{formatUsd(ivaUsd)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-border/30">
              <div className="flex justify-between items-end mb-1">
                <span className="font-black text-brand-text/40 text-[10px] uppercase tracking-[0.3em]">Total</span>
                <span className="text-4xl font-black text-white tracking-tighter">{formatUsd(totalUsd)}</span>
              </div>
              <div className="flex justify-between text-brand-highlight font-black text-xs uppercase tracking-tighter">
                <span>Bs. Total</span>
                <span>{formatVes(usdToVes(totalUsd))}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 pt-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsBillingOpen(true)}
                className="w-full bg-brand-highlight text-brand-dark py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-brand-highlight/20 transition-all uppercase tracking-widest text-sm"
              >
                <DollarSign size={20} strokeWidth={3} /> Cobrar
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendToKitchen}
                className="w-full bg-brand-accent text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-brand-accent/20 transition-all uppercase tracking-widest text-sm"
              >
                <Send size={20} strokeWidth={3} /> Cocina
              </motion.button>
            </div>
          </div>
        </div>

        <BillingModal 
          isOpen={isBillingOpen}
          onClose={() => setIsBillingOpen(false)}
          tableNumber={selectedTable.number}
          subtotalUsd={subtotalUsd}
          items={cart}
          onComplete={handlePaymentComplete}
        />

        <TableNameModal 
          isOpen={isTableNameModalOpen}
          onClose={() => setIsTableNameModalOpen(false)}
          defaultValue={suggestedTableName}
          onConfirm={confirmCreateTable}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-dark p-4 md:p-8 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 nebula-accent-glow opacity-20" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="flex items-center gap-5">
            <Link 
              href="/" 
              className="p-3 glass-card text-brand-text/40 hover:text-white transition-all"
            >
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">Comedor</h1>
              <p className="text-brand-text/40 font-bold uppercase tracking-[0.4em] text-[10px]">Gestión de Mesas</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={createTable}
              className="bg-brand-accent text-white px-6 py-3 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-brand-accent/20 uppercase tracking-widest text-xs"
            >
              <PlusCircle size={18} /> Nueva Mesa
            </motion.button>
            <div className="glass-card px-5 py-3 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-brand-highlight">
              <span className="w-2.5 h-2.5 bg-brand-highlight rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
              {tables.filter(t => t.status === 'available').length} Libres
            </div>
            <div className="glass-card px-5 py-3 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-brand-accent">
              <Users size={18} />
              {tables.filter(t => t.status !== 'available').length} Ocupadas
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          <AnimatePresence>
            {tables.map((table, idx) => (
              <TableCard key={table.id} table={table} onSelect={handleTableSelect} idx={idx} onDelete={deleteTable} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <TableNameModal 
        isOpen={isTableNameModalOpen}
        onClose={() => setIsTableNameModalOpen(false)}
        defaultValue={suggestedTableName}
        onConfirm={confirmCreateTable}
      />
    </main>
  );
}

function TableCard({ table, onSelect, idx, onDelete }: { table: Table, onSelect: (t: Table) => void, idx: number, onDelete: (id: string, e: React.MouseEvent) => void }) {
  const statusConfig = {
    available: {
      accent: "brand-text/10",
      text: "Disponible",
      icon: <Plus className="text-brand-text/20" size={32} strokeWidth={3} />
    },
    occupied: {
      accent: "brand-accent",
      text: "Ocupada",
      icon: <Clock className="text-brand-accent" size={20} />
    },
    billing: {
      accent: "brand-highlight",
      text: "Cuenta",
      icon: <DollarSign className="text-brand-highlight" size={20} />
    }
  };

  const config = statusConfig[table.status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => onSelect(table)}
      className={`glass-card p-6 flex flex-col h-[200px] group relative overflow-hidden cursor-pointer transition-all border-2 ${table.status !== 'available' ? `border-${config.accent}/30` : 'border-transparent'}`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${config.accent}/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-${config.accent}/10`} />

      {table.status === 'available' && (
        <button 
          onClick={(e) => onDelete(table.id, e)}
          className="absolute top-2 right-2 p-2 text-brand-text/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <Trash2 size={16} />
        </button>
      )}

      <div className="flex justify-between items-start mb-auto">
        <span className="text-3xl font-black text-white tracking-tighter">#{table.number}</span>
        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest bg-${config.accent}/10 text-${config.accent}`}>
          {config.text}
        </span>
      </div>

      {table.status !== 'available' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-brand-text/40 text-[10px] font-black uppercase">
            {config.icon}
            <span>{table.startTime}</span>
          </div>
          <div>
            <p className="text-xl font-black text-white leading-none tracking-tighter">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(table.currentTotalUsd || 0)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
          {config.icon}
          <span className="text-[10px] font-black text-brand-text/20 uppercase tracking-widest group-hover:text-brand-text/40">Abrir</span>
        </div>
      )}
    </motion.div>
  );
}

function TableNameModal({ isOpen, onClose, defaultValue, onConfirm }: { isOpen: boolean, onClose: () => void, defaultValue: string, onConfirm: (name: string) => void }) {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    setName(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-10 w-full max-w-md shadow-2xl relative overflow-hidden border-brand-accent/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent/50" />
        
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Nueva Mesa</h2>
        <p className="text-brand-text/40 mb-8 font-bold text-xs uppercase tracking-widest">Asigna un identificador</p>
        
        <input 
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(name)}
          className="w-full bg-brand-dark/50 border border-brand-border rounded-2xl p-6 text-4xl font-black text-white focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/10 transition-all outline-none mb-8 text-center placeholder:text-brand-text/10"
          placeholder="00"
        />

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onClose}
            className="p-4 bg-brand-border/20 hover:bg-brand-border/40 text-brand-text font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(name)}
            className="p-4 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-accent/20 transition-all"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
