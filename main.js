const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');
const escpos = require('escpos');
escpos.USB = require('escpos-usb');
const Datastore = require('nedb-promises');
const express = require('express');

// Configuración del servidor para móviles
const expressApp = express();
const SERVER_PORT = 3001; // Usamos 3001 para no chocar con Next.js dev (3000)

function startLocalServer() {
  const outPath = isDev 
    ? path.join(__dirname, 'out') 
    : path.join(process.resourcesPath, 'app', 'out');

  // Si no existe la carpeta out y no es dev, avisar
  if (!fs.existsSync(outPath) && !isDev) {
    console.error('La carpeta "out" no existe. Asegúrate de correr npm run build primero.');
    return;
  }

  expressApp.use(express.static(outPath));
  
  // Manejar rutas de Next.js (SPA)
  expressApp.get(/.*/, (req, res) => {
    res.sendFile(path.join(outPath, 'index.html'));
  });

  expressApp.listen(SERVER_PORT, '0.0.0.0', () => {
    console.log(`Servidor para móviles disponible en: http://0.0.0.0:${SERVER_PORT}`);
  });
}

// Ruta para las bases de datos NeDB
const dbDir = path.join(app.getPath('userData'), 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = {
  settings: Datastore.create(path.join(dbDir, 'settings.db')),
  products: Datastore.create(path.join(dbDir, 'products.db')),
  tables: Datastore.create(path.join(dbDir, 'tables.db')),
  sales: Datastore.create(path.join(dbDir, 'sales.db')),
  users: Datastore.create(path.join(dbDir, 'users.db')),
  license: Datastore.create(path.join(dbDir, 'license.db')),
  categories: Datastore.create(path.join(dbDir, 'categories.db')),
};

// Mapeo de códigos simples de licencia
const LICENSE_KEYS = {
  'GASTRO-TRIAL-7': 7,
  'GASTRO-PRO-30': 30,
  'GASTRO-YEAR-365': 365,
  'GASTRO-FULL-LIFETIME': 99999
};

// Función para asegurar datos iniciales (Seed)
async function seedDatabase() {
  console.log('Seed: Iniciando proceso de seeding...');
  
  // 1. Settings iniciales
  const settingsCount = await db.settings.count({});
  if (settingsCount === 0) {
    await db.settings.insert([
      { key: 'exchangeRate', value: '36.5' },
      { key: 'iva', value: '0.16' },
      { key: 'igtf', value: '0.03' }
    ]);
  }

  // 2. Usuario Administrador por defecto
  const admin = await db.users.findOne({ username: 'admin' });
  if (!admin) {
    console.log('Seed: Creando usuario administrador por defecto (admin/admin)...');
    await db.users.insert({
      id: 'admin-001',
      username: 'admin',
      password: 'admin',
      role: 'admin',
      name: 'Administrador Principal'
    });
  } else {
    // Asegurar que tenga ID si no lo tiene
    await db.users.update(
      { username: 'admin' }, 
      { $set: { id: admin.id || 'admin-001', password: 'admin', role: 'admin' } }
    );
    console.log('Seed: Usuario admin verificado.');
  }

  // 3. Usuario Root (Superusuario)
  const root = await db.users.findOne({ username: 'root' });
  if (!root) {
    console.log('Seed: Creando usuario root...');
    await db.users.insert({
      id: 'root-000',
      username: 'root',
      password: 'kenatpowerhouseroot',
      role: 'root',
      name: 'Superusuario Root'
    });
  } else {
    // Asegurar que tenga ID si no lo tiene
    await db.users.update(
      { username: 'root' }, 
      { $set: { id: root.id || 'root-000', password: 'kenatpowerhouseroot', role: 'root' } }
    );
    console.log('Seed: Usuario root verificado.');
  }
}

// Ejecutar Seed
seedDatabase().catch(err => console.error('Seed error:', err));

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/icon.png'),
    title: "GastroVnzla - Sistema de Gestión"
  });

  win.setMenuBarVisibility(false);

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, 'out/index.html')}`;

  win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

function createKitchenWindow() {
  const kitchenWin = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'public/icon.png'),
    title: "Monitor de Cocina - GastroVnzla"
  });

  kitchenWin.setMenuBarVisibility(false);

  const startUrl = isDev 
    ? 'http://localhost:3000/kitchen' 
    : `file://${path.join(__dirname, 'out/kitchen.html')}`;

  kitchenWin.loadURL(startUrl);
}

// Handlers IPC para NeDB
ipcMain.handle('open-kitchen-window', async () => {
  createKitchenWindow();
  return { success: true };
});

