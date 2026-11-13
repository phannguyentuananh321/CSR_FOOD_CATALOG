import http from 'node:http';
import { createApp } from '../src/app.js';
import jwt from 'jsonwebtoken';

const app = createApp();
const server = http.createServer(app);

await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;
const BASE_URL = `http://localhost:${port}`;

console.log(`[TEST] Test server listening on ${BASE_URL}`);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${message}`);
    failed++;
  }
}

try {
  // 1. Login with invalid password
  console.log('\n--- 1. Login with invalid password ---');
  const resBad = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@amvi.local', password: 'WrongPassword@123' }),
  });
  const dataBad = await resBad.json();
  assert(resBad.status === 401, 'Returns 401 on incorrect password');
  assert(dataBad.code === 'INVALID_CREDENTIALS', 'Returns INVALID_CREDENTIALS code');

  // 2. Login with valid admin credentials
  console.log('\n--- 2. Login with valid admin credentials ---');
  const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@amvi.local', password: 'Admin@123456' }),
  });
  const dataLogin = await resLogin.json();
  assert(resLogin.status === 200, 'Returns 200 on successful login');
  assert(Boolean(dataLogin.accessToken), 'Returns accessToken in JSON body');
  assert(Boolean(dataLogin.refreshToken), 'Returns refreshToken in JSON body (Dual Delivery Method B)');
  assert(dataLogin.user.role === 'admin', 'User has admin role');

  const cookies = resLogin.headers.get('set-cookie') || '';
  assert(cookies.includes('refresh_token='), 'Sets httpOnly refresh_token cookie');
  assert(cookies.toLowerCase().includes('httponly'), 'Cookie has HttpOnly flag');

  // 3. Inspect Access Token claims & 1-minute expiration
  console.log('\n--- 3. Inspect Access Token claims (TTL 1 minute) ---');
  const decoded = jwt.decode(dataLogin.accessToken);
  assert(decoded.iss === 'am-vi-api', 'Issuer claim iss is am-vi-api');
  assert(decoded.aud === 'am-vi-client', 'Audience claim aud is am-vi-client');
  assert(decoded.role === 'admin', 'Role claim is admin');
  assert(decoded.sub !== undefined, 'Subject claim sub is user ID');
  const ttlSeconds = decoded.exp - decoded.iat;
  assert(ttlSeconds === 60, `TTL is exactly 60 seconds (1 minute): actual ${ttlSeconds}s`);

  // 4. Access protected endpoint /api/auth/me
  console.log('\n--- 4. Protected endpoint /api/auth/me ---');
  const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${dataLogin.accessToken}` },
  });
  const dataMe = await resMe.json();
  assert(resMe.status === 200, 'Returns 200 with valid Bearer token');
  assert(dataMe.user.email === 'admin@amvi.local', 'Returns authenticated user info');

  // Unauthenticated access
  const resMeNoAuth = await fetch(`${BASE_URL}/api/auth/me`);
  assert(resMeNoAuth.status === 401, 'Returns 401 when Authorization header is missing');

  // 5. Refresh Token Rotation
  console.log('\n--- 5. Refresh Token Rotation ---');
  const token1 = dataLogin.refreshToken;
  const resRefresh = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token1 }),
  });
  const dataRefresh = await resRefresh.json();
  assert(resRefresh.status === 200, 'Returns 200 on valid refresh rotation');
  assert(Boolean(dataRefresh.accessToken), 'Returns new access token');
  assert(Boolean(dataRefresh.refreshToken), 'Returns new rotated refresh token');
  assert(dataRefresh.refreshToken !== token1, 'Rotated refresh token is different from old one');

  const token2 = dataRefresh.refreshToken;

  // 6. Token Reuse Detection
  console.log('\n--- 6. Token Reuse Detection (Security Alert & Family Revocation) ---');
  // Attacker tries to use token1 which was already rotated (used)
  const resReuse = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token1 }),
  });
  const dataReuse = await resReuse.json();
  assert(resReuse.status === 403, 'Returns 403 Forbidden on reuse of old token');
  assert(dataReuse.code === 'REFRESH_TOKEN_REUSED', 'Returns REFRESH_TOKEN_REUSED error code');

  // Verify that the newer token2 in that family was also invalidated
  const resToken2 = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token2 }),
  });
  assert(resToken2.status === 401, 'Token2 in the same family is now invalidated as family was revoked');

  // 7. Protected CUD Dishes route
  console.log('\n--- 7. Protected CUD route RBAC ---');
  const resDishNoAuth = await fetch(`${BASE_URL}/api/dishes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacker Dish', price: 1000 }),
  });
  assert(resDishNoAuth.status === 401, 'POST /api/dishes blocked (401) without authentication');

  // 8. Logout
  console.log('\n--- 8. Logout ---');
  const resLogin2 = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@amvi.local', password: 'Admin@123456' }),
  });
  const dataLogin2 = await resLogin2.json();
  const tokenToLogout = dataLogin2.refreshToken;

  const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokenToLogout }),
  });
  assert(resLogout.status === 200, 'Logout succeeds with 200');

  // Verify logged out token cannot refresh
  const resAfterLogout = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokenToLogout }),
  });
  assert(resAfterLogout.status === 401, 'Logged out refresh token rejected on refresh');

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
} catch (error) {
  console.error('Fatal test error:', error);
  process.exit(1);
} finally {
  server.close();
}
