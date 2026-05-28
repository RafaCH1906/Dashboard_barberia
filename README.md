# Barbería Panel - Dashboard Administrativo ✂️💈

Dashboard web administrativo móvil y responsivo diseñado para gestionar las citas de la barbería en tiempo real. Este panel trabaja en conjunto con el **Barbería Bot de WhatsApp** y se conecta a la misma base de datos de Supabase.

---

## Características Principales 🌟

* **Estética Premium Oscura:** Diseño estilizado con temática "barbershop" (colores oscuros, dorados y grises) adaptado para dispositivos móviles (mobile-first).
* **Gestión de Citas del Día:** Pestañas interactivas para visualizar las citas de **"Hoy"** y **"Mañana"**.
* **Métricas Clave (KPIs):**
  * Número de citas pendientes.
  * Número de citas completadas.
  * Ingresos ganados (citas completadas).
  * Ingresos por cobrar (citas pendientes).
* **Actualización Rápida de Estados:** Permite marcar citas como **"Completada"** o **"No asistió"** con transiciones visuales agradables y actualizaciones optimistas instantáneas.
* **Polling en Segundo Plano:** Actualiza los datos de forma silenciosa cada 10 segundos para mantener la información al día.
* **Seguridad y Paridad API:** Las peticiones a la base de datos se hacen a través de **API Routes de Next.js** (Route Handlers en el servidor), lo que evita exponer claves en el navegador y soluciona bloqueos de CORS o políticas de seguridad (RLS).
* **Control de Zona Horaria:** Sincronizado bajo la zona horaria de Perú/Lima (`UTC-5`) para evitar desplazamientos de fecha.

---

## Tecnologías Utilizadas 🛠️

* **Framework:** Next.js 14 (App Router) con TypeScript.
* **Estilos:** Tailwind CSS y variables de diseño personalizadas.
* **Base de Datos:** Supabase (PostgreSQL).
* **Despliegue:** Optimizado para Netlify o Vercel.

---

## Configuración y Ejecución Local 🚀

### 1. Requisitos Previos
* Node.js v18 o superior instalado.

### 2. Clonación e Instalación
```bash
# Entrar a la carpeta
cd barberia-panel

# Instalar dependencias
npm install
```

### 3. Variables de Entorno (`.env.local`)
Crea un archivo `.env.local` en la raíz del proyecto y define las siguientes variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zkfaahoxyawrvzvszvfh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_secret_service_role_key
NEXT_PUBLIC_BARBER_SHOP_ID=a1b2c3d4-0000-0000-0000-000000000001
```
*(Nota: Usamos la clave de servicio en el servidor Next.js para poder leer y actualizar las citas sin requerir configuraciones adicionales de políticas RLS en Supabase).*

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el panel.

---

## Despliegue en Netlify ☁️

Para desplegar tu panel en Netlify con soporte completo para las API Routes (funciones serverless):

### Método Recomendado (Por GitHub)
1. Sube tu código a un repositorio de GitHub (público o privado).
2. Entra a tu consola de Netlify, haz clic en **Add new site** y conecta tu repositorio.
3. En la configuración de construcción, Netlify detectará automáticamente que es un proyecto de Next.js.
4. **¡Importante!** Ve a la pestaña **Environment variables** en Netlify y agrega:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `NEXT_PUBLIC_BARBER_SHOP_ID`
5. Haz clic en **Deploy site**.

### Método por Consola (Netlify CLI)
1. Instala el CLI de forma global: `npm install -g netlify-cli`.
2. Inicia sesión: `netlify login`.
3. Compila el proyecto localmente: `npm run build`.
4. Inicializa y vincula el sitio: `netlify init`.
5. Despliega a producción: `netlify deploy --prod`.

## Mensajería Automática 📩

- **API Route**: `app/api/send-message/route.ts` permite encolar mensajes WhatsApp en la tabla `message_queue` de Supabase.
- **Utilidad Compartida**: `src/lib/message.ts` exporta `queueMessage(phone, message, barberShopId?)` que se usa en `src/app/clientes/page.tsx` para:
  - Enviar saludo al crear un cliente.
  - Notificar visita inicial y puntos de fidelidad.
  - Avisar cuando se alcanza o reinicia la meta de puntos.
- **Variables de entorno**: `NEXT_PUBLIC_BARBER_SHOP_ID` se lee automáticamente; si no está definida, la función usará una cadena vacía.
- **Feedback UI**: Se muestra toast de éxito/error mediante `react-hot-toast`.

Esta integración permite que el panel desencadene mensajes sin exponer credenciales y que el bot los procese en segundo plano.
