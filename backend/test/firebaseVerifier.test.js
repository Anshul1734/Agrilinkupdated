import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from 'jose';
import { createFirebaseVerifier } from '../lib/firebaseVerifier.js';

const PROJECT = 'agrilink-test';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const other = await generateKeyPair('RS256');
const jwk = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
const verify = createFirebaseVerifier(PROJECT, createLocalJWKSet({ keys: [jwk] }));

const sign = ({ key = privateKey, iss = `https://securetoken.google.com/${PROJECT}`, aud = PROJECT, sub = 'uid-1', exp = '1h' } = {}) =>
  new SignJWT({ email: 'a@b.c' }).setProtectedHeader({ alg: 'RS256', kid: 'k1' }).setIssuer(iss).setAudience(aud).setSubject(sub).setIssuedAt().setExpirationTime(exp).sign(key);

test('accepts a valid token', async () => {
  assert.deepEqual(await verify(await sign()), { uid: 'uid-1', email: 'a@b.c' });
});
test('rejects wrong audience, issuer, signature, expiry, missing subject, and unsigned tokens', async () => {
  await assert.rejects(verify(await sign({ aud: 'someone-else' })));
  await assert.rejects(verify(await sign({ iss: 'https://securetoken.google.com/other' })));
  await assert.rejects(verify(await sign({ key: other.privateKey })));
  await assert.rejects(verify(await sign({ exp: '-1m' })));
  await assert.rejects(verify(await sign({ sub: '' })));
  const unsigned = Buffer.from('{"alg":"none"}').toString('base64url') + '.' + Buffer.from(JSON.stringify({ sub: 'x', aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}` })).toString('base64url') + '.';
  await assert.rejects(verify(unsigned));
});
