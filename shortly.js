var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var bcrypt = require('bcrypt-nodejs');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'cookie monster',
  resave: true,
  saveUninitialized: false,
  cookie: { secure: true }
}));


app.get('/', util.checkUser, function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser, function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/logout', function(req, res) {
  delete req.sessionID;
  res.redirect('/login');
})

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.get('/links', function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.get('/users', function(req, res) {
  Users.reset().fetch().then(function(users) {
    res.status(200).send(users.models);
  });
});


app.post('/links', function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }
        
        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', function(req, res) {
  console.log(req.body);
  new User({username: req.body.username}).fetch().then(function(found) {
    if (found) {
      res.status(500).send('Username exists in database already. Please use another one. Click back to go back to the signup form.');
    } else {
      console.log('Making the user');
      bcrypt.hash(req.body.password, null, null, function(err, hash) {
        Users.create({
          username: req.body.username,
          password: hash
        }).then(function(newUser) {
          console.log('Added ' + req.body.username + ' to the database');
          res.redirect('/');
        });
      });
    }
  });
});

app.post('/login', function(req, res) {
  User.where({username: req.body.username}).fetch().then(function(found) {
    if (found) {
      console.log(`Username ${req.body.username} was found in database`);
      bcrypt.compare(req.body.password, found.get('password'), function(err, result) {
        if (result) {
          res.redirect('/');
        } else {
          console.log('Password did not match...redirecting to signup');
          res.redirect('/signup');
        }
      })
    } else {
      console.log('Username did not match...redirecting to signup');
      res.redirect('/signup');
    }
  });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
