var App = {};

App.stage1 = function(game) {
  console.log('starting stage1');
  console.log(game);
  App.info.game = game;

};

App.stage1.prototype = {
  preload: function() {
    this.load.spritesheet('dude', '/../../../assets/dude.png', 32, 48);
    this.load.image('ground', '/../../../assets/platform.png');
    this.load.bitmapFont('pixel', '/../assets/font.png','/../assets/font.fnt');
    this.load.image('background', '/../../../assets/space.png');
    this.load.spritesheet('coin','/../../../assets/coin.png', 32, 32);

  },

  create: function() {
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.add.tileSprite(0, 0, 800, 600, 'background');
    platforms = this.add.group();
    platforms.enableBody = true;
    var ground = platforms.create(0, this.world.height - 64, 'ground');
    ground.scale.setTo(2, 2);
    ground.body.immovable = true;
    player = this.add.sprite(32, this.world.height - 150, 'dude');
    App.info.player = player;
    this.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
    player.body.gravity.y = 300;
    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);

    var updatedScore = ('Score:' + App.info.score + '\nHealth: ' + App.info.health + '\nGold: ' + App.info.gold);
    scoreText = this.add.text(16, 16, updatedScore, {fontSize: '32px', fill: '#fff'});
    var style = {fill: "white"};

    //adds text to screen
    var text = "Waiting for new players!\nWhen all players are present,\n press SPACE to start!";
    this.coolText = this.add.bitmapText(this.world.centerX-300, 120, "pixel", text, 30);
    this.coolText.align = 'center';
    this.coolText.tint = 0xff00ff;


    App.info.socketHandlers();
    App.info.socket.emit('connect'); // logs connected, clean slate for players,
                                     // and then adds self as a player to player list

    this.key1 = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    //creates coin
    coin = this.add.sprite(400, 0, 'coin');
    coin.animations.add('bling', [0, 1, 2, 3, 4, 5, 6, 7, 8], 10, true);
    this.physics.arcade.enable(coin);
    coin.body.gravity.y = 300;
    coin.animations.play('bling');

    

  },

  update: function() {

    var updatedScore = ('Score:' + App.info.score + '\nHealth: ' + App.info.health + '\nGold: ' + App.info.gold);
    scoreText.text = updatedScore;
    // for each of the connected players, run each player's update fn
    // and set collision between all players
    for ( var i = 0; i < App.info.players.length; i++ ) {
      if (App.info.players[i].alive) { 
        App.info.players[i].update();
        this.physics.arcade.collide(player, App.info.players[i].player);
        this.physics.arcade.collide(App.info.players[i].player, coin, function(){
          coin.kill();
        });
      }
    }

    // set keyboard bindings, default movement to 0, set player collision and platforms
    var cursors = this.input.keyboard.createCursorKeys();
    player.body.velocity.x = 0;
    this.physics.arcade.collide(player, platforms);


    //coin conditions
    this.physics.arcade.collide(coin, platforms);
    this.physics.arcade.collide(player, coin, function() {
      coin.kill();
      App.info.gold += 1;
      
    });
    

    if (cursors.left.isDown) {
      player.body.velocity.x = -150;
      player.animations.play('left');
    } else if (cursors.right.isDown) {
      player.body.velocity.x = 150;
      player.animations.play('right');
    } else {
      player.animations.stop();
      player.frame = 4;

    }

    if (cursors.down.isDown) {

      //this line starts stage 2 -- important!
      this.state.start('stage2');
      console.log('start stage 2');
    }
    if (cursors.up.isDown && player.body.touching.down) {
      App.info.score += 10;
      player.body.velocity.y = -300;
 
      
    }
    this.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR ]);
    
    if (this.key1.isDown) {
      this.state.start('stage2'); 
    }
    // every frame, each player will emit their x,y,angle to every player
    // including self
    App.info.socket.emit('move player', {
      x: player.x,
      y: player.y,
      angle: player.angle
    });




  }
}; 


App.info = { // this is the source of truth of info for each stage
  score: 0,
  health: 100,
  gold: 0,
  players: [],
  socket: io.connect('http://107.170.245.62:3000'), // sets this player's socket
  
  //these event handlers trigger functions no matter what stage you are on
  socketHandlers: function () {

    App.info.socket.on('connect', function() {
      App.info.socketConnect();
    });
    App.info.socket.on('disconnected', function() {App.info.socketDisconnect();});
    App.info.socket.on('newplayer', function(data){App.info.createPlayer(data); });
    App.info.socket.on('moveplayer', function(data){App.info.movePlayer(data); });
    App.info.socket.on('remove player', function(data){App.info.removePlayer(data); });
    App.info.socket.on('stage', function() {
      App.info.stageConnect();
    });
  
  },
  //this function is called  when you connect to a new stage, it resets the players
  stageConnect: function() {
    console.log('stage connect');
    App.info.players.forEach(function (player) {
      player.player.kill();
    });
    App.info.players = [];
    App.info.socket.emit('repop', {x: player.x, y: player.y, angle: player.angle});

  },

  //this is fired on our initial connect-it starts a new game
  socketConnect: function() {
    console.log('connected to server');
    console.log('players array', App.info.players);

    // sets a clean slate for players (on the screen and in array)
    App.info.players.forEach(function (player) {
      player.player.kill();
    });
    App.info.players = [];

    // lets all players know, including self, to add/create this player
    // (runs 'createPlayer')
    App.info.socket.emit('new player', {x: player.x, y: player.y, angle: player.angle});

  },
  socketDisconnect: function () {
    // simply hears when the user disconnects from the server
    // and logs that the player has disconnected
    console.log('disconnected from server');
    App.info.socket.emit('disconnect');

  },

  //creates a player 
  createPlayer: function (data) {

    var duplicate = App.info.findPlayer(data.id);

    if (duplicate) { // if player already found in players array, do not continue
      console.log('duplicate player');
      return;
    } 

    // adds new player to array with (name, game object, player sprite object, x, y, angle)
    App.info.players.push( new RemotePlayer(data.id, App.info.game, player, data.x, data.y, data.angle));

  },

  movePlayer: function (data) {

    var movedPlayer = App.info.findPlayer(data.id);

    if (!movedPlayer) { // if player is not in players array, don't continue
      console.log('player not found', data.id);
      return;
    }

    // every time a player moves, the x,y,angle are set on that player object
    // including self
    movedPlayer.player.x = data.x;
    movedPlayer.player.y = data.y; 
    movedPlayer.player.angle = data.angle;

  },
  removePlayer: function (data) {
    var removedPlayer = App.info.findPlayer(data.id);

    if (!removedPlayer) { // if player is not in players array, don't continue
      console.log( 'player not found', data.id);
      return;
    }

    // wipe disconnected player from screen and remove them from player array
    removedPlayer.player.kill();
    App.info.players.splice(App.info.players.indexOf(removedPlayer), 1);

  },
  
  // returns player from player array or undefined
  findPlayer: function (id) {
    for (var i = 0; i < App.info.players.length; i ++) {
      if (App.info.players[i].player.name === id) {
        return App.info.players[i];
      }
    }
  }
};