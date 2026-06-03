function errorHandler(err, req, res, _next) {
  console.error('[error]', err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      type: err.type || 'server_error',
      code: err.code || 'internal_error'
    }
  });
}

function createError(statusCode, message, type, code) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.type = type || 'server_error';
  err.code = code || 'internal_error';
  return err;
}

module.exports = { errorHandler, createError };