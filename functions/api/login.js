import { createSessionToken, sessionCookieHeader } from '../_utils/auth.js';

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { password } = body;

  if (!env.ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ error: 'El servidor no tiene configurada ADMIN_PASSWORD.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!password || password !== env.ADMIN_PASSWORD) {
    return new Response(
      JSON.stringify({ error: 'Contraseña incorrecta.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = await createSessionToken(env);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', sessionCookieHeader(token));

  return new Response(JSON.stringify({ ok: true }), { headers });
}
