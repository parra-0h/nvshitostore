# Nvshitostore — Catálogo web

Sitio para el catálogo de la tienda:

- **Página pública** (`/`): muestra los productos separados por categoría
  (Pantalones, Polerones, Poleras, Accesorios). Se actualiza sola cada vez
  que subes o marcas algo como agotado.
- **Panel admin** (`/admin`): pide contraseña. Ahí subes fotos nuevas
  (se ordenan solas según la categoría que elijas) y puedes marcar
  cualquier producto como "en stock" / "agotado", o eliminarlo.

Todo corre 100% en el plan gratuito de Cloudflare: **Pages** (hosting +
backend), **D1** (base de datos para los productos) y **R2** (donde se
guardan las fotos). No pagas nada mientras la tienda sea de este tamaño.

---

## 1. Qué necesitas antes de empezar

- Una cuenta de Cloudflare (gratis): https://dash.cloudflare.com/sign-up
- Una cuenta de GitHub (gratis) — Cloudflare Pages se conecta a un
  repositorio para desplegar. Si no quieres usar GitHub, más abajo
  está la alternativa por línea de comandos.

---

## 2. Sube este proyecto a GitHub

1. Crea un repositorio nuevo en GitHub (puede ser privado), por ejemplo
   `nvshitostore-catalog`.
2. Sube todos los archivos de esta carpeta a ese repositorio (puedes
   arrastrarlos desde la web de GitHub con "Add file → Upload files",
   o con git si sabes usarlo).

---

## 3. Crea la base de datos (D1)

1. En el dashboard de Cloudflare, ve a **Workers & Pages → D1**.
2. Clic en **Create database**. Nómbrala `nvshitostore-db`.
3. Entra a la base de datos creada → pestaña **Console**.
4. Pega el contenido del archivo `schema.sql` (está en esta carpeta) y
   ejecútalo. Eso crea la tabla `products`.

---

## 4. Crea el bucket de imágenes (R2)

1. En el dashboard, ve a **R2**.
2. Clic en **Create bucket**. Nómbralo `nvshitostore-images`.
3. Déjalo privado (no actives acceso público) — el sitio sirve las
   imágenes a través de su propio backend, así que no lo necesitas.

---

## 5. Crea el proyecto en Cloudflare Pages

1. Ve a **Workers & Pages → Create → Pages → Connect to Git**.
2. Elige el repositorio que subiste.
3. En **Build settings**:
   - Framework preset: `None`
   - Build command: (déjalo vacío)
   - Build output directory: `/`
4. Clic en **Save and Deploy**. La primera vez el sitio se verá pero
   sin productos y sin login funcionando — falta conectar D1, R2 y las
   contraseñas (siguiente paso).

---

## 6. Conecta D1 y R2 al proyecto, y define la contraseña

Dentro del proyecto de Pages recién creado:

1. Ve a **Settings → Functions**.
2. En **D1 database bindings** → Add binding:
   - Variable name: `DB`
   - D1 database: `nvshitostore-db`
3. En **R2 bucket bindings** → Add binding:
   - Variable name: `CATALOG_IMAGES`
   - R2 bucket: `nvshitostore-images`
4. Ve a **Settings → Environment variables** → Add variable (marca
   **Encrypt** para que quede como secreto):
   - `ADMIN_PASSWORD` = la contraseña que vas a usar para entrar a `/admin`
   - `SESSION_SECRET` = cualquier texto largo y random (ej: genera uno
     en https://www.random.org/strings/ o simplemente escribe algo
     largo tipo `x7Kp2m9QzL4rT8vN1wB6yE3sF0hJ5cA`)
5. Haz un **re-deploy** (Deployments → los tres puntos del último
   deployment → Retry deployment) para que tome los bindings y las
   variables — los bindings solo aplican a partir del siguiente deploy.

Listo. Tu sitio va a estar en algo como
`https://nvshitostore-catalog.pages.dev`. El panel admin queda en
`https://nvshitostore-catalog.pages.dev/admin`.

Más adelante puedes conectarle un dominio propio en **Custom domains**
dentro del mismo proyecto.

---

## 7. Cómo lo usas en el día a día

1. Sacas la foto al producto.
2. Entras a `tusitio.pages.dev/admin`, pones la contraseña.
3. Subes la foto, escribes el nombre, eliges la categoría (pantalones /
   polerones / poleras / accesorios), precio si quieres, y si está
   disponible o no.
4. Clic en **Publicar producto** — aparece al tiro en el catálogo
   público, en la categoría que corresponde.
5. Cuando se vende algo, entras al panel y apagas el switch de
   "stock" — no hace falta borrarlo, queda marcado como "Agotado" en
   el catálogo. Si quieres sacarlo del todo, usa **Eliminar**.

---

## Alternativa: desplegar con línea de comandos (wrangler)

Si prefieres no usar GitHub, puedes desplegar directo desde tu
computador con la CLI de Cloudflare:

```bash
npm install -g wrangler
wrangler login

# Base de datos
wrangler d1 create nvshitostore-db
# copia el database_id que te muestra y pégalo en wrangler.toml

wrangler d1 execute nvshitostore-db --remote --file=schema.sql

# Bucket de imágenes
wrangler r2 bucket create nvshitostore-images

# Crear el proyecto de Pages
wrangler pages project create nvshitostore-catalog

# Contraseñas (te las va a pedir escritas, quedan encriptadas)
wrangler pages secret put ADMIN_PASSWORD --project-name=nvshitostore-catalog
wrangler pages secret put SESSION_SECRET --project-name=nvshitostore-catalog

# Deploy
wrangler pages deploy . --project-name=nvshitostore-catalog
```

Con este método los bindings de D1 y R2 ya quedan tomados desde
`wrangler.toml`, no hace falta configurarlos a mano en el dashboard.

---

## Notas

- Las fotos se recomiendan livianas (menos de 3-4 MB) para que el
  catálogo cargue rápido — cualquier foto de celular normal sirve.
- La contraseña de admin es única (no hay usuarios separados). Si
  varias personas van a subir productos, todas usan la misma clave.
- Todo el diseño (colores, tipografía, el sello "Agotado") está en
  `css/style.css` por si más adelante quieres ajustar algo.
