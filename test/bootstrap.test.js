
const Sails = require('sails');
let sails;

before(function(done) {
  this.timeout(10000);
  
  Sails.lift({
    environment: 'test',
    log: { level: 'silent' },
    hooks: { grunt: false }
  }, function(err, server) {
    if (err) {
      console.error('Error lifting Sails for tests:', err);
      return done(err);
    }
    sails = server;
    done();
  });
});

after(function(done) {
  if (sails) {
    sails.lower(done);
  } else {
    done();
  }
});

// Export sails để các file test khác có thể dùng
global.sails = sails;