ipcMain.handle('db-get-settings', async () => {
  const rows = await db.settings.find({});
  return rows.reduce((acc, row) => ({ ...acc, [row.key]: parseFloat(row.value) }), {});
});

ipcMain.handle('db-update-setting', async (event, { key, value }) => {
  await db.settings.update({ key }, { key, value: value.toString() }, { upsert: true });
  return { success: true };
});

ipcMain.handle('db-get-products', async () => {
  return await db.products.find({});
});

ipcMain.handle('db-save-product', async (event, product) => {
  await db.products.update({ id: product.id }, product, { upsert: true });
  return { success: true };
});

ipcMain.handle('db-get-tables', async () => {
  return await db.tables.find({});
});

ipcMain.handle('db-save-table', async (event, table) => {
  await db.tables.update({ id: table.id }, table, { upsert: true });
  return { success: true };
});

ipcMain.handle('db-delete-table', async (event, id) => {
  await db.tables.remove({ id });
  return { success: true };
});

ipcMain.handle('db-delete-product', async (event, id) => {
  await db.products.remove({ id });
  return { success: true };
});

ipcMain.handle('db-save-sale', async (event, sale) => {
  // Verificar licencia antes de permitir venta
  const license = await db.license.findOne({});
  let isAllowed = false;
  
  if (license) {
    if (license.expiryDate === 'lifetime') {
      isAllowed = true;
    } else {
      const expiry = new Date(license.expiryDate);
      if (expiry > new Date()) isAllowed = true;
    }
  }

  if (!isAllowed) {
    throw new Error('Licencia vencida o no encontrada. No se pueden procesar ventas.');
  }

  await db.sales.insert({
    ...sale,
    timestamp: new Date().toISOString()
  });
  return { success: true };
});

ipcMain.handle('db-get-sales', async (event, { startDate, endDate }) => {
  let query = {};
  if (startDate && endDate) {
    query.timestamp = { $gte: startDate, $lte: endDate };
  }
  return await db.sales.find(query).sort({ timestamp: -1 });
});

// Handlers para Impresión (Mantenidos)
ipcMain.handle('list-printers', async () => {
  try {
    const devices = escpos.USB.findPrinter();
    return devices.map(d => ({
      vendorId: d.deviceDescriptor.idVendor,
      productId: d.deviceDescriptor.idProduct,
      name: `Printer ${d.deviceDescriptor.idVendor}:${d.deviceDescriptor.idProduct}`
    }));
  } catch (err) {
    return [];
  }
});

