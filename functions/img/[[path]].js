// Sirve archivos guardados en el bucket R2 "CATALOG_IMAGES" bajo /img/<key>
// Ej: /img/products/9f2c-....jpg  ->  objeto "products/9f2c-....jpg" en R2

export async function onRequestGet({ env, params }) {
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;

  if (!key) {
    return new Response('No encontrado', { status: 404 });
  }

  const object = await env.CATALOG_IMAGES.get(key);
  if (!object) {
    return new Response('No encontrado', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
