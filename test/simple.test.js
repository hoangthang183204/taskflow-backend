
const { expect } = require('chai');
const Sails = require('sails');
let sailsApp;

before(function(done) {
  this.timeout(10000);
  
  Sails.lift({
    environment: 'test',
    log: { level: 'silent' },
    hooks: { grunt: false }
  }, function(err, server) {
    if (err) return done(err);
    sailsApp = server;
    done();
  });
});

after(function(done) {
  if (sailsApp) {
    sailsApp.lower(done);
  } else {
    done();
  }
});

describe('🔧 Simple Test - Check Setup', () => {
  it('should pass basic math test', () => {
    expect(2 + 2).to.equal(4);
  });
  
  it('should have sails loaded', () => {
    expect(sailsApp).to.be.an('object');
  });
  
  it('should be in test environment', () => {
    expect(sailsApp.config.environment).to.equal('test');
  });
});