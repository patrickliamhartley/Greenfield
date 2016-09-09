var RemotePlayer = function (index, game, player, startX, startY, startAngle) {
  
  //declares variables
  var x = startX;
  var y = startY;
  var angle = startAngle;

  //you can chane the health if you wish, the rest keep the same
  this.game = game;
  this.health = 3;
  this.player = player;
  this.alive = true;

  //this is where you set the sprite. you will need to load a new spritesheet
  //here if you want to replace our dude
  this.player = game.add.sprite(x, y, 'dude');

  //defines animations of player
  this.player.animations.add('left', [0, 1, 2, 3], 10, true);
  this.player.animations.add('right', [5, 6, 7, 8], 10, true);

  //this is unecessary
  this.player.anchor.setTo(0.5, 0.5);

  //this name is good
  this.player.name = index.toString();

  //these physics you can mess with based on your level
  this.game.physics.enable(this.player, Phaser.Physics.ARCADE);
  this.player.body.immovable = false;
  this.player.body.collideWorldBounds = true;

  this.player.angle = angle;

  this.lastPosition = { x: x, y: y, angle: angle };
};

RemotePlayer.prototype.update = function () {
  //these update behaviors are called on your players.
  //they are here to define the animations of your co-players
  if (this.player.x !== this.lastPosition.x || this.player.y !== this.lastPosition.y || this.player.angle !== this.lastPosition.angle) {
    this.player.play('left');
    this.player.rotation = Math.PI + this.game.physics.arcade.angleToXY(this.player, this.lastPosition.x, this.lastPosition.y);
  } else {
    this.player.play('right');
  }

  this.lastPosition.x = this.player.x;
  this.lastPosition.y = this.player.y;
  this.lastPosition.angle = this.player.angle;
};

window.RemotePlayer = RemotePlayer;
