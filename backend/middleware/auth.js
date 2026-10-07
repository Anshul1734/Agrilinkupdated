import { ApiError, forbidden, unauthorized, dbError, wrap } from '../lib/errors.js';

// jose error codes meaning "this token is not acceptable". Anything else (e.g. Google's key endpoint timing out)
// is OUR problem, so the client gets a 503 and can retry instead of being logged out.
const BAD_TOKEN = /^(ERR_JWT_|ERR_JWS_|ERR_JWKS_NO_MATCHING_KEY|ERR_JWKS_MULTIPLE_MATCHING_KEYS|ERR_JOSE_ALG_NOT_ALLOWED)/;

/** Requires a valid Firebase ID token: `Authorization: Bearer <token>`. Sets req.auth = { uid, email }. */
export function authenticate(verify) {
  return wrap(async (req, _res, next) => {
    const header = req.get('authorization') || '';
    const match = /^Bearer (.+)$/i.exec(header);
    if (!match) throw unauthorized();
    try {
      req.auth = await verify(match[1]);
    } catch (err) {
      if (typeof err?.code === 'string' && BAD_TOKEN.test(err.code)) throw unauthorized('Your session has expired. Please sign in again.');
      console.error('[auth] token check could not be completed:', err);
      throw new ApiError(503, 'Sign-in check is temporarily unavailable. Please try again.', 'auth_unavailable');
    }
    next();
  });
}

/** Loads the caller's Profile (role etc.). Must run after authenticate(). */
export function loadProfile(supabase) {
  return wrap(async (req, _res, next) => {
    const { data, error } = await supabase.from('Profile').select('*').eq('uid', req.auth.uid).maybeSingle();
    if (error) throw dbError(error, 'load profile');
    if (!data) {
      const err = forbidden('Finish setting up your profile to continue');
      err.code = 'profile_required';
      throw err;
    }
    req.profile = data;
    next();
  });
}

export const requireRole = (role) => (req, _res, next) => {
  if (req.profile?.role !== role) {
    return next(forbidden(role === 'Farmer' ? 'Only farmer accounts can do that' : 'Only buyer accounts can do that'));
  }
  next();
};
