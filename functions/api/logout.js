import { clearedCookieHeader } from '../_utils/auth.js';

export async function onRequestPost() {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', clearedCookieHeader());
  return new Response(JSON.stringify({ ok: true }), { headers });
}
