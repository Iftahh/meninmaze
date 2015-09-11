(function() {
"strict mode"
var raf = require('./raf');
var rng = require('./rng');
//var PARTICLE = require('./particle');
var client = require('./client');
var Maze = require('./Maze');
//var AUDIO = require('./audio');
var camera = require('./camera');
var Player = require('./Player');
var Bulb = require('./Bulb');
require('./fpscounter');

var ctx = canvas.getContext('2d');


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
  player:  new Player()
}
var player = world.player;
player.textColor = 1;

function game(elapsed) {
    player.update(world, elapsed);
    for (var k in world.otherPlayers) {
      world.otherPlayers[k].update(world, elapsed);
    }
    for (var b in world.bulbsDict) {
      world.bulbsDict[b].update(world, elapsed);
    }
    player.setCamera();
    camera.update();

    ctx.translate(halfWidth, halfHeight); // zoom to mid of screen
    ctx.scale(camera.scale,camera.scale);
    ctx.translate(-camera.X, -camera.Y); // translate camera

    world.maze.draw(ctx, world.cellSize);
    player.draw(ctx);
    for (var k in world.otherPlayers) {
      world.otherPlayers[k].draw(ctx);
    }
}


function menu(elapsed) {
  player.update(world, elapsed);
  ctx.scale(4,4);
  ctx.fillStyle = "#ff0";
  player.draw(ctx);
}

var state = menu;

start.onclick = function() {

  // var elem = document.body;
  // if (elem.requestFullscreen) {
  //   elem.requestFullscreen();
  // } else if (elem.msRequestFullscreen) {
  //   elem.msRequestFullscreen();
  // } else if (elem.mozRequestFullScreen) {
  //   elem.mozRequestFullScreen();
  // } else if (elem.webkitRequestFullscreen) {
  //   elem.webkitRequestFullscreen();
  // }
  client.startGame();
}

blue.onclick = red.onclick = function() {
  if (blue.checked) {
    player.deserialize({x:(80)/4, y:0, anim:'fall', dir:0})
    player.setColor(1);
  }
  else {
    player.setColor(2);
    player.deserialize({x:(width-140)/4, y:0, anim:'fall', dir:1})
  }
}
blue.onclick();

pname.value = player.name;
pname.onkeyup = function() {
  player.setName(pname.value);
}



function openDialog(title, content, btLabel, btFunc) {
  console.log('open dialog', title, dialog);
  dialog.style.display = 'block';
  dialogTitle.innerHTML = title;
  dialogContent.innerHTML = content;
  dialogBtFunc.innerHTML = btLabel;
  dialogBtFunc.onclick = btFunc;
  console.log('open dialog done');
}

var updateGame = function() {
  utils.each(client.gameState.players, function(p) {
    if (p.id != client.gameState.playerId) {
      // other player
      if (!world.otherPlayers[p.id]) {
        world.otherPlayers[p.id] = new Player();
        world.otherPlayers[p.id].setColor(p.color);
        world.otherPlayers[p.id].name = p.name;
      }
      if (p.player) {
        world.otherPlayers[p.id].deserialize(p.player);
      }
    }
  })

  for (var b in client.gameState.bulbs) {
  world.bulbsDict[b].color = client.gameState.bulbs[b];
  }
}

function ofsToXY(ofs) {
  return {x: (ofs % client.gameState.mazeX)*world.cellSize,  y: (ofs/client.gameState.mazeX|0)*world.cellSize, ofs:ofs }
}

client.connect({
  onStart: function() {
    utils.each(document.querySelectorAll(".inmenu"), function(el) {
      el.classList.remove('inmenu');
      // el.classList.add('inmenu-back')
      setTimeout(function() { el.style.display = 'none'}, 1000);
    });
    input.bind(world);
    var gs = client.gameState;

    world.otherPlayers={};
    world.bulbsDict= {};

    for (var b in gs.bulbs) {
      world.bulbsDict[b] = new Bulb(ofsToXY(b), world.cellSize);
    }
    // world.bulbsDict[gs.blue] = new Bulb(ofsToXY(gs.blue), world.cellSize);
    // world.bulbsDict[gs.red] = new Bulb(ofsToXY(gs.red), world.cellSize);

    world.maze = Maze(gs.mazeX, gs.mazeY, gs.maze, world.bulbsDict);

    updateGame();
    var blue_loc = ofsToXY(gs.blue),
        red_loc = ofsToXY(gs.red);
    player.deserialize(player.color == 1 ? blue_loc : red_loc);
    for (var k in world.otherPlayers) {
      world.otherPlayers[k].deserialize(player.color == 1 ? blue_loc : red_loc);
    }
    state = game;
  },

  onDisconnect: function(endGameMsg) {
    openDialog(
      'Disconnected', endGameMsg+'<br>Do you want to reconnect?',
      'Reconnect', function() {
        document.location.reload();// TODO: prpoer reconnect
        dialog.style.display = 'none';
    });
  },

  updateGame: updateGame,

  onEnd: function() {
    // todo: replace with undo of onStart
    // utils.each(document.querySelectorAll(".inmenu-back"), function(el) {
    //   el.classList.remove('inmenu-back');
    //   el.classList.add('inmenu');
    //   el.style.display = ''
    // });

    openDialog(
      'Game Ended', client.gameState.endMsg+'<br>Do you want to play again?',
      'Play Again', function() {
        document.location.reload();
        dialog.style.display = 'none';
    });
  }
}, world);

raf.start(function(elapsed) {

  // Clear the screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  state(elapsed);
  ctx.restore();
	checkfps();
});

})();
