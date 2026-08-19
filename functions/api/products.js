import { requireAuth } from '../_utils/auth.js';

const VALID_CATEGORIES = ['pantalones', 'polerones', 'poleras', 'accesorios'];

// GET /api/products?category=pantalones  -> público, cualquiera puede ver el catálogo
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const category = url.searchParams.get('category');

  let stmt;
  if (category && VALID_CATEGORIES.includes(category)) {
    stmt = env.DB.prepare(
      'SELECT id, name, category, price, description, image_key, in_stock, created_at FROM products WHERE category = ?1 ORDER BY created_at DESC'
    ).bind(category);
  } else {
    stmt = env.DB.prepare(
      'SELECT id, name, category, price, description, image_key, in_stock, created_at FROM products ORDER BY created_at DESC'
    );
  }

  const { results } = await stmt.all();

  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// POST /api/products  -> solo admin, multipart/form-data con la imagen
export async function onRequestPost({ request, env }) {
  const authed = await requireAuth(request, env);
  if (!authed) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return new Response(JSON.stringify({ error: 'Formulario inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const name = (form.get('name') || '').toString().trim();
  const category = (form.get('category') || '').toString().trim();
  const price = (form.get('price') || '').toString().trim();
  const description = (form.get('description') || '').toString().trim();
  const inStock = form.get('in_stock') === 'true' ? 1 : 0;
  const file = form.get('image');

  if (!name || !VALID_CATEGORIES.includes(category) || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'Falta la foto, el nombre o la categoría es inválida.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!file.type || !file.type.startsWith('image/')) {
    return new Response(JSON.stringify({ error: 'El archivo debe ser una imagen.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const id = crypto.randomUUID();
  const extMatch = /\.([a-zA-Z0-9]+)$/.exec(file.name || '');
  const ext = (extMatch ? extMatch[1] : 'jpg').toLowerCase();
  const imageKey = `products/${id}.${ext}`;

  await env.CATALOG_IMAGES.put(imageKey, file.stream(), {
    httpMetadata: { contentType: file.type }
  });

  await env.DB.prepare(
    `INSERT INTO products (id, name, category, price, description, image_key, in_stock, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`
  )
    .bind(id, name, category, price, description, imageKey, inStock, Date.now())
    .run();

  return new Response(JSON.stringify({ ok: true, id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}
