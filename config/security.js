module.exports.security = {
  cors: {
    allRoutes: true,
    allowOrigins: [
      'https://taskflow-frontend-virid.vercel.app',
      'https://taskflow-frontend.vercel.app',
      'http://localhost:3000'
    ],
    allowCredentials: true,
    allowRequestMethods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    allowRequestHeaders: 'content-type, authorization',
  },
};