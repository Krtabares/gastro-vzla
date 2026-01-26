"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  ArrowLeft,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { db, Product } from '@/lib/db';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await db.getProducts();
    // Solo mostrar productos que tienen control de inventario activado
    setProducts(data.filter(p => p.stock !== undefined));
    setLoading(false);
  };

  const handleAdjustStock = async (id: string, amount: number) => {
    await db.updateProductStock(id, -amount); // updateProductStock resta la cantidad pasada
    loadProducts();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockCount = products.filter(p => p.stock !== undefined && p.minStock !== undefined && p.stock <= p.minStock).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft size={24} className="text-gray-600" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Box className="text-blue-600" /> Inventario
              </h1>
            </div>
            <button 
              onClick={loadProducts}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-blue-600"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                <Box size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Productos</p>
                <p className="text-2xl font-bold text-gray-800">{products.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Stock Bajo</p>
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Categorías</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Set(products.map(p => p.category)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Producto</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Categoría</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Stock Actual</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => {
                  const isLowStock = product.stock !== undefined && product.minStock !== undefined && product.stock <= product.minStock;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-800">{product.name}</div>
                        {isLowStock && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">
                            Stock Bajo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {product.category}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-lg font-bold ${isLowStock ? 'text-red-600' : 'text-gray-800'}`}>
                          {product.stock}
                          <span className="text-xs text-gray-400 ml-1 font-normal">
                            / min: {product.minStock || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleAdjustStock(product.id, -1)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                            title="Sumar 1 unidad"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => handleAdjustStock(product.id, 1)}
                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                            title="Restar 1 unidad (Merma)"
                          >
                            <Minus size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="p-12 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No se encontraron productos con inventario.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
