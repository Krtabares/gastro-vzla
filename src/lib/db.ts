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
  status: 'available' | 'occupied' | 'billing';
  currentOrderId?: string;
  currentTotalUsd?: number;
  startTime?: string;
  orderData?: string;
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
  createdAt: string;
}

export interface Sale {
  id: string;
  timestamp: string;
  items: OrderItem[];
  totalUsd: number;
  paymentMethod?: 'cash_usd' | 'cash_ves' | 'zelle' | 'pago_movil' | 'card';
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'root' | 'admin' | 'cashier';
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

export const db = {
  async getSettings(): Promise<Database['settings']> {
    if (isElectron) return await window.ipcRenderer.invoke('db-get-settings');
    const local = localStorage.getItem('gastro_settings');
    return local ? JSON.parse(local) : { exchangeRate: 36.5, iva: 0.16, igtf: 0.03 };
  },

  async updateSetting(key: string, value: number): Promise<void> {
    if (isElectron) {
      await window.ipcRenderer.invoke('db-update-setting', { key, value });
    } else {
      const settings = await this.getSettings();
      localStorage.setItem('gastro_settings', JSON.stringify({ ...settings, [key]: value }));
    }
  },

  async getProducts(): Promise<Product[]> {
    if (isElectron) return await window.ipcRenderer.invoke('db-get-products');
    const local = localStorage.getItem('gastro_products');
    return local ? JSON.parse(local) : [];
  },

  async saveProduct(product: Product): Promise<void> {
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
    if (isElectron) return await window.ipcRenderer.invoke('db-get-tables');
    const local = localStorage.getItem('gastro_tables');
    return local ? JSON.parse(local) : [];
  },

  async saveTable(table: Table): Promise<void> {
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
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-table', id);
    } else {
      const tables = await this.getTables();
      localStorage.setItem('gastro_tables', JSON.stringify(tables.filter(t => t.id !== id)));
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-product', id);
    } else {
      const products = await this.getProducts();
      localStorage.setItem('gastro_products', JSON.stringify(products.filter(p => p.id !== id)));
    }
  },

  async getSalesByMethod(startDate?: string, endDate?: string): Promise<any> {
    if (isElectron) return await window.ipcRenderer.invoke('db-get-sales-by-method', { startDate, endDate });
    return {};
  },

  async deleteSale(id: string): Promise<void> {
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-sale', id);
    } else {
      const sales = await this.getSales();
      localStorage.setItem('gastro_sales', JSON.stringify(sales.filter(s => s.id !== id)));
    }
  },
  async getSales(startDate?: string, endDate?: string): Promise<Sale[]> {
    if (isElectron) return await window.ipcRenderer.invoke('db-get-sales', { startDate, endDate });
    const local = localStorage.getItem('gastro_sales');
    const sales: Sale[] = local ? JSON.parse(local) : [];
    if (startDate && endDate) {
      return sales.filter(s => s.timestamp >= startDate && s.timestamp <= endDate);
    }
    return sales;
  },

  async login(username: string, password: string): Promise<User | null> {
    if (isElectron) return await window.ipcRenderer.invoke('db-login', { username, password });
    return null;
  },

  async getUsers(): Promise<User[]> {
    if (isElectron) return await window.ipcRenderer.invoke('db-get-users');
    return [];
  },

  async deleteUser(id: string): Promise<void> {
    if (isElectron) await window.ipcRenderer.invoke('db-delete-user', id);
  },

  async createUser(user: User): Promise<void> {
    if (isElectron) await window.ipcRenderer.invoke('db-create-user', user);
  },

  async getCategories(): Promise<Category[]> {
    if (isElectron) return await window.ipcRenderer.invoke('db-get-categories');
    const local = localStorage.getItem('gastro_categories');
    return local ? JSON.parse(local) : [];
  },

  async saveCategory(category: Category): Promise<void> {
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
    if (isElectron) {
      await window.ipcRenderer.invoke('db-delete-category', id);
    } else {
      const categories = await this.getCategories();
      localStorage.setItem('gastro_categories', JSON.stringify(categories.filter(c => c.id !== id)));
    }
  },

  async getLicenseStatus(): Promise<{ status: 'active' | 'expired' | 'none'; daysLeft: number; expiryDate?: string }> {
    if (isElectron) return await window.ipcRenderer.invoke('db-get-license');
    return { status: 'none', daysLeft: 0 };
  },

  async activateLicense(key: string): Promise<{ success: boolean; error?: string }> {
    if (isElectron) return await window.ipcRenderer.invoke('db-activate-license', { key });
    return { success: false, error: 'IPC no disponible' };
  },

  async resetDatabase(mode: 'full' | 'partial'): Promise<{ success: boolean; error?: string }> {
    if (isElectron) return await window.ipcRenderer.invoke('db-reset', { mode });
    return { success: false, error: 'IPC no disponible' };
  },

  async updateProductStock(id: string, quantity: number): Promise<void> {
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
