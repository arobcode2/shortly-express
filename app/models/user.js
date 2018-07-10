var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  events: {
    'submit': 'addUser'
  },

  addUser: function(e) {
    e.preventDefault();
    var $username = this.$el.find('form #username');
    var $password = this.$el.find('form #password');
    var user = new Shortly.User({ username: $username.val(), password: $password.val() });
    user.on('sync', this.success, this);
    user.on('error', this.failure, this);
    user.save({});
    //$form.val('');
  },

  saltHashPassword: function(password) {
    bcrypt.hash(password, 10).then(function(hash) {
      //I DONT KNOW
    });
  },

  createUser: function({username, password}) {
    console.log(`Add user ${username}`);
    const {salt, hash} = saltHashPassword(password);
  },

  success: function() {
    console.log('yoooo I am adding user');
  },

  failure: function() {
    console.log('failed at adding user')
  }
  
});

module.exports = User;