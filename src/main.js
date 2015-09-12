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




blue.onclick = red.onclick = function() {
  if (client.gameState.state) { return;  }
  if (blue.checked) {
    player.deserialize({x:(80)/4, y:0, anim:'fall', dir:0})
    player.setColor(1);
  }
  else {
    player.setColor(2);
    player.deserialize({x:(world.width-140)/4, y:0, anim:'fall', dir:1})
  }
}


var world = {
  cellSize: 32, //2*Math.min((canvas.width-20)/48, (canvas.height-20)/40);
  maze: {get: function(x,y) { return y > 1 ? 0:1}},
  gravity: 0.5, // reduce speed Y every tick
  maxSpeedX: 4,
  maxSpeedY: 8,
  jumpFromGround: 7.5, // boost up speed when jumping off ground
  jumpFromAir: 0.1, // smaller gravity when pressing up even in air
  chanceJumpWall: 0.2,  // chance to be able to jump from
  wallFriction: 0.7,
  player:  new Player(),
  otherPlayers:{},
  bulbsDict: {}
}
var player = world.player;
player.textColor = 1;


var width, height, halfWidth, halfHeight;
window.onresize = function() {
  world.width=canvas.width = innerWidth;
  world.height=canvas.height = innerHeight;
  halfWidth = world.width >> 1;
  halfHeight = world.height >> 1;
  // for some reason the ctx resets on resize.. so redo
  ctx.font = 'italic 4pt Calibri';
  ctx.textAlign = 'center';
  blue.onclick();
}
onresize();


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
  for (var k in world.otherPlayers) {
    var oplayer =  world.otherPlayers[k];
    world.otherPlayers[k].update(world, elapsed);
    world.otherPlayers[k].draw(ctx);
  }
  ctx.translate(0,10);
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
}

function ofsToXY(ofs) {
  return {x: (ofs % client.gameState.mazeX)*world.cellSize,  y: (ofs/client.gameState.mazeX|0)*world.cellSize, ofs:ofs }
}

var updateGame = function() {
  utils.each(client.gameState.players, function(p) {
    if (p.id != client.gameState.playerId) {
      // other player
      var origColor = -1;
      if (!world.otherPlayers[p.id]) {
        world.otherPlayers[p.id] = new Player();
        world.otherPlayers[p.id].setColor(p.color);
        world.otherPlayers[p.id].name = p.name;
      }
      else {
         origColor = world.otherPlayers[p.id].color;
        world.otherPlayers[p.id].setColor(p.color);
        world.otherPlayers[p.id].name = p.name;
      }
      if (origColor != p.color && state == menu) {
        var bluePlayers = 0, redPlayers=0;
        for (var k in world.otherPlayers) {
          if (world.otherPlayers[k].color == 1) {bluePlayers++} else {redPlayers++}
        }
        // possibly the color of this player remained the same, but the number of players chnaged...
        // TODO fix location of players
        if (p.color == 1) {
          p.player = {x:(48)/4+10*bluePlayers, y:0, anim:'stand', dir:0}
        }
        else {
          p.player = {x:(world.width-108)/4-10*redPlayers, y:0, anim:'stand', dir:1}
        }
      }
      if (p.player) {
        world.otherPlayers[p.id].deserialize(p.player);
      }
    }
  })
  for (var pId in world.otherPlayers) {
    var found = false;
    for (var i=0; i<client.gameState.players.length; i++) {
      if (client.gameState.players[i].id == pId) {
        found = true;
        break;
      }
    }
    if (!found) {
      // this player isn't online anymore
      delete  world.otherPlayers[pId];
    }
  }

  for (var b in client.gameState.bulbs) {
    if (world.bulbsDict[b])
      world.bulbsDict[b].color = client.gameState.bulbs[b];
    else {
      world.bulbsDict[b] = new Bulb(ofsToXY(b), world.cellSize);
    }
  }
}

client.connect({
  onId: function(d) {
    if (d.color == 1) {
      blue.click();
    }
    else {
      red.click();
    }
  },
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

    world.intersections = {}
    // find intersection points
    var ofs =0, maze = world.maze;
    for (var y=0; y<gs.mazeY; y++ ) {
      for (var x=0; x<gs.mazeX; x++ ) {
        if (gs.maze[ofs]) {
          var n = !!maze[ofs+1] + !!maze[ofs-1] + !!maze[ofs+gs.mazeX] + !!maze[ofs-gs.mazeX];
          if (n > 2) {
            world.intersections[ofs] = 1;
          }
        }
        ofs++;
      }
    }

    // count the initial blue/red start location as intersections
    world.intersections[gs.blue] = world.intersections[gs.red] = 1;

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
      'Disconnected', (endGameMsg||"Disconnected!")+'<br>Do you want to reconnect?',
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
  //ctx.clearRect(0, 0, world.width, world.height);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.save();
  state(elapsed);
  ctx.restore();
	checkfps();
});

})();
