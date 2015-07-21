var raf = require('./raf');
var rng = require('./rng');

var stickman = require('./stickman');
var KEYS = require('./input');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var input = require('./input')

var rand = rng();

var totalElapsed = 0;

var player = 0;
var anim = stickman.animations.walk;
var flip = false;

raf.start(function(elapsed) {
  // Clear the screen
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  //ctx.scale(0.5, 0.8);
  ctx.translate(160, 200);
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.beginPath()
  ctx.moveTo(0,0)
  ctx.lineTo(90,0)
  ctx.moveTo(180,0)
  ctx.lineTo(270,0)
  ctx.stroke();

  var move = false;
  if (KEYS[39]) {
    move = true;
    flip = false;
    player += anim.getOffset(elapsed);
  }
  if (KEYS[37]) {
    move = true;
    flip = true;
    player -= anim.getOffset(elapsed);
  }

  if (move) {
    totalElapsed += elapsed;
  }
  else {
    totalElapsed = 0;
  }

  if (anim) {
    ctx.translate(player, 0);
    if (flip) {
      ctx.scale(-1,1);
    }
    // if ((totalElapsed % 5) > 2.5) {
    // 	ctx.translate(300,0);
    // }
    anim.render(ctx, totalElapsed);
  }

  ctx.restore();
});
