var raf = require('./raf');
var rng = require('./rng');

var stickman = require('./stickman');

var canvas = document.querySelector('#game');
var ctx = canvas.getContext('2d');

var input = require('./input')

var rand = rng();

var totalElapsed = 0;

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
  ctx.stroke()

  // if ((totalElapsed % 5) > 2.5) {
  // 	ctx.translate(300,0);
  // }
  stickman.render(ctx, 'walk', totalElapsed);
  totalElapsed += elapsed;
  if (totalElapsed > stickman.frames.walk.duration*4) {
    totalElapsed = 0;
  }
  ctx.restore();
});
