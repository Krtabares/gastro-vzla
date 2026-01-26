"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

interface OrdersContextType {
  orders: Order[];
  dailySalesUsd: number;
  addOrder: (tableNumber: string, items: OrderItem[]) => void;
  markAsReady: (orderId: string) => void;
  completeSale: (amountUsd: number) => void;
  resetDay: () => void;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [dailySalesUsd, setDailySalesUsd] = useState(0);

  const addOrder = (tableNumber: string, items: OrderItem[]) => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      tableNumber,
      items,
      status: 'pending',
      createdAt: new Date(),
    };
    setOrders(prev => [...prev, newOrder]);
  };

  const markAsReady = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const completeSale = (amountUsd: number) => {
    setDailySalesUsd(prev => prev + amountUsd);
  };

  const resetDay = () => {
    setDailySalesUsd(0);
    // No alert here, handled by modal flow
  };

  return (
    <OrdersContext.Provider value={{ orders, dailySalesUsd, addOrder, markAsReady, completeSale, resetDay }}>
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
