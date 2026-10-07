export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg) => new ApiError(400, msg, 'bad_request');
export const unauthorized = (msg = 'Please sign in to continue') => new ApiError(401, msg, 'unauthorized');
export const forbidden = (msg = 'You are not allowed to do that') => new ApiError(403, msg, 'forbidden');
export const notFound = (msg = 'Not found') => new ApiError(404, msg, 'not_found');
export const conflict = (msg) => new ApiError(409, msg, 'conflict');

// Express 5 forwards rejected promises to the error handler, but wrapping keeps the intent explicit.
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Turn a Supabase/PostgREST error into a safe ApiError. Details are logged, never returned. */
export function dbError(error, context) {
  console.error(`[db] ${context}:`, error);
  return new ApiError(500, 'Something went wrong on our side. Please try again.', 'db_error');
}
