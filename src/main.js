(function() {
"strict mode"
var raf = require('./raf');
var rng = require('./rng');
//var PARTICLE = require('./particle');
var client = require('./client');

//var AUDIO = require('./audio');
var camera = require('./camera');
var player = require('./thePlayer');
require('./fpscounter');

var ctx = canvas.getContext('2d');


var Maze = require('./dfs_maze_gen');

var input = require('./input');



var totalElapsed = 0;


var width, height, halfWidth, halfHeight;
window.onresize = function() {
  width=canvas.width = innerWidth;
  height=canvas.height = innerHeight;
  halfWidth = width >> 1;
  halfHeight = height >> 1;
  ctx.font = 'italic 4pt Calibri';
  ctx.textAlign = 'center';
}
onresize();

var redChecked = rng.bool();
red.checked = redChecked;
blue.checked = !redChecked;


var world = {
  cellSize: 32, //2*Math.min((canvas.width-20)/48, (canvas.height-20)/40);
  maze: {get: function(x,y) { return y > 1 ? 0:1}},
  gravity: 0.5, // reduce speed Y every tick
  maxSpeedX: 6,
  maxSpeedY: 8,
  jumpFromGround: 7.5, // boost up speed when jumping off ground
  jumpFromAir: 0.1, // smaller gravity when pressing up even in air
  chanceJumpWall: 0.2,  // chance to be able to jump from
  wallFriction: 0.7,
}

function game(elapsed) {

    player.update(world, elapsed);
    camera.update();

    ctx.translate(halfWidth, halfHeight); // zoom to mid of screen
    ctx.scale(camera.scale,camera.scale);
    ctx.translate(-camera.X, -camera.Y); // translate camera

    world.maze.draw(ctx, world.cellSize);
    player.draw(ctx);

}


function menu(elapsed) {
  player.update(world, elapsed);
  ctx.scale(4,4);
  ctx.fillStyle = "#ff0";
  player.draw(ctx);
}

var state = menu;
player.setXYAD((85)/4, 0, 'fall', 0);


start.onclick = function() {
  utils.each(document.querySelectorAll(".inmenu"), function(el) {
    el.classList.remove('inmenu');
    setTimeout(function() { el.style.display = 'none'}, 1000);
  });
  var elem = document.body;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.msRequestFullscreen) {
    elem.msRequestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
  input.bind();
  world.maze = Maze(24,20);
  state = game;
}

blue.onclick = red.onclick = function() {
  if (blue.checked) {
    player.setXYAD((80)/4, 0, 'fall', 0);
    player.setColor(1);
  }
  else {
    player.setColor(2);
    player.setXYAD((width-140)/4, 0, 'fall', 1);
  }
}
blue.onclick();

pname.value = player.name;
pname.onkeyup = function() {
  player.setName(pname.value);
}

raf.start(function(elapsed) {

  // Clear the screen
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  state(elapsed);
  ctx.restore();
	checkfps();
});

})();
