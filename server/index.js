var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var db = require('./db/index');
var User = require('./db/userModel');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var passport = require('passport');
var session = require('express-session');

require('./config/passport')(passport);
// var authRoutes = require('./db/authRoutes');
var Player = require('./player.js');
var players = [];
global.counter = 0;

app.use(express.static(__dirname + '/../client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: 'keyboard cat'
}));
// app.use('/', authRoutes(app, passport));

app.get('/', function(req, res) {
  res.redirect('/index.html');
});

app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {failureRedirect: '../../index.html'}),
  function(req, res) {
    req.session.regenerate(function() {
      req.session.user = req.user;
      res.redirect('../../main.html');
    });
  }
);

app.get('/fetchProfile', function(req, res) {
  // console.log("req inside server.js", req.user.displayName);
  //console.log("fbPassport.curUserID: ", fbPassport.curUserID);
  console.log("req.session.user--------->", req.session.user);
  User.findOne({'facebook.id': req.session.user.facebook.id}, function(err, user) { //TODO: fix hardcoded id
    if (err) {
      res.status(500).send('error:', err);
    } else {
      res.json(user);
    }
  });
});

app.get('/signout', function(req, res) {
  req.session.destroy(function(err) {
    console.log('error: ', err);
  });
  res.sendStatus(200);
});

io.on('connection', function (socket) {
  connectionFuncs(socket);
});


//series of listeners started on our socket connection
var connectionFuncs = function (player) {
  console.log('new player connected:' + player.id);

  player.on('disconnect', function () {
    playerDisconnect(this);
  });
  player.on('new player', function (data){
    newPlayer(data,this);
  });
  player.on('move player', function(data) {

    movePlayer(data, this);
  });
  player.on('repop', function (data){
    repopPlayers(data,this);
  });
};




var playerDisconnect = function(player) {
  console.log('player disconnected:' + player.id);
  var removedPlayer = findPlayer(player.id);

  if (!removedPlayer) {
    console.log('player not found, cannont disconnect:' + player.id);
    return;
  }

  players.splice(players.indexOf(removedPlayer), 1);

  //tell clients to remove this specific player
  player.broadcast.emit('remove player', {id: player.id});
  console.log('players>> ', players);
};


//a function used when changing stages-similair to new player
var repopPlayers = function(data, player){
  console.log("repopPlayers server side function called");

  //
  var pastSelf = findPlayer(player.id);
  players.splice(players.indexOf(pastSelf), 1);

  //create a new player objext
  var nPlayer = new Player(data.x, data.y, data.angle);

  nPlayer.id = player.id;


  //send this object to existing clients
  player.broadcast.emit('newplayer', {
    id: nPlayer.id,
    x: nPlayer.getX(),
    y: nPlayer.getY(),
    angle: nPlayer.getAngle()

  });
  console.log("server side players array",players);
  //inform newly created player of previous players
  for (var i = 0; i < players.length; i ++) {
    var oldPlayer = players[i];
    player.emit('newplayer', {
      id: oldPlayer.id,
      x: oldPlayer.getX(),
      y: oldPlayer.getY(),
      angle: oldPlayer.getAngle()
    });
  }

  // //add to players array
  players.push(nPlayer); 
  console.log('serverside players',players);
};


var newPlayer = function(data, player) {
  console.log("newplayer server side function called");

  //create a new player objext
  var nPlayer = new Player(data.x, data.y, data.angle);

  if(findPlayer(player.id)){
    console.log('player already stored in server!')
    return;
  }
  
  nPlayer.id = player.id;


  //send this object to existing clients
  player.broadcast.emit('newplayer', {
    id: nPlayer.id,
    x: nPlayer.getX(),
    y: nPlayer.getY(),
    angle: nPlayer.getAngle()

  });


  //inform newly created player of previous players
  for (var i = 0; i < players.length; i ++) {
    var oldPlayer = players[i];
    player.emit('newplayer', {
      id: oldPlayer.id,
      x: oldPlayer.getX(),
      y: oldPlayer.getY(),
      angle: oldPlayer.getAngle()
    });
  }

  //add to players array

  players.push(nPlayer); 
  console.log('serverside players',players);
};

var movePlayer = function (data, player) {
  var movedPlayer = findPlayer(player.id);

  if (!movedPlayer) {
    console.log('player not found, cannot move' + player.id);
    return;
  }

  movedPlayer.setX(data.x);
  movedPlayer.setY(data.y);
  movedPlayer.setAngle(data.angle);

  player.broadcast.emit('moveplayer', {
    id: movedPlayer.id,
    x: movedPlayer.getX(),
    y: movedPlayer.getY(),
    angle: movedPlayer.getAngle()
  });

};

//helper function to find player in our stored players array
var findPlayer = function (id) {
  for (var i = 0; i < players.length; i++) { 
    if (players[i].id === id) {
      return players[i];
    }
  }
  return false;
};

http.listen(process.env.PORT || 3000, '107.170.245.62');