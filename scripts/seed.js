const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar configuración de Supabase desde el entorno o archivo local si existe
const getEnvConfig = () => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const config = {};
      content.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && (value !== undefined)) config[key.trim()] = value.trim();
      });
      return {
        url: config.NEXT_PUBLIC_SUPABASE_URL,
        key: config.NEXT_PUBLIC_SUPABASE_ANON_KEY
      };
    }
  } catch (e) {
    console.error("Error cargando .env.local", e);
  }
  return null;
};

async function seed() {
  const config = getEnvConfig();
  
  // Validar si el cliente está usando Supabase Cloud
  if (!config || !config.url || config.url.includes('tu_url')) {
    console.log("--------------------------------------------------");
    console.log("⚠️  MODO DETECTADO: LOCAL / SQLITE");
    console.log("El seeder no se ejecutará en Supabase Cloud porque");
    console.log("no se encontraron credenciales válidas en .env.local");
    console.log("--------------------------------------------------");
    return;
  }

  console.log("--------------------------------------------------");
  console.log("🚀 MODO DETECTADO: SUPABASE CLOUD");
  console.log(`Conectando a: ${config.url}`);
  console.log("--------------------------------------------------");

  const supabase = createClient(config.url, config.key);

  // 1. Validar y crear usuarios iniciales (Root y Admin)
  const usersToSeed = [
    { id: 'root-000', username: 'kenatpowerhouseroot', password: 'kenatpowerhouseroot', role: 'root', name: 'Root System' },
    { id: 'admin-001', username: 'admin', password: 'admin', role: 'admin', name: 'Administrador' }
  ];

  for (const user of usersToSeed) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', user.username)
      .maybeSingle();

    if (!existingUser) {
      console.log(`👤 Creando usuario: ${user.username}...`);
      const { error } = await supabase.from('users').insert(user);
      if (error) console.error(`❌ Error creando ${user.username}:`, error.message);
      else console.log(`✅ Usuario ${user.username} creado.`);
    } else {
      console.log(`ℹ️ Usuario ${user.username} ya existe, omitiendo.`);
    }
  }

  // 2. Categorías por defecto
  const categories = [
    { id: 'cat-001', name: 'Bebidas' },
    { id: 'cat-002', name: 'Entradas' },
    { id: 'cat-003', name: 'Platos Fuertes' }
  ];

  console.log("\n📁 Verificando categorías...");
  for (const cat of categories) {
    const { data: existingCat } = await supabase.from('categories').select('id').eq('name', cat.name).maybeSingle();
    if (!existingCat) {
      await supabase.from('categories').insert(cat);
      console.log(`✅ Categoría creada: ${cat.name}`);
    }
  }

  // 3. Mesas iniciales
  const tables = [
    { id: 'table-1', number: '1', status: 'available' },
    { id: 'table-2', number: '2', status: 'available' },
    { id: 'table-3', number: '3', status: 'available' }
  ];

  console.log("\n🪑 Verificando mesas...");
  for (const table of tables) {
    const { data: existingTable } = await supabase.from('tables').select('id').eq('number', table.number).maybeSingle();
    if (!existingTable) {
      await supabase.from('tables').insert(table);
      console.log(`✅ Mesa creada: ${table.number}`);
    }
  }

  console.log("\n✨ Proceso de Seeding finalizado con éxito.");
}

seed().catch(err => {
  console.error("\n❌ Error crítico en el seeder:");
  console.error(err);
});
