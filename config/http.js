
module.exports.http = {
  middleware: {
    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'router',
      'www',
      'favicon',
      'cors',  
    ],
    
    cors: {
      allRoutes: true,
      allowOrigins: ['*'],
      allowCredentials: false,
      allowRequestMethods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      allowRequestHeaders: 'content-type, authorization',
    },
  },
};