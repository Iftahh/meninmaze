"strict mode"
var raf = require('./raf');
var rng = require('./rng');
var PARTICLE = require('./particle');

var stickman = require('./stickman');

var AUDIO = require('./audio');
var camera = require('./camera');
var player = require('./player');
require('./fpscounter');

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

var Maze = require('./dfs_maze_gen');

var input = require('./input');

var rand = rng();

var totalElapsed = 0;

var maze = Maze(24,20);

window.onresize = function() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
onresize();
/*
var jetpack = PARTICLE.ParticlePointEmitter(350, {
	position: vector_create(),
	angle: 90,
	angleRandom: 10,
	duration: -1,
	finishColor: [200, 45, 10, 0],
	finishColorRandom: [40,40,40,0],
	gravity: vector_create(0,.03),
	lifeSpan: 1,
	positionRandom: vector_create(4,6),
	sharpness: 12,
	sharpnessRandom: 12,
	size: 30*SIZE_FACTOR|0,
	finishSize: 75*SIZE_FACTOR|0,
	colorEdge: [40,20,10,0],
	sizeRandom: 5*SIZE_FACTOR,
	speed: 4*SIZE_FACTOR,
	speedRandom: 1*SIZE_FACTOR,
	emissionRate: 140,
	startColor: [220, 188, 88, 1],
	startColorRandom: [32, 35, 38, 0],
	updateParticle: function(particle) {

	},
	wind: 0.1,
	area: 0.1
});*/

var anim = stickman.animations.walk;
var flip = false;
var cellWidth = 32;//2*Math.min((canvas.width-20)/48, (canvas.height-20)/40);


raf.start(function(elapsed) {

  // Clear the screen
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.save();

  player.update(cellWidth);
  camera.update();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.scale(camera.scale,camera.scale);
  ctx.translate(-camera.X-canvas.width/2, -camera.Y-canvas.height/2);
  //maze should be 20x the width of the canvas


  maze.draw(ctx, cellWidth);
  ctx.restore();
  /*
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
*/
	checkfps();
});
