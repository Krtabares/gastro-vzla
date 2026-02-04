import { createClient } from '@supabase/supabase-js';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  stock?: number;
  minStock?: number;
}

export interface Table {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'billing' | 'ready';
  type?: 'table' | 'takeaway' | 'delivery';
  currentOrderId?: string | null;
  currentTotalUsd?: number | null;
  startTime?: string | null;
  orderData?: string | null;
  orderNote?: string | null;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: 'pending' | 'preparing' | 'delivered';
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  status: 'pending' | 'cooking' | 'ready';
  note?: string;
  createdAt: string;
}

export interface Payment {
  method: 'cash_usd' | 'cash_ves' | 'zelle' | 'pago_movil' | 'card';
  amountUsd: number;
  igtfUsd?: number;
  amountVes?: number;
}

export interface Sale {
  id: string;
  timestamp: string;
  items: OrderItem[];
  totalUsd: number;
  paymentMethod?: 'cash_usd' | 'cash_ves' | 'zelle' | 'pago_movil' | 'card';
  payments?: Payment[];
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'root' | 'admin' | 'cashier' | 'waiter';
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Database {
  products: Product[];
  tables: Table[];
  sales: Sale[];
  settings: {
    exchangeRate: number;
    iva: number;
    igtf: number;
  };
}

// Interfaz para interactuar con Electron IPC
declare global {
  interface Window {
    ipcRenderer: {
      invoke: (channel: string, data?: any) => Promise<any>;
    };
  }
}

const isElectron = typeof window !== 'undefined' && window.ipcRenderer;

// Configuración de Supabase (se carga de localStorage)
const getCloudConfig = () => {
  if (typeof window === 'undefined') return null;
  const url = localStorage.getItem('gastro_supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = localStorage.getItem('gastro_supabase_key') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) return { url, key };
  return null;
};

const getStorageMode = () => {
  if (typeof window === 'undefined') return 'local';
  const mode = localStorage.getItem('gastro_storage_mode');
  if (!mode) return 'cloud'; 
  return mode;
};

const getLocalServerUrl = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gastro_local_server_url') || '';
};

const cloudConfig = getCloudConfig();
export const supabase = cloudConfig ? createClient(cloudConfig.url, cloudConfig.key) : null;

// Helper to handle API calls to central server
const apiCall = async (path: string, method: string = 'GET', body?: any) => {
  const baseUrl = getLocalServerUrl();
  if (!baseUrl) throw new Error('Servidor central no configurado');
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) throw new Error(`Error en API: ${response.statusText}`);
  return await response.json();
};

