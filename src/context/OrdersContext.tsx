"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, supabase } from '@/lib/db';

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: 'pending' | 'cooking' | 'ready';
  createdAt: Date;
  dispatchedAt?: Date;
  type?: 'table' | 'takeaway' | 'delivery';
  note?: string;
}

interface OrdersContextType {
  orders: Order[];
  dailySalesUsd: number;
  addOrder: (tableNumber: string, items: OrderItem[], note?: string, type?: 'table' | 'takeaway' | 'delivery') => void;
  markAsReady: (orderId: string) => void;
  revertToKitchen: (orderId: string) => void;
  updateOrderNote: (tableNumber: string, note: string) => Promise<void>;
  completeSale: (amountUsd: number) => void;
  resetDay: () => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dailySalesUsd, setDailySalesUsd] = useState(0);

  useEffect(() => {
    loadOrders();

    // Sincronización Realtime (Cloud)
    if (supabase) {
      const currentSupabase = supabase;
      const channel = currentSupabase
        .channel('realtime-orders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        currentSupabase.removeChannel(channel);
      };
    }
  }, []);

  const loadOrders = async () => {
    const data = await db.getOrders();
    setOrders(data.map((o: any) => ({
      ...o,
      createdAt: new Date(o.createdAt),
      dispatchedAt: o.dispatchedAt ? new Date(o.dispatchedAt) : undefined
    })));
  };

  const addOrder = async (tableNumber: string, items: OrderItem[], note?: string, type: 'table' | 'takeaway' | 'delivery' = 'table') => {
    const newOrder = {
      tableNumber,
      items,
      status: 'pending' as const,
      note,
      type,
      createdAt: new Date().toISOString(),
    };
    
    await db.saveOrder(newOrder);
  };

  const markAsReady = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await db.updateTableStatus(order.tableNumber, 'ready');
      await db.updateOrder(orderId, { 
        status: 'ready',
        dispatchedAt: new Date().toISOString()
      });
    }
  };

  const revertToKitchen = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Si es una mesa física, volvemos a ponerla en 'occupied'
      // Si es externa, usualmente ya está en 'occupied' o 'ready'
      await db.updateTableStatus(order.tableNumber, 'occupied');
      await db.updateOrder(orderId, { 
        status: 'pending',
        dispatchedAt: null
      });
    }
  };

  const updateOrderNote = async (tableNumber: string, note: string) => {
    // Buscar órdenes activas para esta mesa que no estén listas
    const activeOrders = orders.filter(o => o.tableNumber === tableNumber && o.status !== 'ready');
    for (const order of activeOrders) {
      await db.updateOrder(order.id, { note });
    }
    await loadOrders();
  };

  const completeSale = (amountUsd: number) => {
    setDailySalesUsd(prev => prev + amountUsd);
  };

  const resetDay = () => {
    setDailySalesUsd(0);
    // No alert here, handled by modal flow
  };

  return (
    <OrdersContext.Provider value={{ orders, dailySalesUsd, addOrder, markAsReady, revertToKitchen, updateOrderNote, completeSale, resetDay }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
