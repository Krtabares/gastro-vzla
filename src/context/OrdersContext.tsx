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
  zoneId?: string;
}

interface OrdersContextType {
  orders: Order[];
  dailySalesUsd: number;
  addOrder: (tableNumber: string, items: OrderItem[], note?: string, type?: 'table' | 'takeaway' | 'delivery', zoneId?: string) => void;
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
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
      createdAt: new Date(o.createdAt),
      dispatchedAt: o.dispatchedAt ? new Date(o.dispatchedAt) : undefined
    })));
  };

  const addOrder = async (tableNumber: string, items: OrderItem[], note?: string, type: 'table' | 'takeaway' | 'delivery' = 'table', zoneId?: string) => {
    const newOrder = {
      tableNumber,
      items,
      status: 'pending' as const,
      note,
      type,
      zoneId,
      createdAt: new Date().toISOString(),
    };
    
    await db.saveOrder(newOrder);
  };

  const markAsReady = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Primero marcamos la orden como lista en la DB
      await db.updateOrder(orderId, { 
        status: 'ready',
        dispatchedAt: new Date().toISOString()
      });

      // Obtenemos el estado más reciente de todas las órdenes para esta mesa
      const allOrders = await db.getOrders();
      const tableOrders = allOrders.filter((o: any) => 
        o.tableNumber.trim() === order.tableNumber.trim() || 
        parseInt(o.tableNumber) === parseInt(order.tableNumber)
      );
      
      // Una mesa está "ready" solo si TODAS sus órdenes están "ready"
      const allReady = tableOrders.every((o: any) => o.status === 'ready');
      
      if (allReady) {
        await db.updateTableStatus(order.tableNumber, 'ready');
      } else {
        await db.updateTableStatus(order.tableNumber, 'partially_ready');
      }
    }
  };

  const revertToKitchen = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      await db.updateOrder(orderId, { 
        status: 'pending',
        dispatchedAt: null
      });

      const allOrders = await db.getOrders();
      const tableOrders = allOrders.filter((o: any) => o.tableNumber === order.tableNumber);
      
      const hasReady = tableOrders.some((o: any) => o.status === 'ready');
      
      if (hasReady) {
        await db.updateTableStatus(order.tableNumber, 'partially_ready');
      } else {
        await db.updateTableStatus(order.tableNumber, 'occupied');
      }
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
