// Firma y verifica cookies de sesión con HMAC-SHA256, sin dependencias externas.
// El "token" tiene la forma  <timestamp_expiracion>.<firma>

async function hmac(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
}

export async function createSessionToken(env) {
  const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
  const exp = Date.now() + sevenDaysMs;
  const payload = String(exp);
  const sig = await hmac(payload, env.SESSION_SECRET);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token, env) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;

  const expectedSig = await hmac(payload, env.SESSION_SECRET);
  if (expectedSig !== sig) return false;

  const exp = parseInt(payload, 10);
  if (Number.isNaN(exp) || Date.now() > exp) return false;

  return true;
}

export function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function requireAuth(request, env) {
  const token = getCookie(request, 'session');
  return verifySessionToken(token, env);
}

export function sessionCookieHeader(token) {
  return `session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`;
}

export function clearedCookieHeader() {
  return 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}
