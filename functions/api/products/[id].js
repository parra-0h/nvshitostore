import { requireAuth } from '../../_utils/auth.js';

const VALID_CATEGORIES = ['pantalones', 'polerones', 'poleras', 'accesorios'];

// PATCH /api/products/:id  -> solo admin. Actualiza cualquier combinación de campos.
export async function onRequestPatch({ request, env, params }) {
  const authed = await requireAuth(request, env);
  if (!authed) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const fields = [];
  const values = [];

  if (typeof body.in_stock === 'boolean') {
    fields.push('in_stock = ?');
    values.push(body.in_stock ? 1 : 0);
  }
  if (typeof body.name === 'string' && body.name.trim()) {
    fields.push('name = ?');
    values.push(body.name.trim());
  }
  if (typeof body.price === 'string') {
    fields.push('price = ?');
    values.push(body.price.trim());
  }
  if (typeof body.description === 'string') {
    fields.push('description = ?');
    values.push(body.description.trim());
  }
  if (typeof body.category === 'string' && VALID_CATEGORIES.includes(body.category)) {
    fields.push('category = ?');
    values.push(body.category);
  }

  if (fields.length === 0) {
    return new Response(JSON.stringify({ error: 'No hay nada para actualizar.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  values.push(params.id);

  await env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// DELETE /api/products/:id  -> solo admin. Borra el registro y la imagen en R2.
export async function onRequestDelete({ request, env, params }) {
  const authed = await requireAuth(request, env);
  if (!authed) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const row = await env.DB.prepare('SELECT image_key FROM products WHERE id = ?')
    .bind(params.id)
    .first();

  if (row && row.image_key) {
    await env.CATALOG_IMAGES.delete(row.image_key).catch(() => {});
  }

  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(params.id).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
