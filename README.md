# GastroVnzla - Sistema de Gestión de Restaurantes

Sistema integral de gestión para restaurantes, optimizado para el mercado venezolano con manejo multi-moneda (USD/VES), cálculo de impuestos (IVA/IGTF) e impresión térmica.

## 🔐 Credenciales de Acceso

El sistema cuenta con tres niveles de acceso predefinidos:

| Usuario | Contraseña | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| **root** | `kenatpowerhouseroot` | Superusuario | Acceso total, gestión de licencias y reinicio de BD. |
| **admin** | `admin` | Administrador | Gestión de menú, precios y reportes de ventas. |
| **cajero** | (Debe crearse) | Cajero | Operatividad de ventas y monitor de cocina. |

---

## 🎫 Sistema de Licenciamiento

El sistema requiere una licencia activa para procesar ventas. Los códigos pueden ser ingresados únicamente por el usuario **root** en la sección de Configuración Avanzada.

### Códigos Maestros de Activación:

*   **`GASTRO-TRIAL-7`**: Activa 7 días de prueba.
*   **`GASTRO-PRO-30`**: Activa 30 días de servicio.
*   **`GASTRO-YEAR-365`**: Activa 1 año de servicio.
*   **`GASTRO-FULL-LIFETIME`**: Activa licencia permanente (infinita).

> **Nota:** Cuando la licencia vence, el sistema entra en **Modo Lectura**. Se pueden consultar datos pero no se pueden finalizar nuevas ventas hasta activar un nuevo código.

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** Next.js 14, React, Tailwind CSS, Lucide Icons.
*   **Desktop:** Electron.
*   **Base de Datos:** NeDB (Pure JavaScript - No requiere compilación).
*   **Impresión:** ESC/POS (USB).

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

*   **Node.js:** Versión 18 o superior.
*   **Herramientas de Compilación (Windows):** Debido a que usamos módulos nativos (`usb`, `serialport`, `sqlite3`), se requieren las herramientas de C++.
    *   Se recomienda instalar "Desktop development with C++" desde Visual Studio Installer o ejecutar `npm install --global windows-build-tools` (en versiones antiguas de Node).

---

## 🚀 Desarrollo e Instalación

1.  Instalar dependencias: `npm install`
2.  Ejecutar en modo desarrollo: `npm run electron:dev`
3.  Construir para producción: `npm run electron:build`

---

## ☁️ Configuración de Base de Datos (Cloud vs Local)

El sistema soporta dos modos de funcionamiento que se pueden alternar desde la **Configuración Avanzada** (Usuario Root):

### 1. Modo Local (Predeterminado)
*   **Tecnología:** NeDB / SQLite local.
*   **Uso:** No requiere internet. Los datos se guardan en el dispositivo actual.

### 2. Modo Supabase Cloud
*   **Tecnología:** PostgreSQL remoto en la nube.
*   **Uso:** Sincronización entre múltiples dispositivos/sedes.

#### Pasos para instalación en la Nube:

1.  **Crear Proyecto:** Crea un proyecto en [Supabase](https://supabase.com).
2.  **Configurar Credenciales:** Crea un archivo `.env.local` en la raíz con tus llaves:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
    NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_llave_anonima_aqui
    ```
3.  **Preparar Base de Datos:** Ejecuta las migraciones para crear las tablas necesarias:
    ```bash
    npx supabase db push
    ```
4.  **Poblar Datos Iniciales:** Ejecuta el seeder para crear los usuarios `root` y `admin`:
    ```bash
    npm run seed
    ```
    *El seeder detectará automáticamente si estás en modo Cloud o Local y solo actuará si las credenciales son válidas.*

5.  **Activar en la App:** Inicia sesión como **root** en la aplicación, ve a **Configuración**, selecciona **Modo Cloud**, ingresa la URL y la Anon Key, y guarda los cambios.

---

## 📱 Configuración para Móviles (Camareros)

El sistema permite que el PC de escritorio (Caja) actúe como servidor central para que los camareros tomen pedidos desde sus celulares a través de la red Wi-Fi local.

### 1. Preparación en el PC de Caja
1.  **Obtener la IP del PC:** 
    *   Abre la terminal (CMD) y escribe `ipconfig`.
    *   Anota la dirección **IPv4** (ejemplo: `192.168.1.15`).
2.  **Configurar IP Estática:** Se recomienda fijar la IP del PC en los ajustes de red de Windows para evitar que cambie al reiniciar el router.
3.  **Configurar el Firewall:**
    *   Ve a *Panel de Control > Sistema y Seguridad > Firewall de Windows Defender > Configuración avanzada*.
    *   En *Reglas de entrada*, crea una **Nueva regla**:
        *   Tipo: **Puerto**.
        *   Protocolo: **TCP**.
        *   Puerto local específico: **3001**.
        *   Acción: **Permitir la conexión**.

### 2. Acceso desde los Celulares
1.  Conecta los celulares de los camareros a la misma red Wi-Fi que el PC de caja.
2.  Abre el navegador (Chrome/Safari) e ingresa la dirección:
    `http://[IP-DEL-PC]:3001` (ejemplo: `http://192.168.1.15:3001`).
3.  **Tip:** Selecciona "Añadir a pantalla de inicio" en el navegador del móvil para usar la app como si fuera nativa.

### 3. Sincronización
*   Tanto la Caja como los Celulares deben estar configurados en **Modo Supabase Cloud** con las mismas credenciales.
*   Los pedidos realizados desde el móvil aparecerán instantáneamente en la Caja y el Monitor de Cocina.

---

## 🛠️ Notas Técnicas y Solución de Problemas

### Error en Módulos Nativos (node-gyp)
Si al ejecutar `npm install` ves errores relacionados con `node-gyp` o `rebuild`:
1.  Borra `node_modules` y `package-lock.json`.
2.  Asegúrate de tener Python instalado.
3.  Ejecuta `npm install`.

### Configuración de Impresora Térmica
*   El sistema utiliza el protocolo **ESC/POS**.
*   En Windows, si hay conflictos, instala la impresora con el driver **"Generic / Text Only"**.
*   La impresora debe estar conectada antes de abrir la aplicación para su correcta detección.

---
*Desarrollado para GastroVnzla © 2026*
