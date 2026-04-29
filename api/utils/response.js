
module.exports = {
  success: (res, data = null, message = null, statusCode = 200, extra = {}) => {
    const response = { success: true };
    
    if (message) response.message = message;
    if (data !== null) response.data = data;
    
    Object.assign(response, extra);
    
    return res.status(statusCode).json(response);
  },

  error: (res, message, errorCode = null, statusCode = 400) => {
    const response = { 
      success: false,
      message: message 
    };
    
    if (errorCode) response.error = errorCode;
    
    return res.status(statusCode).json(response);
  },

  badRequest: (res, message, errorCode = null) => {
    return module.exports.error(res, message, errorCode, 400);
  },

  unauthorized: (res, message = "Unauthorized", errorCode = "UNAUTHORIZED") => {
    return module.exports.error(res, message, errorCode, 401);
  },

  notFound: (res, message = "Not found", errorCode = "NOT_FOUND") => {
    return module.exports.error(res, message, errorCode, 404);
  },

  serverError: (res, message = "Internal server error", errorCode = "SERVER_ERROR") => {
    return module.exports.error(res, message, errorCode, 500);
  },
};