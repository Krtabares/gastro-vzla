"use client";

import { useState, useEffect, Suspense } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import { useOrders } from "@/context/OrdersContext";
import BillingModal from "@/components/pos/BillingModal";
import { db, Product, Table, supabase, User as DbUser } from "@/lib/db";
import { 
  ChevronLeft, 
  Users, 
  Clock, 
  Plus, 
  Search, 
  Utensils,
  DollarSign,
  TrendingUp,
  X,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  Send,
  PlusCircle,
  LayoutDashboard,
  MessageSquarePlus,
  StickyNote,
  Minus,
  ShoppingBag,
  Bike,
  Package,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function POSContent() {
  const searchParams = useSearchParams();
  const tableIdParam = searchParams.get('tableId');
  
  const { formatUsd, formatVes, usdToVes, iva, ivaEnabled } = useCurrency();
  const { orders, addOrder, completeSale, updateOrderNote } = useOrders();
  const [tables, setTables] = useState<Table[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isTableNameModalOpen, setIsTableNameModalOpen] = useState(false);
  const [suggestedTableName, setSuggestedTableName] = useState("");
  const [isCartMobileOpen, setIsCartMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<DbUser | null>(null);
  const [orderNote, setOrderNote] = useState("");
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isSendingToKitchen, setIsSendingToKitchen] = useState(false);
  const [isExternalOrdersOpen, setIsExternalOrdersOpen] = useState(false);
  const [isTakeawayModalOpen, setIsTakeawayModalOpen] = useState(false);
  const [isChargeWarningOpen, setIsChargeWarningOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadInitialData();
    const storedUser = localStorage.getItem('gastro_user');
    if (storedUser) setCurrentUser(JSON.parse(storedUser));

    // Suscripción Realtime para Mesas
    if (supabase) {
      const currentSupabase = supabase;
      const channel = currentSupabase
        .channel('realtime-tables')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tables' },
          () => {
            console.log('Update detected in tables, reloading...');
            loadData();
          }
        )
        .subscribe();

      return () => {
        currentSupabase.removeChannel(channel);
      };
    }
  }, []);

  const loadInitialData = async () => {
    const [dbTables, dbProducts] = await Promise.all([
      db.getTables(),
      db.getProducts()
    ]);
    setTables(dbTables);
    setProducts(dbProducts);

    if (tableIdParam) {
      const table = dbTables.find(t => t.id === tableIdParam);
      if (table) {
        handleTableSelect(table);
      }
    }
  };

  const loadData = async (ignoreSelection = false) => {
    const [dbTables, dbProducts] = await Promise.all([
      db.getTables(),
      db.getProducts()
    ]);
    setTables(dbTables);
    setProducts(dbProducts);
    
    if (selectedTable && !ignoreSelection) {
      const updated = dbTables.find(t => t.id === selectedTable.id);
      if (updated && updated.status !== 'available') {
        setSelectedTable(updated);
        if (updated.orderData) {
          try {
            setCart(JSON.parse(updated.orderData));
          } catch(e) {
            setCart([]);
          }
        }
        if (updated.orderNote) {
          setOrderNote(updated.orderNote);
        }
      } else if (updated && updated.status === 'available') {
        // Si la mesa se liberó (ej. por otro terminal), la cerramos aquí también
        setSelectedTable(null);
        setCart([]);
        setOrderNote("");
      }
    }
  };

  const handleTableSelect = (table: Table) => {
    console.log('Selecting table:', table);
    setSelectedTable(table);
    setSearchTerm("");
    if (table.status !== 'available' && table.orderData) {
      try {
        const parsedCart = JSON.parse(table.orderData);
        setCart(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (e) {
        console.error("Error parsing orderData:", e);
        setCart([]);
      }
    } else {
      setCart([]);
    }
    setOrderNote(table.orderNote || "");
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

  const confirmCreateTakeaway = async (clientName: string, type: 'takeaway' | 'delivery') => {
    if (!clientName.trim()) return;
    
    const newExternalOrder: Table = {
      id: Math.random().toString(36).substr(2, 9),
      number: clientName.trim().toUpperCase(),
      status: 'occupied',
      type: type,
      startTime: new Date().toISOString(),
      currentTotalUsd: 0,
    };
    
    await db.saveTable(newExternalOrder);
    setIsTakeawayModalOpen(false);
    loadData();
    setSelectedTable(newExternalOrder);
    setCart([]);
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
    if (product.stock !== undefined && product.stock !== -1 && product.stock <= 0) {
      alert(`El producto "${product.name}" está agotado.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing && product.stock !== undefined && product.stock !== -1 && existing.quantity >= product.stock) {
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

  const decreaseQuantity = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(item => 
          item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter(item => item.product.id !== productId);
    });
  };

  const subtotalUsd = cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const ivaUsd = ivaEnabled ? subtotalUsd * iva : 0;
  const totalUsd = subtotalUsd + ivaUsd;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSendToKitchen = async () => {
    if (!selectedTable || cart.length === 0 || isSendingToKitchen) return;

    setIsSendingToKitchen(true);
    const tableToUpdate = selectedTable;
    const currentCart = [...cart];
    const currentNote = orderNote;
    const noteChanged = currentNote !== (tableToUpdate.orderNote || "");
    
    try {
      // 1. Determinar qué items enviar (Delta)
      let itemsToCookWithZone: { name: string, quantity: number, zoneId?: string }[] = [];
      let previousCart: {product: Product, quantity: number}[] = [];

      if (tableToUpdate.orderData) {
        try {
          previousCart = JSON.parse(tableToUpdate.orderData);
        } catch (e) {
          console.error("Error parsing previous orderData:", e);
        }
      }

      itemsToCookWithZone = currentCart.map(item => {
        const prevItem = previousCart.find(p => p.product.id === item.product.id);
        const prevQty = prevItem ? prevItem.quantity : 0;
        const deltaQty = item.quantity - prevQty;
        
        return {
          name: item.product.name,
          quantity: deltaQty,
          zoneId: item.product.zoneId
        };
      }).filter(item => item.quantity > 0);

      // Si cambió la nota, actualizamos todas las órdenes activas en cocina para esta mesa
      if (noteChanged) {
        await updateOrderNote(tableToUpdate.number, currentNote);
      }

      // Si hay algo nuevo que cocinar, se añade la orden agrupada por zonas
      if (itemsToCookWithZone.length > 0) {
        const groupedByZone: Record<string, any[]> = {};
        
        itemsToCookWithZone.forEach(item => {
          const zId = item.zoneId || 'default';
          if (!groupedByZone[zId]) groupedByZone[zId] = [];
          groupedByZone[zId].push({
            name: item.name,
            quantity: item.quantity
          });
        });

        for (const zId in groupedByZone) {
          await addOrder(
            tableToUpdate.number, 
            groupedByZone[zId], 
            currentNote,
            tableToUpdate.type || 'table',
            zId === 'default' ? undefined : zId
          );
        }
      }

      // Si no hay items nuevos ni cambió la nota, no hacemos nada
      if (itemsToCookWithZone.length === 0 && !noteChanged) {
        setIsSendingToKitchen(false);
        return;
      }

      const now = new Date();
      await db.saveTable({ 
        ...tableToUpdate, 
        status: 'occupied', // Siempre vuelve a 'occupied' si se envía a cocina
        currentOrderId: Math.random().toString(36).substr(2, 9),
        currentTotalUsd: totalUsd,
        startTime: tableToUpdate.startTime || now.toISOString(),
        orderData: JSON.stringify(currentCart),
        orderNote: currentNote
      });

      setSelectedTable(null);
      setCart([]);
      setOrderNote("");
    } catch (error) {
      console.error("Error al enviar a cocina:", error);
      alert("Error al enviar a cocina. Intente nuevamente.");
    } finally {
      setIsSendingToKitchen(false);
    }
  };

  const handleChargeClick = () => {
    if (!selectedTable) return;
    
    // Si no hay productos en el carrito, no tiene sentido cobrar nada (o abrir el modal)
    if (cart.length === 0) {
      alert("La comanda está vacía.");
      return;
    }

    // Verificar si el carrito actual es igual a lo que ya se envió a cocina
    const hasUnsentChanges = JSON.stringify(cart) !== selectedTable.orderData;

    if (hasUnsentChanges) {
      setIsChargeWarningOpen(true);
    } else {
      setIsBillingOpen(true);
    }
  };

  const handlePaymentComplete = async () => {
    if (!selectedTable) return;
    
    const tableId = selectedTable.id;
    const tableNum = selectedTable.number;
    const finalTotal = totalUsd;
    const isExternal = selectedTable.type === 'takeaway' || selectedTable.type === 'delivery';
    
    // 1. Limpiar estado visual inmediatamente
    setIsBillingOpen(false);
    setSelectedTable(null);
    setCart([]);
    setOrderNote("");

    try {
      // 2. Eliminar todas las órdenes de cocina para esta mesa
      const tableOrders = (orders as any[]).filter((o: any) => o.tableNumber === tableNum);
      for (const order of tableOrders) {
        await db.deleteOrder(order.id);
      }

      // 3. Gestionar la mesa/orden externa en la DB
      if (isExternal) {
        // Si es externa y ya se cobró, se elimina definitivamente
        await db.deleteTable(tableId);
      } else {
        // Si es una mesa física, se libera
        await db.saveTable({ 
          id: tableId,
          number: tableNum,
          status: 'available',
          currentOrderId: null,
          currentTotalUsd: 0,
          startTime: null,
          orderData: null,
          orderNote: null
        });
      }

      // 4. Registrar la venta
      completeSale(finalTotal);
      
      // 5. Recargar datos para sincronizar con la DB (ignorando la selección para que no se reabra)
      await loadData(true);
    } catch (error) {
      console.error("Error finalizing payment:", error);
    }
  };

  if (selectedTable) {
    const isExternal = selectedTable.type === 'takeaway' || selectedTable.type === 'delivery';

    return (
      <main className="min-h-screen bg-brand-dark flex flex-col md:flex-row overflow-hidden md:h-screen relative">
        <div className="absolute top-0 left-0 nebula-accent-glow opacity-20" />
        
        {/* Productos */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.1, x: -5 }}
                onClick={() => {
                  setSelectedTable(null);
                  setSearchTerm("");
                }}
                className="p-3 glass-card text-brand-text/60 hover:text-white transition-all"
              >
                <ChevronLeft size={24} />
              </motion.button>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                  {isExternal ? (
                    <>
                      {selectedTable.type === 'takeaway' ? <ShoppingBag className="text-brand-accent" /> : <Bike className="text-brand-highlight" />}
                      {selectedTable.number}
                    </>
                  ) : (
                    `Mesa #${selectedTable.number}`
                  )}
                </h2>
                <p className="text-brand-text/40 text-[10px] font-black uppercase tracking-[0.3em]">
                  {isExternal ? `Orden para ${selectedTable.type === 'takeaway' ? 'Llevar' : 'Delivery'}` : 'Selección de Menú'}
                </p>
              </div>
            </div>

            {/* Botón Flotante Comanda Móvil */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsCartMobileOpen(true)}
              className="md:hidden p-4 bg-brand-accent text-white rounded-2xl shadow-xl shadow-brand-accent/20 flex items-center gap-2 relative"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-white text-brand-accent rounded-full text-[10px] font-black flex items-center justify-center border-2 border-brand-accent">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </motion.button>
          </header>

          <div className="mb-8 relative z-20">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/20" size={18} />
              <input 
                type="text" 
                placeholder="BUSCAR PRODUCTO O CATEGORÍA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-brand-accent transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text/20 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 md:pb-0">
            <AnimatePresence>
              {filteredProducts.map((product, idx) => {
                const isOutOfStock = product.stock !== undefined && product.stock === 0;
                const isLowStock = product.stock !== undefined && product.stock !== -1 && product.minStock !== undefined && product.stock <= product.minStock;

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
                    
                    {product.stock !== undefined && product.stock !== -1 && (
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
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-brand-text/20">
                <Search size={64} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>

        {/* Comanda (Overlay en móvil, sidebar en desktop) */}
        <AnimatePresence>
          {(isCartMobileOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 md:relative md:inset-auto z-[100] md:z-20 w-full md:w-[420px] h-full flex flex-col"
            >
              {/* Overlay Backdrop (Solo móvil) */}
              <div 
                className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm md:hidden"
                onClick={() => setIsCartMobileOpen(false)}
              />

              <div className="relative glass-card !rounded-none !border-y-0 !border-r-0 flex flex-col h-full bg-brand-card/95 md:bg-brand-card/20 backdrop-blur-2xl w-full ml-auto shadow-2xl md:shadow-none">
                <div className="p-8 border-b border-brand-border/30 flex justify-between items-center">
                  <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-widest">
                    <ShoppingCart size={22} className="text-brand-accent" /> Comanda
                  </h2>
                  <button 
                    onClick={() => setIsCartMobileOpen(false)}
                    className="md:hidden p-2 text-brand-text/40 hover:text-white"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center py-20">
                      <ShoppingCart size={64} className="mx-auto mb-6 text-brand-text/10" />
                      <p className="text-brand-text/20 font-black uppercase tracking-[0.3em] text-xs">Sin productos</p>
                    </div>
                  ) : (
                    <>
                      {cart.map(item => (
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
                            <div className="flex items-center bg-brand-dark rounded-xl border border-brand-border/50">
                              <button 
                                onClick={() => decreaseQuantity(item.product.id)}
                                className="p-2 text-brand-text/40 hover:text-white transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-white font-black text-xs min-w-[20px] text-center">{item.quantity}</span>
                              <button 
                                onClick={() => addToCart(item.product)}
                                className="p-2 text-brand-text/40 hover:text-white transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="text-right min-w-[80px]">
                              <p className="font-black text-white">{formatUsd(item.product.price * item.quantity)}</p>
                              <button 
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-brand-text/10 hover:text-red-400 p-1 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}

                      {orderNote && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-brand-highlight/10 border border-brand-highlight/20 p-4 rounded-2xl flex items-start gap-3"
                        >
                          <StickyNote size={18} className="text-brand-highlight shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-brand-highlight uppercase tracking-widest mb-1">Nota para Cocina</p>
                            <p className="text-xs text-white/80 italic">"{orderNote}"</p>
                          </div>
                          <button onClick={() => setOrderNote("")} className="text-brand-highlight/40 hover:text-red-400 p-1">
                            <X size={14} />
                          </button>
                        </motion.div>
                      )}

                      <button 
                        onClick={() => setIsNoteModalOpen(true)}
                        className="w-full py-3 border border-dashed border-brand-border/50 rounded-2xl flex items-center justify-center gap-2 text-brand-text/40 hover:text-brand-highlight hover:border-brand-highlight/50 transition-all text-[10px] font-black uppercase tracking-widest"
                      >
                        <MessageSquarePlus size={16} />
                        {orderNote ? 'Editar Nota' : 'Agregar Nota'}
                      </button>
                    </>
                  )}
                </div>

                <div className="p-8 bg-brand-dark/60 border-t border-brand-border/50 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-brand-text/40 text-[10px] font-black uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>{formatUsd(subtotalUsd)}</span>
                    </div>
                    {ivaEnabled && (
                      <div className="flex justify-between text-brand-text/40 text-[10px] font-black uppercase tracking-widest">
                        <span>IVA ({iva * 100}%)</span>
                        <span>{formatUsd(ivaUsd)}</span>
                      </div>
                    )}
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
                    {currentUser?.role !== 'waiter' && (
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleChargeClick}
                        className="w-full bg-brand-highlight text-brand-dark py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-brand-highlight/20 transition-all uppercase tracking-widest text-sm"
                      >
                        <DollarSign size={20} strokeWidth={3} /> Cobrar
                      </motion.button>
                    )}

                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isSendingToKitchen || (
                          selectedTable.status === 'ready' && 
                          cart.length > 0 && 
                          JSON.stringify(cart) === selectedTable.orderData &&
                          orderNote === (selectedTable.orderNote || "")
                        )}
                        onClick={() => {
                          handleSendToKitchen();
                          setIsCartMobileOpen(false);
                        }}
                        className={`w-full bg-brand-accent text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-brand-accent/20 transition-all uppercase tracking-widest text-sm ${(isSendingToKitchen || (selectedTable.status === 'ready' && cart.length > 0 && JSON.stringify(cart) === selectedTable.orderData && orderNote === (selectedTable.orderNote || ""))) ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                      {isSendingToKitchen ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={20} strokeWidth={3} />
                      )}
                      {isSendingToKitchen ? 'Enviando...' : 'Cocina'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BillingModal 
          isOpen={isBillingOpen}
          onClose={() => setIsBillingOpen(false)}
          tableNumber={selectedTable.number}
          subtotalUsd={subtotalUsd}
          items={cart}
          onComplete={handlePaymentComplete}
          type={selectedTable.type}
        />

        <TableNameModal 
          isOpen={isTableNameModalOpen}
          onClose={() => setIsTableNameModalOpen(false)}
          defaultValue={suggestedTableName}
          onConfirm={confirmCreateTable}
        />

        <NoteModal 
          isOpen={isNoteModalOpen}
          onClose={() => setIsNoteModalOpen(false)}
          value={orderNote}
          onConfirm={(val) => {
            setOrderNote(val);
            setIsNoteModalOpen(false);
          }}
        />

        <ChargeWarningModal 
          isOpen={isChargeWarningOpen}
          onClose={() => setIsChargeWarningOpen(false)}
          onConfirm={() => {
            setIsChargeWarningOpen(false);
            setIsBillingOpen(true);
          }}
          onSendToKitchen={async () => {
            await handleSendToKitchen();
            setIsChargeWarningOpen(false);
            // Opcional: Podrías abrir el cobro automáticamente después de enviar a cocina, 
            // pero el flujo actual de handleSendToKitchen cierra la mesa.
          }}
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
              onClick={() => setIsTakeawayModalOpen(true)}
              className="bg-brand-highlight text-brand-dark px-6 py-3 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-brand-highlight/20 uppercase tracking-widest text-xs"
            >
              <ShoppingBag size={18} /> Para Llevar / Delivery
            </motion.button>
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={createTable}
              className="bg-brand-accent text-white px-6 py-3 rounded-2xl font-black flex items-center gap-3 transition-all shadow-xl shadow-brand-accent/20 uppercase tracking-widest text-xs"
            >
              <PlusCircle size={18} /> Nueva Mesa
            </motion.button>
            <button 
              onClick={() => setIsExternalOrdersOpen(true)}
              className="glass-card px-5 py-3 flex items-center gap-3 text-xs font-black uppercase tracking-widest text-brand-text/60 hover:text-white transition-all relative"
            >
              <Package size={18} /> Externas
              {tables.filter(t => t.type === 'takeaway' || t.type === 'delivery').length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-highlight text-brand-dark rounded-full flex items-center justify-center text-[10px] font-black border-2 border-brand-dark">
                  {tables.filter(t => t.type === 'takeaway' || t.type === 'delivery').length}
                </span>
              )}
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <h2 className="text-xs font-black text-brand-text/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-brand-border" />
              Distribución del Comedor
              <span className="flex-1 h-[1px] bg-brand-border" />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {tables.filter(t => !t.type || t.type === 'table').map((table, idx) => (
                  <TableCard key={table.id} table={table} onSelect={handleTableSelect} idx={idx} onDelete={deleteTable} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          <aside className="hidden lg:block w-80 shrink-0">
            <h2 className="text-xs font-black text-brand-text/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-brand-border" />
              Órdenes Externas
            </h2>
            <div className="space-y-4">
              {tables.filter(t => t.type === 'takeaway' || t.type === 'delivery').length === 0 ? (
                <div className="glass-card p-10 text-center opacity-20 flex flex-col items-center gap-4">
                  <Package size={40} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin órdenes activas</p>
                </div>
              ) : (
                tables.filter(t => t.type === 'takeaway' || t.type === 'delivery').map((table, idx) => (
                  <ExternalOrderCard key={table.id} table={table} onSelect={handleTableSelect} idx={idx} />
                ))
              )}
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {isExternalOrdersOpen && (
          <div className="fixed inset-0 z-[150] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExternalOrdersOpen(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-brand-dark border-l border-brand-border p-8 flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <Package size={22} className="text-brand-highlight" /> Órdenes Externas
                </h2>
                <button onClick={() => setIsExternalOrdersOpen(false)} className="p-2 text-brand-text/40">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                {tables.filter(t => t.type === 'takeaway' || t.type === 'delivery').map((table, idx) => (
                  <ExternalOrderCard 
                    key={table.id} 
                    table={table} 
                    onSelect={(t) => {
                      handleTableSelect(t);
                      setIsExternalOrdersOpen(false);
                    }} 
                    idx={idx} 
                  />
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <TakeawayModal 
        isOpen={isTakeawayModalOpen}
        onClose={() => setIsTakeawayModalOpen(false)}
        onConfirm={confirmCreateTakeaway}
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

export default function POSPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      </div>
    }>
      <POSContent />
    </Suspense>
  );
}

function ExternalOrderCard({ table, onSelect, idx }: { table: Table, onSelect: (t: Table) => void, idx: number }) {
  const isTakeaway = table.type === 'takeaway';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.05 }}
      whileHover={{ scale: 1.02, x: -5 }}
      onClick={() => onSelect(table)}
      className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-brand-highlight/30 group relative overflow-hidden"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isTakeaway ? 'bg-brand-accent/10 text-brand-accent' : 'bg-brand-highlight/10 text-brand-highlight'}`}>
        {isTakeaway ? <ShoppingBag size={20} /> : <Bike size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-white text-sm truncate uppercase tracking-tight">{table.number}</p>
        <p className="text-[9px] font-black text-brand-text/30 uppercase tracking-widest">
          {isTakeaway ? 'Para Llevar' : 'Delivery'} • {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(table.currentTotalUsd || 0)}
        </p>
      </div>
      <ArrowRight size={16} className="text-brand-text/10 group-hover:text-brand-highlight transition-colors" />
    </motion.div>
  );
}

function TableCard({ table, onSelect, idx, onDelete }: { table: Table, onSelect: (t: Table) => void, idx: number, onDelete: (id: string, e: React.MouseEvent) => void }) {
  const statusConfig = {
    available: {
      accent: "text-brand-text/40",
      border: "border-transparent",
      bg: "bg-brand-text/5",
      label: "bg-brand-text/10 text-brand-text/40",
      text: "Disponible",
      icon: <Plus className="text-brand-text/20" size={32} strokeWidth={3} />
    },
    occupied: {
      accent: "text-brand-accent",
      border: "border-brand-accent/30",
      bg: "bg-brand-accent/5",
      label: "bg-brand-accent/10 text-brand-accent",
      text: "Ocupada",
      icon: <Clock className="text-brand-accent" size={20} />
    },
    billing: {
      accent: "text-brand-highlight",
      border: "border-brand-highlight/30",
      bg: "bg-brand-highlight/5",
      label: "bg-brand-highlight/10 text-brand-highlight",
      text: "Cuenta",
      icon: <DollarSign className="text-brand-highlight" size={20} />
    },
    ready: {
      accent: "text-[#00FF9D]",
      border: "border-[#00FF9D]/60",
      bg: "bg-[#00FF9D]/10",
      label: "bg-[#00FF9D]/20 text-[#00FF9D]",
      text: "LISTO",
      icon: <CheckCircle2 className="text-[#00FF9D] drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" size={20} />
    },
    partially_ready: {
      accent: "text-orange-400",
      border: "border-orange-400/60",
      bg: "bg-orange-400/10",
      label: "bg-orange-400/20 text-orange-400",
      text: "PARCIAL",
      icon: <CheckCircle2 className="text-orange-400" size={20} />
    }
  };

  const config = statusConfig[table.status];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: table.status === 'ready' ? [
          "0 0 20px rgba(0, 255, 157, 0.1)",
          "0 0 40px rgba(0, 255, 157, 0.2)",
          "0 0 20px rgba(0, 255, 157, 0.1)"
        ] : "0px 0px 0px rgba(0, 0, 0, 0)"
      }}
      transition={{ 
        delay: idx * 0.05,
        boxShadow: {
          duration: 2,
          repeat: table.status === 'ready' ? Infinity : 0,
          ease: "easeInOut"
        }
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      onClick={() => onSelect(table)}
      className={`glass-card p-6 flex flex-col h-[200px] group relative overflow-hidden cursor-pointer transition-all border-2 ${config.border} ${table.status === 'ready' ? 'shadow-[0_0_30px_rgba(0,255,157,0.15)]' : ''}`}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 ${config.bg} rounded-full -mr-12 -mt-12 transition-all group-hover:opacity-80`} />

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
        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${config.label}`}>
          {config.text}
        </span>
      </div>

      {table.status !== 'available' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-brand-text/40 text-[10px] font-black uppercase">
            {config.icon}
            <span>
              {table.startTime 
                ? new Date(table.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                : ''}
            </span>
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

function TakeawayModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (name: string, type: 'takeaway' | 'delivery') => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<'takeaway' | 'delivery'>('takeaway');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[250] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-10 w-full max-w-md shadow-2xl relative overflow-hidden border-brand-highlight/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-highlight/50" />
        
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Orden Externa</h2>
        <p className="text-brand-text/40 mb-8 font-bold text-xs uppercase tracking-widest">Identifica el pedido</p>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={() => setType('takeaway')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'takeaway' ? 'border-brand-accent bg-brand-accent/10 text-brand-accent' : 'border-brand-border/30 text-brand-text/40'}`}
          >
            <ShoppingBag size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Llevar</span>
          </button>
          <button 
            onClick={() => setType('delivery')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${type === 'delivery' ? 'border-brand-highlight bg-brand-highlight/10 text-brand-highlight' : 'border-brand-border/30 text-brand-text/40'}`}
          >
            <Bike size={24} />
            <span className="text-[10px] font-black uppercase tracking-widest">Delivery</span>
          </button>
        </div>

        <input 
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(name, type)}
          className="w-full bg-brand-dark/50 border border-brand-border rounded-2xl p-6 text-2xl font-black text-white focus:border-brand-highlight focus:ring-4 focus:ring-brand-highlight/10 transition-all outline-none mb-8 text-center placeholder:text-brand-text/10"
          placeholder="Nombre del Cliente"
        />

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onClose}
            className="p-4 bg-brand-border/20 hover:bg-brand-border/40 text-brand-text font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(name, type)}
            className="p-4 bg-brand-highlight hover:bg-brand-highlight/90 text-brand-dark rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-highlight/20 transition-all"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NoteModal({ isOpen, onClose, value, onConfirm }: { isOpen: boolean, onClose: () => void, value: string, onConfirm: (val: string) => void }) {
  const [tempNote, setTempNote] = useState(value);

  useEffect(() => {
    setTempNote(value);
  }, [value, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[250] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-10 w-full max-w-md shadow-2xl relative overflow-hidden border-brand-highlight/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-highlight/50" />
        
        <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Nota de Cocina</h2>
        <p className="text-brand-text/40 mb-8 font-bold text-xs uppercase tracking-widest">Observaciones para el pedido</p>
        
        <textarea 
          autoFocus
          value={tempNote}
          onChange={(e) => setTempNote(e.target.value)}
          placeholder="Ej: Sin cebolla, término medio, etc..."
          className="w-full bg-brand-dark/50 border border-brand-border rounded-2xl p-6 text-lg font-bold text-white focus:border-brand-highlight focus:ring-4 focus:ring-brand-highlight/10 transition-all outline-none mb-8 min-h-[150px] resize-none placeholder:text-brand-text/10"
        />

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onClose}
            className="p-4 bg-brand-border/20 hover:bg-brand-border/40 text-brand-text font-black uppercase tracking-widest text-xs rounded-2xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(tempNote)}
            className="p-4 bg-brand-highlight hover:bg-brand-highlight/90 text-brand-dark rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-highlight/20 transition-all"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ChargeWarningModal({ isOpen, onClose, onConfirm, onSendToKitchen }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, onSendToKitchen: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-[300] p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-10 w-full max-w-md shadow-2xl relative overflow-hidden border-red-500/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 animate-pulse">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Cambios Pendientes</h2>
          <p className="text-brand-text/60 font-bold text-xs uppercase tracking-widest leading-relaxed">
            Hay productos en la comanda que no han sido enviados a la cocina.
          </p>
        </div>
        
        <div className="space-y-3">
          <button 
            onClick={onSendToKitchen}
            className="w-full p-4 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-accent/20 transition-all flex items-center justify-center gap-3"
          >
            <Send size={18} /> Enviar a Cocina Primero
          </button>
          
          <button 
            onClick={onConfirm}
            className="w-full p-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all border border-white/10"
          >
            Cobrar de todas formas
          </button>

          <button 
            onClick={onClose}
            className="w-full p-4 text-brand-text/40 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Regresar a la comanda
          </button>
        </div>
      </motion.div>
    </div>
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
