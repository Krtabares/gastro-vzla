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

## 🚀 Desarrollo e Instalación

1.  Instalar dependencias: `npm install`
2.  Ejecutar en modo desarrollo: `npm run electron:dev`
3.  Construir para producción: `npm run electron:build`

---
*Desarrollado para GastroVnzla © 2026*
