import { requireAuth } from '../_utils/auth.js';

export async function onRequestGet({ request, env }) {
  const authenticated = await requireAuth(request, env);
  return new Response(JSON.stringify({ authenticated }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
