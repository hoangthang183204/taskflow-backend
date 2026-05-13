module.exports.security = {
  cors: {
    allRoutes: true,
    allowOrigins: [
      'https://taskflow-frontend-virid.vercel.app',
      'https://taskflow-frontend.vercel.app',
      'http://localhost:3000',
      'https://taskflow-frontend-*.vercel.app', 
      '*'  
    ],
    allowCredentials: true,
    allowRequestMethods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD',
    allowRequestHeaders: 'content-type, authorization, x-csrf-token, accept, origin',
    allowResponseHeaders: 'content-type, authorization',
  },
};