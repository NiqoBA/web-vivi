# Alfa — Web

Landing de crochet hecho a mano (Next.js + Supabase).

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# Completar variables en .env.local
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Deploy en Vercel

1. Subir el repositorio a GitHub.
2. En [vercel.com](https://vercel.com), importar el proyecto.
3. Framework: **Next.js** (detectado automáticamente).
4. Añadir las variables de entorno (mismas que en `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_ADMIN_USER_ID`
5. Deploy.

Los estilos originales están en `app/globals.css` (sin Tailwind). Imágenes estáticas en `public/assets` y `public/uploads`.

## Archivo legacy

`Alpha.html` y la carpeta `js/` conservan la versión estática anterior por referencia. La app en producción es la ruta `/`.
