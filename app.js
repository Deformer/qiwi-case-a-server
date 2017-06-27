const express = require('express');
const bodyParser = require('body-parser');
const jwt    = require('jsonwebtoken');
const http = require('http');
const socketioJwt = require('socketio-jwt');

const config = require('./config');
const connection = require('./models');
const router = require('./routes');
const Dialog = require('./models/dialog');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('superSecret', config.secret);

/*
var apiRoutes = express.Router();

apiRoutes.post('/authenticate', function(req, res) {

  // find the user
  User.findOne({
    name: req.body.name
  }, function(err, user) {

    if (err) throw err;

    if (!user) {
      res.json({ success: false, message: 'Authentication failed. User not found.' });
    } else if (user) {

      // check if password matches
      if (user.password !== req.body.password) {
        res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      } else {

        // if user is found and password is right
        // create a token
        var token = jwt.sign(user, app.get('superSecret'), {
          expiresIn: "24h" // expires in 24 hours
        });

        // return the information including token as JSON
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }

    }

  });
});

apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });

  }
});

// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to the coolest API on earth!' });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});
*/
app.use('/', router);
const server = http.createServer(app)

const openedConnections = {};

const io = require('socket.io')(server);
io.sockets
  .on('connection', socketioJwt.authorize({
    secret: config.secret,
    timeout: 15000 // 15 seconds to send the authentication message
  })).on('authenticated', function(socket) {
    openedConnections[socket.decoded_token.id] = socket;
    socket.on('disconnect', () => {
        console.log('user with '+ socket.decoded_token.id+ ' disconnected');
        delete openedConnections[socket.decoded_token.id]
    });
    socket.on('sendMessage', (function (data) {
        if(openedConnections[data.id]) {
            openedConnections[data.id].emit('message', {message: data.message});
        }
    }));
  console.log('hello! ' + socket.decoded_token.id);
});


connection.sync().then(() => {
    server.listen(config.port, () => {
        console.log(`server is listening on port ${config.port}`);
    });
});
