# Yebaam Frontend

Frontend de Yebaam construido con React, TypeScript y Vite.

## Requisitos

- Node.js `20.19+` o `22.12+`
- npm
- Un backend de Yebaam desplegado y accesible por HTTPS

## Variables de entorno

El frontend usa una variable:

```bash
VITE_API_URL=https://tu-backend-en-produccion.com/api
```

En local puedes usar:

```bash
VITE_API_URL=http://localhost:3000/api
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

## Subir a Vercel

1. Sube el repositorio a GitHub.
2. En Vercel, crea un proyecto nuevo desde ese repo.
3. Selecciona `proyectoc/frontend` como `Root Directory`.
4. Verifica:
   - `Build Command`: `npm run build`
   - `Output Directory`: `dist`
5. Agrega la variable de entorno `VITE_API_URL` apuntando al backend real.
6. Despliega.

## Configuración SPA

Este proyecto usa `BrowserRouter`, así que Vercel necesita reenviar todas las rutas a `index.html`.

El archivo `vercel.json` ya incluye:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Nota importante

El frontend por sí solo no funciona completo sin el backend de Yebaam desplegado.
Antes de publicar el frontend, asegúrate de tener el backend en producción y de copiar su URL en `VITE_API_URL`.