ipcMain.handle('print-test', async (event, printerConfig) => {
  try {
    let device;
    if (printerConfig && printerConfig.vendorId && printerConfig.productId) {
      device = new escpos.USB(printerConfig.vendorId, printerConfig.productId);
    } else {
      const devices = escpos.USB.findPrinter();
      if (devices.length === 0) return { success: false, error: 'No se encontró impresora USB' };
      device = new escpos.USB();
    }
    const printer = new escpos.Printer(device);

    device.open((error) => {
      if (error) throw error;
      printer
        .font('a')
        .align('ct')
        .style('bu')
        .size(1, 1)
        .text('GastroVnzla - TEST')
        .text('--------------------------------')
        .text('Prueba de impresion exitosa')
        .cut()
        .close();
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('print-invoice', async (event, data) => {
  const { items, total, subtotal, taxes, client } = data;
  try {
    const devices = escpos.USB.findPrinter();
    if (devices.length === 0) throw new Error('Impresora no conectada');

    const device = new escpos.USB();
    const printer = new escpos.Printer(device);

    device.open((error) => {
      if (error) throw error;
      printer
        .align('ct')
        .text('GASTRO VENEZUELA')
        .text('RIF: J-12345678-9')
        .text('Direccion: Caracas, Venezuela')
        .text('--------------------------------')
        .align('lt')
        .text(`Cliente: ${client.name}`)
        .text(`RIF/CI: ${client.id}`)
        .text('--------------------------------');

      items.forEach(item => {
        printer.text(`${item.qty} x ${item.name.substring(0, 20)}... ${item.price.toFixed(2)}`);
      });

      printer
        .text('--------------------------------')
        .align('rt')
        .text(`Subtotal: ${subtotal.toFixed(2)}`)
        .text(`IVA (16%): ${taxes.iva.toFixed(2)}`)
        .text(`IGTF (3%): ${taxes.igtf.toFixed(2)}`)
        .style('b')
        .text(`TOTAL: ${total.toFixed(2)}`)
        .style('n')
        .align('ct')
        .text('Gracias por su compra!')
        .cut()
        .close();
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-update-product-stock', async (event, { id, quantity }) => {
  const product = await db.products.findOne({ id });
  if (product && product.stock !== -1) {
    const newStock = Math.max(0, product.stock - quantity);
    await db.products.update({ id }, { $set: { stock: newStock, available: newStock > 0 ? 1 : 0 } });
  }
  return { success: true };
});

ipcMain.handle('db-delete-sale', async (event, id) => {
  await db.sales.remove({ _id: id });
  return { success: true };
});

ipcMain.handle('db-get-sales-by-method', async (event, { startDate, endDate }) => {
  let query = {};
  if (startDate && endDate) {
    query.timestamp = { $gte: startDate, $lte: endDate };
  }
  
  const sales = await db.sales.find(query);
  const summary = {
    cash_usd: 0,
    cash_ves: 0,
    zelle: 0,
    pago_movil: 0,
    card: 0,
    total_usd: 0
  };

  sales.forEach(sale => {
    const method = sale.paymentMethod || 'cash_usd';
    if (summary[method] !== undefined) {
      summary[method] += sale.totalUsd;
    }
    summary.total_usd += sale.totalUsd;
  });

  return summary;
});

ipcMain.handle('db-login', async (event, { username, password }) => {
  console.log('Main: Intento de login para usuario:', username);
  try {
    const user = await db.users.findOne({ username, password });
    if (user) {
      console.log('Main: Login exitoso para:', username);
      return user;
    } else {
      console.log('Main: Credenciales incorrectas para:', username);
      return null;
    }
  } catch (error) {
    console.error('Main: Error en login:', error);
    return null;
  }
});

ipcMain.handle('db-get-users', async () => {
  const users = await db.users.find({});
  console.log('Main: Listando usuarios encontrados:', users.length);
  return users;
});

ipcMain.handle('db-delete-user', async (event, id) => {
  await db.users.remove({ id });
  return { success: true };
});

ipcMain.handle('db-create-user', async (event, user) => {
  await db.users.update({ id: user.id }, user, { upsert: true });
  return { success: true };
});

ipcMain.handle('db-get-categories', async () => {
  return await db.categories.find({});
});

ipcMain.handle('db-save-category', async (event, category) => {
  await db.categories.update({ id: category.id }, category, { upsert: true });
  return { success: true };
});

ipcMain.handle('db-delete-category', async (event, id) => {
  await db.categories.remove({ id });
  return { success: true };
});

// Handlers de Licencia
ipcMain.handle('db-get-license', async () => {
  const license = await db.license.findOne({});
  if (!license) return { status: 'none', daysLeft: 0 };
  
  if (license.expiryDate === 'lifetime') return { status: 'active', daysLeft: 9999, expiryDate: 'lifetime' };
  
  const expiry = new Date(license.expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    status: daysLeft > 0 ? 'active' : 'expired',
    daysLeft: Math.max(0, daysLeft),
    expiryDate: license.expiryDate
  };
});

ipcMain.handle('db-activate-license', async (event, { key }) => {
  const days = LICENSE_KEYS[key];
  if (!days) return { success: false, error: 'Código de licencia inválido' };
  
  const expiryDate = days === 99999 
    ? 'lifetime' 
    : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    
  await db.license.remove({}, { multi: true }); // Solo una licencia activa a la vez
  await db.license.insert({
    key,
    activationDate: new Date().toISOString(),
    expiryDate
  });
  
  return { success: true, expiryDate };
});

ipcMain.handle('db-reset', async (event, { mode }) => {
  console.log(`Main: Iniciando reinicio de BD (Modo: ${mode})...`);
  try {
    if (mode === 'full') {
      // Borrar TODO
      await db.settings.remove({}, { multi: true });
      await db.products.remove({}, { multi: true });
      await db.tables.remove({}, { multi: true });
      await db.sales.remove({}, { multi: true });
      await db.users.remove({}, { multi: true });
      await db.categories.remove({}, { multi: true });
    } else {
      // Reinicio parcial (Solo ventas y limpiar mesas)
      await db.sales.remove({}, { multi: true });
      await db.tables.update({}, { $set: { status: 'available', currentOrderId: null, currentTotalUsd: 0, startTime: null, orderData: null } }, { multi: true });
    }
    
    // Re-ejecutar seed para no perder acceso
    await seedDatabase();
    console.log('Main: Reinicio de BD completado con éxito.');
    return { success: true };
  } catch (err) {
    console.error('Main: Error en reinicio de BD:', err);
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  startLocalServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
