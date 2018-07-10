var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    this.on('creating', this.hashPassword, this);
  },

  hashPassword: function(user) {
    return new Promise(function(resolve, reject) {
      bcrypt.hash(user.get('password'), null, null, function(err, hash) {
        if (err) {
          reject(err);
        }
        user.set('password', hash);
        resolve();
      });
    });
  },
  
  comparePassword: function(password, cb) {
    bcrypt.compare(password, this.get('password'), cb);
  }
});

module.exports = User;