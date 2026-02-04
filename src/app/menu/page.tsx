"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrency } from "@/context/CurrencyContext";
import { db, Product, Category } from "@/lib/db";
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft,
  Utensils,
  Trash2,
  Power,
  Tag,
  X,
  Edit2,
  LayoutGrid,
  Layers
} from "lucide-react";
import Link from "next/link";
import ProductModal from "@/components/ProductModal";
import { motion, AnimatePresence } from "framer-motion";

export default function MenuPage() {
  const router = useRouter();
  const { formatUsd, formatVes, usdToVes } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await db.getCategories();
    setCategories(data);
  };

  const loadProducts = async () => {
    const data = await db.getProducts();
    setProducts(data);
  };

  const handleSaveProduct = async (newProd: { id?: string, name: string, category: string, priceUsd: number, stock?: number }) => {
    const product: Product = {
      id: newProd.id || Math.random().toString(36).substr(2, 9),
      name: newProd.name,
      category: newProd.category,
      price: newProd.priceUsd,
      available: editingProduct ? editingProduct.available : true,
      stock: newProd.stock
    };
    await db.saveProduct(product);
    setEditingProduct(null);
    loadProducts();
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const toggleAvailability = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      await db.saveProduct({ ...product, available: !product.available });
      loadProducts();
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      await db.deleteProduct(id);
      loadProducts();
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await db.saveCategory({
      id: Math.random().toString(36).substr(2, 9),
      name: newCategoryName.trim()
    });
    setNewCategoryName("");
    loadCategories();
  };

  const deleteCategory = async (id: string) => {
    if (confirm("¿Eliminar categoría? Los productos asociados no se borrarán.")) {
      await db.deleteCategory(id);
      loadCategories();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-brand-dark p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 nebula-accent-glow opacity-20" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="flex items-center gap-5">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="glass-card p-3 text-brand-text hover:text-brand-highlight transition-all flex items-center justify-center"
            >
              <ChevronLeft size={24} />
            </motion.button>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight uppercase">Menú & Precios</h1>
              <p className="text-brand-text/40 font-bold uppercase tracking-[0.4em] text-[10px]">Catálogo de Productos</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex-1 lg:flex-none glass-card px-6 py-3 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest text-brand-highlight hover:border-brand-highlight/30 transition-all"
            >
              <Layers size={18} /> Categorías
            </motion.button>
            <motion.button 
              whileHover={{ y: -2 }}
              onClick={() => setIsModalOpen(true)}
              className="flex-1 lg:flex-none bg-brand-accent text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-brand-accent/20 uppercase tracking-widest text-xs"
            >
              <Plus size={20} strokeWidth={3} /> Nuevo Item
            </motion.button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Filtros */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6">
              <label className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] mb-4 block">Búsqueda Inteligente</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/20" size={18} />
                <input 
                  type="text" 
                  placeholder="NOMBRE O CATEGORÍA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-brand-border/50 rounded-xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-brand-accent transition-all"
                />
              </div>
            </div>

            <div className="glass-card p-6 hidden lg:block">
              <label className="text-[10px] font-black text-brand-text/30 uppercase tracking-[0.3em] mb-4 block">Estadísticas rápidas</label>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-brand-text/60">Total Platos</span>
                  <span className="text-white font-black">{products.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-brand-text/60">Agotados</span>
                  <span className="text-red-400 font-black">{products.filter(p => !p.available).length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Listado de Productos */}
          <div className="lg:col-span-3">
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-card/30">
                      <th className="px-8 py-5 text-[10px] font-black text-brand-text/30 uppercase tracking-widest">Plato / Bebida</th>
                      <th className="px-8 py-5 text-[10px] font-black text-brand-text/30 uppercase tracking-widest">Stock</th>
                      <th className="px-8 py-5 text-[10px] font-black text-brand-text/30 uppercase tracking-widest">Precio USD</th>
                      <th className="px-8 py-5 text-[10px] font-black text-brand-text/30 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/20">
                    <AnimatePresence>
                      {filteredProducts.map((product) => (
                        <motion.tr 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={product.id} 
                          className="hover:bg-brand-accent/5 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-brand-border/30 transition-all ${product.available ? 'bg-brand-accent/10 text-brand-accent' : 'bg-red-500/10 text-red-400'}`}>
                                <Utensils size={20} />
                              </div>
                              <div>
                                <p className="font-black text-white text-sm mb-1 uppercase tracking-tight">{product.name}</p>
                                <span className="px-2 py-0.5 bg-brand-border/40 text-brand-text/40 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                  {product.category}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-black">
                            {product.stock !== undefined && product.stock !== -1 ? (
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${product.stock <= 5 ? 'text-red-400' : 'text-white'}`}>
                                  {product.stock}
                                </span>
                                {product.stock <= 5 && <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />}
                              </div>
                            ) : (
                              <span className="text-brand-text/10 text-xl">∞</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-black text-white text-lg leading-none mb-1">{formatUsd(product.price)}</p>
                            <p className="text-[10px] font-black text-brand-highlight uppercase tracking-tighter">Bs. {formatVes(usdToVes(product.price))}</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                onClick={() => handleEditClick(product)}
                                className="p-3 glass-card text-brand-highlight hover:bg-brand-highlight/10 transition-colors"
                              >
                                <Edit2 size={16} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                onClick={() => toggleAvailability(product.id)}
                                className={`p-3 glass-card transition-colors ${
                                  product.available ? 'text-brand-accent hover:bg-brand-accent/10' : 'text-green-400 hover:bg-green-400/10'
                                }`}
                              >
                                <Power size={16} />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                onClick={() => deleteProduct(product.id)}
                                className="p-3 glass-card text-red-400 hover:bg-red-400/10 transition-colors"
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
                {filteredProducts.length === 0 && (
                  <div className="p-20 text-center text-brand-text/20">
                    <LayoutGrid size={64} strokeWidth={1} className="mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em]">No se encontraron items</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Categorías */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-brand-dark/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md shadow-2xl overflow-hidden border-brand-highlight/20"
            >
              <div className="p-8 border-b border-brand-border/30 flex justify-between items-center bg-brand-highlight/5">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Categorías</h2>
                  <p className="text-[10px] font-bold text-brand-text/40 uppercase tracking-widest mt-1">Organización de Menú</p>
                </div>
                <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 glass-card hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <form onSubmit={handleAddCategory} className="flex gap-3 mb-8">
                  <input 
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="NUEVA CATEGORÍA..."
                    className="flex-1 bg-brand-dark/50 border border-brand-border/50 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-brand-highlight transition-all"
                  />
                  <button type="submit" className="bg-brand-highlight text-brand-dark p-3 rounded-xl hover:bg-brand-highlight/90 transition-all shadow-lg shadow-brand-highlight/20">
                    <Plus size={20} strokeWidth={3} />
                  </button>
                </form>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex justify-between items-center p-4 bg-brand-dark/40 rounded-2xl border border-brand-border/20 group hover:border-brand-highlight/30 transition-all">
                      <span className="font-black text-brand-text/60 uppercase text-[10px] tracking-widest">{cat.name}</span>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="text-brand-text/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-center text-brand-text/20 py-10 text-[10px] font-black uppercase tracking-widest">Sin categorías</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        editingProduct={editingProduct}
      />
    </main>
  );
}
