const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function migrate() {
  const config = getEnvConfig();

  if (!config || !config.url || !config.key) {
    console.log("❌ No se encontraron credenciales válidas en .env.local");
    return;
  }

  console.log("--------------------------------------------------");
  console.log("⚙️  INSTRUCCIONES DE MIGRACIÓN PARA SUPABASE");
  console.log("--------------------------------------------------");
  console.log("Dado que la API de Supabase no permite modificar el");
  console.log("esquema directamente mediante JS por seguridad, debes");
  console.log("ejecutar el siguiente SQL en tu SQL Editor:");
  console.log("");
  console.log(`
-- AÑADIR COLUMNA TYPE A TABLAS EXISTENTES
ALTER TABLE IF EXISTS tables ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'table';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'table';
ALTER TABLE IF EXISTS sales ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'table';

-- COMENTARIO: 'table' | 'takeaway' | 'delivery'
  `);
  console.log("--------------------------------------------------");
}

migrate();
