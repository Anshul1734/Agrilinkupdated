import { createRemoteJWKSet, jwtVerify, errors } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

/**
 * Verifies a Firebase ID token the way the Firebase docs describe (RS256 signature against
 * Google's public keys, issuer, audience, expiry). Needs only the project id - no secrets.
 * `jwks` is injectable so tests can sign their own tokens.
 */
export function createFirebaseVerifier(projectId, jwks = GOOGLE_JWKS) {
  return async function verify(token) {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    if (!payload.sub) throw new errors.JWTClaimValidationFailed('token has no subject', payload, 'sub', 'missing');
    return { uid: payload.sub, email: payload.email };
  };
}
