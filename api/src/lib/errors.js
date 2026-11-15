export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message); this.status = status; this.code = code; this.fields = fields;
  }
}
export const fail = (status, code, message, fields) => { throw new HttpError(status, code, message, fields); };
export const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
export const send = (res, data, message = 'OK', status = 200) => res.status(status).json({ data, message });
export function errorHandler(error, _req, res, _next) {
  if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'Maximum file size is 5 MiB.' } });
  if (error?.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: { code: 'ALREADY_EXISTS', message: 'This record already exists.' } });
  if (error?.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: { code: 'INVALID_REFERENCE', message: 'Referenced record does not exist.' } });
  if (error instanceof HttpError) {
    const payload = { code: error.code, message: error.message };
    if (error.fields) payload.fields = error.fields;
    return res.status(error.status).json({ error: payload });
  }
  console.error('Unhandled server error:', error);
  return res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error. Please retry.' } });
}