export const db = {
  async getSettings(): Promise<Database['settings']> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('settings').select('*');
      if (data) {
        return data.reduce((acc, row) => ({ ...acc, [row.key]: parseFloat(row.value) }), { exchangeRate: 36.5, iva: 0.16, igtf: 0.03 });
      }
    }
    if (getStorageMode() === 'local' && !isElectron) {
      return await apiCall('/api/settings');
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-settings');
    const local = localStorage.getItem('gastro_settings');
    return local ? JSON.parse(local) : { exchangeRate: 36.5, iva: 0.16, igtf: 0.03 };
  },

  async updateSetting(key: string, value: number): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('settings').upsert({ key, value: value.toString() });
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-update-setting', { key, value });
    } else {
      const settings = await this.getSettings();
      localStorage.setItem('gastro_settings', JSON.stringify({ ...settings, [key]: value }));
    }
  },

  async getProducts(): Promise<Product[]> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('products').select('*');
      return data || [];
    }
    if (getStorageMode() === 'local' && !isElectron) {
      return await apiCall('/api/products');
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-products');
    const local = localStorage.getItem('gastro_products');
    return local ? JSON.parse(local) : [];
  },

  async saveProduct(product: Product): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('products').upsert(product);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-save-product', product);
    } else {
      const products = await this.getProducts();
      const index = products.findIndex(p => p.id === product.id);
      if (index > -1) products[index] = product;
      else products.push(product);
      localStorage.setItem('gastro_products', JSON.stringify(products));
    }
  },

  async getTables(): Promise<Table[]> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('tables').select('*');
      return data || [];
    }
    if (getStorageMode() === 'local' && !isElectron) {
      return await apiCall('/api/tables');
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-tables');
    const local = localStorage.getItem('gastro_tables');
    return local ? JSON.parse(local) : [];
  },

  async saveTable(table: Table): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('tables').upsert(table);
      return;
    }
    if (getStorageMode() === 'local' && !isElectron) {
      await apiCall('/api/tables', 'POST', table);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-save-table', table);
    } else {
      const tables = await this.getTables();
      const index = tables.findIndex(t => t.id === table.id);
      if (index > -1) tables[index] = table;
      else tables.push(table);
      localStorage.setItem('gastro_tables', JSON.stringify(tables));
    }
  },

  async deleteTable(id: string): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('tables').delete().eq('id', id);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-table', id);
    } else {
      const tables = await this.getTables();
      localStorage.setItem('gastro_tables', JSON.stringify(tables.filter(t => t.id !== id)));
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('products').delete().eq('id', id);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-product', id);
    } else {
      const products = await this.getProducts();
      localStorage.setItem('gastro_products', JSON.stringify(products.filter(p => p.id !== id)));
    }
  },

  async getSalesByMethod(startDate?: string, endDate?: string): Promise<any> {
    if (getStorageMode() === 'cloud' && supabase) {
      let query = supabase.from('sales').select('*').eq('status', 'open');
      if (startDate && endDate) {
        query = query.gte('timestamp', startDate).lte('timestamp', endDate);
      }
      const { data } = await query;
      const summary: Record<string, number> = { cash_usd: 0, cash_ves: 0, zelle: 0, pago_movil: 0, card: 0, total_usd: 0 };
      data?.forEach(sale => {
        const method = sale.paymentMethod || 'cash_usd';
        if (summary[method] !== undefined) summary[method] += sale.totalUsd;
        summary.total_usd += sale.totalUsd;
      });
      return summary;
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-sales-by-method', { startDate, endDate });
    return {};
  },

  async deleteSale(id: string): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('sales').delete().eq('id', id);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-sale', id);
    } else {
      const sales = await this.getSales();
      localStorage.setItem('gastro_sales', JSON.stringify(sales.filter(s => s.id !== id)));
    }
  },

  async getSales(startDate?: string, endDate?: string, includeClosed: boolean = false): Promise<Sale[]> {
    if (getStorageMode() === 'cloud' && supabase) {
      let query = supabase.from('sales').select('*');
      if (!includeClosed) {
        query = query.eq('status', 'open');
      }
      if (startDate && endDate) {
        query = query.gte('timestamp', startDate).lte('timestamp', endDate);
      }
      const { data } = await query.order('timestamp', { ascending: false });
      return data || [];
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-sales', { startDate, endDate, includeClosed });
    const local = localStorage.getItem('gastro_sales');
    const sales: Sale[] = local ? JSON.parse(local) : [];
    
    let filtered = sales;
    if (!includeClosed) {
      filtered = sales.filter(s => (s as any).status !== 'closed');
    }
    
    if (startDate && endDate) {
      return filtered.filter(s => s.timestamp >= startDate && s.timestamp <= endDate);
    }
    return filtered;
  },

  async login(username: string, password: string): Promise<User | null> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('users').select('*').eq('username', username).eq('password', password).maybeSingle();
      return data || null;
    }
    if (getStorageMode() === 'local' && !isElectron) {
      try {
        return await apiCall('/api/login', 'POST', { username, password });
      } catch (e) {
        return null;
      }
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-login', { username, password });
    return null;
  },

  async getUsers(): Promise<User[]> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('users').select('*');
      return data || [];
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-users');
    return [];
  },

  async deleteUser(id: string): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('users').delete().eq('id', id);
      return;
    }
    if (isElectron) await window.ipcRenderer.invoke('db-delete-user', id);
  },

  async createUser(user: User): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('users').upsert(user);
      return;
    }
    if (isElectron) await window.ipcRenderer.invoke('db-create-user', user);
  },

  async getCategories(): Promise<Category[]> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    }
    if (getStorageMode() === 'local' && !isElectron) {
      return await apiCall('/api/categories');
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-categories');
    const local = localStorage.getItem('gastro_categories');
    return local ? JSON.parse(local) : [];
  },

  async getOrders(): Promise<any[]> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('orders').select('*').order('createdAt', { ascending: true });
      return data || [];
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-orders');
    return [];
  },

  async saveOrder(order: any): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('orders').insert(order);
    }
  },

  async updateOrder(id: string, updates: any): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('orders').update(updates).eq('id', id);
    }
  },

  async updateTableStatus(tableNumber: string, status: Table['status']): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      // Buscamos por número de mesa de forma flexible
      const { data: tables } = await supabase.from('tables').select('id, number');
      const table = tables?.find(t => 
        t.number.trim() === tableNumber.trim() || 
        parseInt(t.number) === parseInt(tableNumber)
      );
      
      if (table) {
        await supabase.from('tables').update({ status }).eq('id', table.id);
      }
      return;
    }
    
    // Fallback local
    const tables = await this.getTables();
    const index = tables.findIndex(t => 
      t.number.trim() === tableNumber.trim() || 
      parseInt(t.number) === parseInt(tableNumber)
    );
    if (index > -1) {
      tables[index].status = status;
      localStorage.setItem('gastro_tables', JSON.stringify(tables));
    }
  },

  async deleteOrder(id: string): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('orders').delete().eq('id', id);
    }
  },

  async saveCategory(category: Category): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('categories').upsert(category);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-save-category', category);
    } else {
      const categories = await this.getCategories();
      const index = categories.findIndex(c => c.id === category.id);
      if (index > -1) categories[index] = category;
      else categories.push(category);
      localStorage.setItem('gastro_categories', JSON.stringify(categories));
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('categories').delete().eq('id', id);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-category', id);
    } else {
      const categories = await this.getCategories();
      localStorage.setItem('gastro_categories', JSON.stringify(categories.filter(c => c.id !== id)));
    }
  },

  async getLicenseStatus(): Promise<{ status: 'active' | 'expired' | 'none'; daysLeft: number; expiryDate?: string }> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('license').select('*').maybeSingle();
      if (!data) return { status: 'none', daysLeft: 0 };
      if (data.expiryDate === 'lifetime') return { status: 'active', daysLeft: 9999, expiryDate: 'lifetime' };
      const expiry = new Date(data.expiryDate);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { status: daysLeft > 0 ? 'active' : 'expired', daysLeft: Math.max(0, daysLeft), expiryDate: data.expiryDate };
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-get-license');
    return { status: 'none', daysLeft: 0 };
  },

  async activateLicense(key: string): Promise<{ success: boolean; error?: string }> {
    const LICENSE_KEYS: Record<string, number> = {
      'GASTRO-TRIAL-7': 7,
      'GASTRO-PRO-30': 30,
      'GASTRO-YEAR-365': 365,
      'GASTRO-FULL-LIFETIME': 99999
    };

    const days = LICENSE_KEYS[key];
    if (!days) return { success: false, error: 'Código de licencia inválido' };

    const expiryDate = days === 99999 
      ? 'lifetime' 
      : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('license').upsert({ 
        key, 
        activationDate: new Date().toISOString(), 
        expiryDate 
      });
      return { success: true };
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-activate-license', { key });
    return { success: false, error: 'IPC no disponible' };
  },

  async resetDatabase(mode: 'full' | 'partial'): Promise<{ success: boolean; error?: string }> {
    if (getStorageMode() === 'cloud' && supabase) {
      if (mode === 'full') {
        await supabase.from('sales').delete().neq('id', '0');
        await supabase.from('products').delete().neq('id', '0');
        await supabase.from('tables').delete().neq('id', '0');
      } else {
        // En lugar de borrar, cerramos la sesión de las ventas abiertas
        await supabase.from('sales').update({ status: 'closed' }).eq('status', 'open');
        await supabase.from('tables').update({ status: 'available', currentOrderId: null, currentTotalUsd: 0, startTime: null, orderData: null }).neq('id', '0');
      }
      return { success: true };
    }
    if (isElectron) return await window.ipcRenderer.invoke('db-reset', { mode });
    return { success: false, error: 'IPC no disponible' };
  },

  async updateProductStock(id: string, quantity: number): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      const { data } = await supabase.from('products').select('stock').eq('id', id).maybeSingle();
      if (data && data.stock !== -1) {
        const newStock = Math.max(0, data.stock - quantity);
        await supabase.from('products').update({ stock: newStock, available: newStock > 0 }).eq('id', id);
      }
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-update-product-stock', { id, quantity });
    } else {
      const products = await this.getProducts();
      const index = products.findIndex(p => p.id === id);
      if (index > -1) {
        const currentStock = products[index].stock || 0;
        products[index].stock = currentStock - quantity;
        localStorage.setItem('gastro_products', JSON.stringify(products));
      }
    }
  },

  async setProductStock(id: string, newStock: number): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('products').update({ stock: newStock, available: newStock > 0 }).eq('id', id);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-set-product-stock', { id, newStock });
    } else {
      const products = await this.getProducts();
      const index = products.findIndex(p => p.id === id);
      if (index > -1) {
        products[index].stock = newStock;
        localStorage.setItem('gastro_products', JSON.stringify(products));
      }
    }
  },

  async saveSale(sale: Sale): Promise<void> {
    if (getStorageMode() === 'cloud' && supabase) {
      await supabase.from('sales').insert(sale);
      for (const item of sale.items) {
        await this.updateProductStock(item.id, item.quantity);
      }
      return;
    }
    if (getStorageMode() === 'local' && !isElectron) {
      await apiCall('/api/sales', 'POST', sale);
      return;
    }
    if (isElectron) {
      await window.ipcRenderer.invoke('db-save-sale', sale);
      // Actualizar stock de productos si aplica
      for (const item of sale.items) {
        await this.updateProductStock(item.id, item.quantity);
      }
    } else {
      const sales = await this.getSales();
      sales.push(sale);
      localStorage.setItem('gastro_sales', JSON.stringify(sales));
      for (const item of sale.items) {
        await this.updateProductStock(item.id, item.quantity);
      }
    }
  }
};
;
