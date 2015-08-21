(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"strict mode"
var raf = require('./raf');
var rng = require('./rng');
var PARTICLE = require('./particle');


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

var width, height, halfWidth, halfHeight;
window.onresize = function() {
  width=canvas.width = innerWidth;
  height=canvas.height = innerHeight;
  halfWidth = width >> 1;
  halfHeight = height >> 1;
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



var world = {
  cellSize: 32, //2*Math.min((canvas.width-20)/48, (canvas.height-20)/40);
  maze: maze,
  gravity: 0.5, // reduce speed Y every tick
  maxSpeedX: 6,
  maxSpeedY: 8,
  jumpFromGround: 7.5, // boost up speed when jumping off ground
  jumpFromAir: 0.1, // smaller gravity when pressing up even in air
  chanceJumpWall: 0.2,  // chance to be able to jump from
  wallFriction: 0.7,
}



raf.start(function(elapsed) {

  // Clear the screen
  //ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, width, height);
	ctx.save();

  player.update(world, elapsed);
  camera.update();

  ctx.translate(halfWidth, halfHeight); // zoom to mid of screen
  ctx.scale(camera.scale,camera.scale);
  ctx.translate(-camera.X, -camera.Y); // translate camera
  //maze should be 20x the width of the canvas


  maze.draw(ctx, world.cellSize);
  player.draw(ctx);
  ctx.restore();



  // if (flip) {
  //   ctx.scale(-1,1);
  // }
  // if ((totalElapsed % 5) > 2.5) {
  // 	ctx.translate(300,0);
  // }

	checkfps();
});

},{"./audio":2,"./camera":3,"./dfs_maze_gen":4,"./fpscounter":5,"./input":6,"./particle":8,"./player":9,"./raf":10,"./rng":11}],2:[function(require,module,exports){
var rng = require('./rng');
var jsfxr = require('./jsfxr');

function ArcadeAudio() {
  this.sounds = {};
}

ArcadeAudio.prototype.add = function( key, count, settings ) {
  this.sounds[ key ] = [];
  settings.forEach( function( elem, index ) {
    this.sounds[ key ].push( {
      tick: 0,
      count: count,
      pool: []
    } );
    for( var i = 0; i < count; i++ ) {
      var audio = new Audio();
      audio.src = jsfxr( elem );
      this.sounds[ key ][ index ].pool.push( audio );
    }
  }, this );
};

ArcadeAudio.prototype.play = function( key ) {
  var sound = this.sounds[ key ];
  var soundData = rng.pick(sound);
  soundData.pool[ soundData.tick ].play();
  soundData.tick < soundData.count - 1 ? soundData.tick++ : soundData.tick = 0;
};

var aa = new ArcadeAudio();

aa.add( 'powerup', 10,
  [
    [0,,0.01,,0.4384,0.2,,0.12,0.28,1,0.65,,,0.0419,,,,,1,,,,,0.3]
  ]
);

aa.add( 'laser', 5,
  [
    [2,,0.2,,0.1753,0.64,,-0.5261,,,,,,0.5522,-0.564,,,,1,,,,,0.25],
    [0,,0.16,0.18,0.18,0.47,0.0084,-0.26,,,,,,0.74,-1,,-0.76,,1,,,,,0.15]
  ]
);

aa.add( 'damage', 3,
  [
    [3,,0.0138,,0.2701,0.4935,,-0.6881,,,,,,,,,,,1,,,,,0.25],
    [0,,0.0639,,0.2425,0.7582,,-0.6217,,,,,,0.4039,,,,,1,,,,,0.25],
    [3,,0.0948,,0.2116,0.7188,,-0.6372,,,,,,,,,,,1,,,0.2236,,0.25],
    [3,,0.1606,0.5988,0.2957,0.1157,,-0.3921,,,,,,,,,0.3225,-0.2522,1,,,,,0.25],
    [3,,0.1726,0.2496,0.2116,0.0623,,-0.2096,,,,,,,,,0.2665,-0.1459,1,,,,,0.25],
    [3,,0.1645,0.7236,0.3402,0.0317,,,,,,,,,,,,,1,,,,,0.25]
  ]
);

module.exports = aa;

},{"./jsfxr":7,"./rng":11}],3:[function(require,module,exports){
(function() {

// private variables:
  var targetX=0,    // where the camera should move to
    targetY=0,

    curX =0,  // where the camera currently is - float
    curY = 0;


// globals:
  module.exports =  {
    X: 0, // where the camera currently is - integer pixels  (suitable for canvas translate)
    Y: 0,
    scale: 1,
    update: function() {
      // move the camera slightly towards the target, called from the raf function
      curX = curX*.9 + targetX*.1;
      curY = curY*.9 + targetY*.1;
      this.X = Math.round(curX);
      this.Y = Math.round(curY);
    },

    setTarget: function(x,y) {
      targetX = x;
      targetY = y;
    }
  }
})();

},{}],4:[function(require,module,exports){

function isEmpty(obj) {
  for(var i in obj) { return false; }
  return true;
}
function room(x,y) {
  return x+","+y;
}
// TODO: replace with random with a seed ?
function rndInt(mx) {
  return Math.random() * mx | 0;
}


function generateMaze(MAZE_X, MAZE_Y) {
  var unvisitedCells = {},
    maze = [],
    WALL = 0,
    AIR = 1,
    x,y,t,
      stack=[],
      nx,ny,neighborsDup,dir,
      popcell,
       // pairs of (dx,dy)
       // duplicate horizontal to give more chance for horizontal pathes
      neighbors = [0,1, 0,-1, 1,0,1,0,1,0,   -1,0,-1,0,-1,0];

// maze is 4 times bigger than MAXE_X x MAZE_Y - so do twice each row, and add two cells for each X

  for (y=0; y<MAZE_Y; y++) {
    for (t=0; t<2; t++) {
      for (x=0; x<MAZE_X; x++) {
        unvisitedCells[room(x,y)] = 1;
        maze.push(WALL);
        maze.push(WALL);
      }
    }
  }

  x = rndInt(MAZE_X);
  y=rndInt(MAZE_Y);

  MAZE_X *= 2;
  MAZE_Y *= 2;

  while (1) {
    // visit x,y (unless we've been here before and this is a backtrack)
    if (unvisitedCells[room(x,y)]) {
      delete unvisitedCells[room(x,y)];
      maze[MAZE_X*y*2+x*2] = AIR;
      if (isEmpty(unvisitedCells)) {
        // all done
        break;
      }
    }
    // look for a direction to move
    neighborsDup = neighbors.slice();
    while (1) {

      if (neighborsDup.length == 0) {
        // reached a deadend - backtrack to someplace not dead
        popcell = stack.pop().split(',');
        x = +popcell[0];
        y = +popcell[1];
        break; // try again from earlier point in the stack
      }
      dir = neighborsDup.splice(2*rndInt(neighborsDup.length/2), 2); // pick a direction

      nx = x + dir[0];
      ny = y + dir[1];
      // check if already visited = not unvisited
      // incidently, this also captures the out of maze edge scenario,
      // since "-1,4" will be undefined so understood as visited already
      if (!unvisitedCells[room(nx,ny)]) {
        continue;
      }
      // found a good direction!
      maze[MAZE_X*(2*y+dir[1])+2*x+dir[0]] = AIR;

      // save this location in case we reach a dead end later and need to backtrack
      stack.push(room(x,y));

      // move to new location
      x = nx;
      y = ny;
      break;
    }
  }


  function findPlaces() {
    // maybe instead of maps use array and binary search in case need to check contains?
    //  http://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
    var places = {
      horizDE: {},  // DE = dead end
      topDE: {},
      bottomDE: {},
      hallway: {},
      chute: {},
    };

    for (var y=0; y<MAZE_Y; y++ ) {
      for (var x=0; x<MAZE_X; x++ ) {
        var ofs = MAZE_X*y+x;
        if (maze[ofs]) {
          if (maze[ofs+1] && maze[ofs-1]) { // both left and right
            if (maze[ofs+2] && maze[ofs-2] && !maze[ofs+MAZE_X])
              places.hallway[ofs] = 1;
          }
          else if (maze[ofs+1] || maze[ofs-1]) {  // only left or only right
            // check not corner
            if (!maze[ofs+MAZE_X] && !maze[ofs-MAZE_X])
              places.horizDE[ofs] = 1;
          }
          else if (maze[ofs+MAZE_X] && maze[ofs-MAZE_X]) {
            places.chute[ofs] = 1; // both up and down
          }
          else if (maze[ofs-MAZE_X]) {
            places.bottomDE[ofs] = 1;
          }
          else if (maze[ofs+MAZE_X]) {
            places.topDE[ofs] = 1;
          }
        }
      }
    }
    return places;
  }


  // TODO:  Maybe no need for BFS?  without cycles DFS is good distance measurment as well
  // TODO: Floyd Marshal for all pairs
  //       https://mgechev.github.io/javascript-algorithms/graphs_shortest-path_floyd-warshall.js.html
  function BFS(ofs0) {
    // reset
    for (var y=0; y<MAZE_Y; y++) {
      for (var x=0; x<MAZE_X; x++) {
        var ofs = MAZE_X*y+x;
        if (maze[ofs]) {
          maze[ofs] = 1;
        }
      }
    }
    var ofs=ofs0,
        stack = [ofs],
        d,
        fu = function(ofs) {
          if (maze[ofs]==1) {
            maze[ofs]=d;
            stack.push(ofs)
          }
        };

    while (stack.length) {
      ofs = stack.pop();
      d = maze[ofs]+1;
      fu(ofs+1);
      fu(ofs-1);
      fu(ofs+MAZE_X);
      fu(ofs-MAZE_X);
    }
  }

  // TODO: add keys and locks, eg http://www.squidi.net/three/entry.php?id=4

  function drawMaze(ctx, cellSize) {
      ctx.fillStyle = "#eef";
      var small = cellSize/3;
      //ctx.fillStyle = "#000";
      //ctx.fillRect(0,0, W, H);
      //BFS(MAZE_X*MAZE_Y-MAZE_X);
      //var places = findPlaces();
      for (var y=-3; y<MAZE_Y+2; y++) {
        var x0=-3, ofs = y*MAZE_X;
        for (var x=0; x<MAZE_X; x++) {

          if (maze[ofs]) {
            // found air - draw rect from prev rock to this X
            if (x0 != -1) {
              ctx.fillRect(x0*cellSize, y*cellSize, (x-x0)*cellSize, cellSize);
              x0 = -1;
            }

            if (maze.places.bottomDE[ofs]) {
               ctx.fillStyle = "#faa";
               ctx.fillRect(x*cellSize+small, y*cellSize+small, small,small);
               ctx.fillStyle = "#eef";
            }
          }
          else {
            // found rock, update x0
            if (x0 == -1) {
              x0 = x;
            }
          }
            //var t= maze[ofs];
            //ctx.fillStyle = 'rgb('+t+","+t+","+t+")";

            // if (places.topDE[ofs]) {
            //   ctx.fillStyle = "#ffa";
            // }
            // if (places.bottomDE[ofs]) {
            //   ctx.fillStyle = "#faa";
            // }
            // if (places.horizDE[ofs]) {
            //   ctx.fillStyle = "#afa";
            // }
            // if (places.hallway[ofs]) {
            //   ctx.fillStyle = "#aaf";
            // }
            //
            //ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
          ofs++;
        }
        ctx.fillRect(x0*cellSize, y*cellSize, (2+x-x0)*cellSize, cellSize);
      }
  }

  maze.BFS = BFS;
  maze.places = findPlaces();
  maze.draw = drawMaze;
  maze.get = function(x,y) {
    return maze[y*MAZE_X+x];
  }
  return maze;
}

/*
var MAZE_X=48,
    MAZE_Y=40,
    maze = generateMaze(MAZE_X/2, MAZE_Y/2),

    W = 600,
    H = 400;//,

  //  ctx = document.getElementById('canvas').getContext("2d");
*/
//drawMaze();

module.exports = generateMaze;

},{}],5:[function(require,module,exports){
/*
 * fpscounter.js
 *
 * A simple in-browser fps counter, suitable for using with a bookmarklet
 *
 * @author Pete Otaqui <pete@otaqui.com>
 * @url https://github.com/pete-otaqui/fpscounter
 * @license Creative Commons Attribution 3.0 Unported
 * @license http://creativecommons.org/licenses/by/3.0/deed.en_GB
*/
(function(global) {
    global.fpscounter = function(options) {

        // late binding for options > global.fpscounter_options > defaults
        options = options || {};
        var globals = global.fpscounter_options || {};

        var defaults = {
            remove_on_click: false,
            width: 100,
            height: 50
        };
        Object.keys(defaults).forEach(function(key) {
            options[key] = options[key] || globals[key] || defaults[key];
        });


        // get the width height for repeated use
        var canvas_w = options.width,
            canvas_h = options.height;

        // create the new dom elements, the canvas context, the style
        var ele = document.createElement('div');
        ele.className = 'fpscounter';
        ele.style.width = canvas_w + 'px';
        ele.style.height = canvas_h + 'px';

        var canvas = document.createElement('canvas');
        canvas.className = 'fpscounter-canvas';
        canvas.width = canvas_w;
        canvas.height = canvas_h;

        var context = canvas.getContext('2d'),
            text_fps_x = canvas_w/2 - 14,
            text_fps_y = canvas_h/2 + 10,
            text_max_x = 4,
            text_max_y = 8,
            text_min_x = 4,
            text_min_y = canvas_h - 4,
            fps_font = 'bold 30px Monospace',
            min_max_font = '10px Monospace';

        var gradient_fill = context.createLinearGradient(0,0,0,canvas_h);
        gradient_fill.addColorStop(0, '#001133');
        gradient_fill.addColorStop(1, '#112288');

        var gradient_line = context.createLinearGradient(0,0,0,canvas_h);
        gradient_line.addColorStop(0, '#2848d8');
        gradient_line.addColorStop(1, '#3366ff');

        context.lineWidth = 1;
        context.strokeStyle = gradient_line;


        var style = document.createElement('style');
        style.textContent = '.fpscounter { '+
                                'position: fixed; '+
                                'top: 0; '+
                                'right: 0; '+
                                'background-color: #000; '+
                                'color: #fff; '+
                                'font-size: 30px; '+
                                'font-family: monospace;'+
                                'z-index: 999999'+
                            '}';

        ele.appendChild(canvas);
        document.body.appendChild(ele);
        document.querySelector('head').appendChild(style);


        // initialize some timing and history variables
        var t_pre, t_now, u_pre, u_lim,
            h_arr = [], h_len = canvas_w,
            raf_request, raf_running;

        // we won't update anything more often than this many milliseconds
        u_lim = 100;

        // reduce an array of values to it members bounding values in the form [min, max]
        function h_reduce(memo, item) {
            if ( !memo[0] || item < memo[0]) memo[0] = item;
            if ( !memo[1] || item > memo[1]) memo[1] = item;
            return memo;
        }

        function checkfps() {
            var fps, c_min_max, c_min, c_delta, first_point, xy;
            raf_running = true;
            t_now = Date.now();
            // this is where we throttle displayed updates
            if ( t_now >= u_pre + u_lim) {

                // get the fps for the history
                fps = Math.min(60, Math.round(1/(t_now-t_pre)*1000));
                h_arr.unshift(fps);

                // do required math
                context.clearRect(0, 0, canvas_w, canvas_h);
                if ( h_arr.length > h_len ) h_arr.pop();
                c_min_max = h_arr.reduce(h_reduce, []);
                c_min = c_min_max[0];
                c_max = c_min_max[1];
                c_delta = c_max - c_min;


                // draw the line graph
                context.fillStyle = gradient_fill;
                context.beginPath();
                // first_point = fpsToPoint(0, h_arr[0], c_min, c_delta);
                context.moveTo(canvas_w, canvas_h);
                h_arr.forEach(function(fps_val, index) {
                    xy = fpsToPoint(index, fps_val, c_min, c_delta);
                    context.lineTo(xy[0], xy[1]);
                });
                context.lineTo(xy[0], canvas_h);
                context.lineTo(canvas_w, canvas_h);
                context.fill();
                context.stroke();

                context.fillStyle = '#fff';
                // write the main FPS text
                context.font = fps_font;
                context.fillText(fps, text_fps_x, text_fps_y);

                // write the limit texts
                context.font = min_max_font;
                context.fillText(c_min, text_min_x, text_min_y);
                context.fillText(c_max, text_max_x, text_max_y);

                // set the "update time" counter
                u_pre = t_now;
            }

            // set the "frame time" counter
            t_pre = t_now;

            // request another update later
            // if ( raf_running ) {
            //     raf_request = requestAnimationFrame(checkfps);
            // }
        }

        // convert an fps value to an [x,y] array
        function fpsToPoint(index, fps_val, min, delta) {
            return [
                canvas_w - index,
                canvas_h - canvas_h * (fps_val - min) / delta
            ];
        }

        // add removal event
        ele.addEventListener('click', function() {
            raf_running = !raf_running;
            if (raf_running) {
                start();
            } else {
                cancelAnimationFrame(raf_request);
                if ( options.remove_on_click ) {
                    document.body.removeChild(ele);
                }
            }
        });

        // start
        function start() {
            t_pre = Date.now();
            h_arr = [];
            u_pre = t_pre;
            checkfps();
        }

        start();

        global.checkfps = checkfps;
    };

    // lots of negatives here because the assumption is we should start
    if ( !global.fpscounter_options || global.fpscounter_options.auto_start !== false) {
        global.fpscounter();
    }

})(window);

},{}],6:[function(require,module,exports){
utils = require('./utils')


var KEYS={}
var updateFromKeys = function(e, realEv) {
  var code= e.keyCode;
    KEYS[code]=  e.type == 'keydown';
    //console.log('code is ',code);
    // Player.left = KEYS[37];
    // Player.right = KEYS[39];
    // Player.up = KEYS[38];
    // Player.down = KEYS[40];
    // Player.jump = KEYS[32];
    var element = document.getElementById(code);
    if (element) {
      if (KEYS[code]) {
        element.classList.add('clicked');
      }
      else {
        element.classList.remove('clicked');
      }
      if (realEv && realEv.preventDefault) {
        realEv.preventDefault();
      }
      else {
        e.preventDefault();
      }
    }
}

document.addEventListener('keydown', updateFromKeys);
document.addEventListener('keyup', updateFromKeys);

// UGLY - using hard coded values from CSS
var p0 = 10 + 55+65+55,
  p1 = 10+55+65,
  p2 = 10+55;


utils.each(['mousedown','mouseup', 'touchstart','touchmove','touchend'], function(evName) {
  document.getElementById("left").addEventListener(evName, function(event) {
      event.preventDefault();
      var type = event.type, x=event.clientX, y=event.clientY;
      if (type=='touchend') {
        updateFromKeys({type:0, keyCode: 40 }, event);
        updateFromKeys({type:0, keyCode: 39 }, event);
        updateFromKeys({type:0, keyCode: 38 }, event);
        updateFromKeys({type:0, keyCode: 37 }, event);
        return;
      }

      if (event.touches) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      }
      var e = {type: (type == 'mouseup')? 0: 'keydown' };
      if (x < p2) {
        e.keyCode = 37;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 39 }, event);
      }
      else if (x<p0 && p1 <x) {
        e.keyCode = 39;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 37 }, event);
      }
      else {

      }
      var y = innerHeight - y;
      if (y < p2) {
        e.keyCode = 40;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 38 }, event);
      }
      else if (y < p0 && p1<y) {
        e.keyCode = 38;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 40 }, event);
      }

  }, false);
});

utils.each(document.querySelectorAll(".button"), function(el) {
  utils.each(['mousedown','mouseup', 'touchstart','touchmove','touchend'], function(evName) {
    el.addEventListener(evName, function(event) {
      var type = event.type;
      console.log("event "+ type+ " "+event.target.id);
      var e = {type: (type == 'mouseup' || type=='touchend')? 0: 'keydown', keyCode: event.target.id };
      // fake a keydown/up event
      updateFromKeys(e, event);
    });
  });
});

module.exports = KEYS;

},{"./utils":17}],7:[function(require,module,exports){
/**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
 // JS Port: https://github.com/mneubrand/jsfxr/blob/master/jsfxr.js

/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param array Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.setSettings = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
      this[String.fromCharCode( 97 + i )] = values[i] || 0;
    }

    // I moved this here from the reset(true) function
    if (this['c'] < .01) {
      this['c'] = .01;
    }

    var totalTime = this['b'] + this['c'] + this['e'];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this['b']  *= multiplier;
      this['c'] *= multiplier;
      this['e']   *= multiplier;
    }
  }
}

/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._params = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Resets the runing variables from the params
   * Used once at the start (total reset) and for the repeat effect (partial reset)
   */
  this.reset = function() {
    // Shorter reference
    var p = this._params;

    _period       = 100 / (p['f'] * p['f'] + .001);
    _maxPeriod    = 100 / (p['g']   * p['g']   + .001);

    _slide        = 1 - p['h'] * p['h'] * p['h'] * .01;
    _deltaSlide   = -p['i'] * p['i'] * p['i'] * .000001;

    if (!p['a']) {
      _squareDuty = .5 - p['n'] / 2;
      _dutySweep  = -p['o'] * .00005;
    }

    _changeAmount =  1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
  }

  // I split the reset() function into two functions for better readability
  this.totalReset = function() {
    this.reset();

    // Shorter reference
    var p = this._params;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p['b']  * p['b']  * 100000;
    _envelopeLength1 = p['c'] * p['c'] * 100000;
    _envelopeLength2 = p['e']   * p['e']   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.synthWave = function(buffer, length) {
    // Shorter reference
    var p = this._params;

    // If the filters are active
    var _filters = p['s'] != 1 || p['v'],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'],
        // Minimum frequency before stopping
        _minFreqency = p['g'],
        // If the phaser is active
        _phaser = p['q'] || p['r'],
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01,
        // The type of wave to generate
        _waveType = p['a'];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for (var i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for (var i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = Math.random() * 2 - 1;
    }

    for (var i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially resetting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.reset();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit) {
        if (++_changeTime >= _changeLimit) {
          _changeLimit = 0;
          _period *= _changeAmount;
        }
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
        _squareDuty += _dutySweep;
        if (_squareDuty < 0) {
          _squareDuty = 0;
        } else if (_squareDuty > .5) {
          _squareDuty = .5;
        }
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;

        switch (++_envelopeStage)  {
          case 1:
            _envelopeLength = _envelopeLength1;
            break;
          case 2:
            _envelopeLength = _envelopeLength2;
        }
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
        _hpFilterCutoff *= _hpFilterDeltaCutoff;
        if (_hpFilterCutoff < .00001) {
          _hpFilterCutoff = .00001;
        } else if (_hpFilterCutoff > .1) {
          _hpFilterCutoff = .1;
        }
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = Math.random() * 2 - 1;
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
          _lpFilterCutoff *= _lpFilterDeltaCutoff;
          if (_lpFilterCutoff < 0) {
            _lpFilterCutoff = 0;
          } else if (_lpFilterCutoff > .1) {
            _lpFilterCutoff = .1;
          }

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();

// Export for the Closure Compiler
module.exports = function(settings) {
  // Initialize SfxrParams
  synth._params.setSettings(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.totalReset();
  var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
  var used = synth.synthWave(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;
  var dv = new Uint32Array(data.buffer, 0, 44);
  // Initialize header
  dv[0] = 0x46464952; // "RIFF"
  dv[1] = used + 36;  // put total size here
  dv[2] = 0x45564157; // "WAVE"
  dv[3] = 0x20746D66; // "fmt "
  dv[4] = 0x00000010; // size of the following
  dv[5] = 0x00010001; // Mono: 1 channel, PCM format
  dv[6] = 0x0000AC44; // 44,100 samples per second
  dv[7] = 0x00015888; // byte rate: two bytes per sample
  dv[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
  dv[9] = 0x61746164; // "data"
  dv[10] = used;      // put number of samples here

  // Base64 encoding written by me, @maettig
  used += 44;
  var i = 0,
      base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      output = 'data:audio/wav;base64,';
  for (; i < used; i += 3)
  {
    var a = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
    output += base64Characters[a >> 18] + base64Characters[a >> 12 & 63] + base64Characters[a >> 6 & 63] + base64Characters[a & 63];
  }
  return output;
}

},{}],8:[function(require,module,exports){
/*
 Particle Emitter
	Based on Parcycle: by Mr Speaker - www.mrspeaker.net
	which is based on the code from 71squared.com iPhone tutorials

  Modified:
    forcePoints to push and pull particles
    wind function
    render particle method
*/



/* Vector Helper */
var vector_create=function( x, y ){
    return {x:x || 0,y: y || 0,
    	scale: function(s) { this.x *= s; this.y *= s},
    	add: function(v) {this.x += v.x; this.y += v.y},
    	sub: function(v) {this.x -= v.x; this.y -= v.y}
//    	,len2: function() {return sq(this.x)+sq(this.y)}
    }
},

vector_multiply= function( vector, scaleFactor ){
    return vector_create(vector.x * scaleFactor,
            vector.y * scaleFactor);
},
vector_add = function( vector1, vector2 ){
    return vector_create(vector1.x + vector2.x,
            vector1.y + vector2.y);
},
vector_sub = function (vector1, vector2) {
    return vector_create(vector1.x - vector2.x,
            vector1.y - vector2.y);
},
//vector_len2= function(vector) {
//    return sq(vector.x) + sq(vector.y);
//}
rgba = function(arr, alphaOverride) {
	return "rgba("+[  minmax(0,U8, arr[ 0 ]|0),
                      minmax(0,U8, arr[ 1 ]|0),
                      minmax(0,U8, arr[ 2 ]|0),
                      minmax(0,1, alphaOverride!=undefined? alphaOverride : arr[ 3 ].toFixed(2))].join(',') + ")";
},

// Individual particle
Particle = function() {
	return {
		// really everything is overwritten - no need setting defaults
	    position: vector_create()
//	    direction: [0,0],
//	    size: 0,
//	    sizeSmall: 0,
//	    timeToLive: 0,
//	    color: [],
//	    drawColor: "",
//	    deltaColor: []
//	    deltaSize: 0,
//	    sharpness: 0,
	}
},


ParticlePointEmitter = function(maxParticles, options) {
	var res = {
			// options will override these defaults, no need to set them
//	    particles: null,
//	    maxParticles: null,

	// Default Properties

//	    size: 30,          // initial size of particle
//	    sizeRandom: 12,

//	    speed: 6,         // initial speed of particle
//	    speedRandom: 2,

//	    angle: 0,        // initial direction of particle (degrees)
//	    angleRandom: 180,

//	    lifeSpan: 8,     // lifetime of particle + used as indication of frequently to emit particles
//	    lifeSpanRandom: 6,

//	    startColor: [ 220, 208, 88, 1 ],          // color at begining of lifetime
//	    startColorRandom: [ 52, 55, 58, 0 ],
//	    finishColor: [ 255, 45, 10, 0 ],		  // color at end of lifetime
//	    finishColorRandom: [ 40, 40, 40, 0 ],
		colorEdge: 0,						  // color at edge of particle "ball" - must be zero alpha,  false for same as color
//	    sharpness: 35,							  // how sharp (percent) will the particle "ball" be (0 - very fuzzy)
//	    sharpnessRandom: 12,

//	    forcePoints: 0, // pairs of weight and location.  positive weight attracts, negative weight pushes
	    wind: 0, // function returning value of wind - can change over time
	    area: 0.3, // used to calculate wind affect

	    updateParticle: function() {},
	    renderParticle: function(context, p) {
            var size = p.size,
				halfSize = size >> 1,
				x = p.position.x|0,
				y = p.position.y|0,
				radgrad = context.createRadialGradient( x, y, p.sizeSmall, x, y, halfSize);
			radgrad.addColorStop( 0, p.drawColor );
			radgrad.addColorStop( 1, p.drawColorEdge );
			context.fillStyle = radgrad;
		  	context.fillRect( x-halfSize, y-halfSize, size, size );
	    },


	    init: function(maxParticles, options) {
			this.setOptions({
		        maxParticles: maxParticles,
		        particles: [],
		        graveyard: [],
		        active: false,

		//        this.position = vector_create(300, 300);
		        positionRandom:  vector_create(0, 0),
		        gravity:  vector_create( 0.0, 0.3),

		        elapsedTime: 0, // used to count active time - only when duration > 0
		        duration: -1,   // autostop the emitter after this duration (-1 = infinity)
		        emissionRate:0,
		        emitCounter: 0,

		        lifeSpanRandom: 0,
		        angleRandom: 0,
		        sizeRandom: 0,
		        speedRandom: 0,
		        sharpnessRandom: 0,

				emitCounter: 0
			})
	        this.setOptions(options || {})
		},

	    setOptions: function(options) {
	        for (var k in options) {
	            this[k] = options[k];
	        }
	        if (!this.finishSize) {
	        	this.finishSize = this.size;
	        }
	        if (!this.emissionRate) {
	        	this.emissionRate = this.maxParticles / this.lifeSpan;
	        }
	        if (this.colorEdge) {
	        	this.colorEdge = rgba(this.colorEdge)
	        }
	    },


		addParticle: function(x,y){
			if(this.particles.length >= this.maxParticles) {
				return null;
			}

			// Take the next particle out of the particle pool we have created and initialize it

			var particle = this.graveyard.shift() || Particle();
			this.initParticle( particle,x || this.position.x, y || this.position.y);
	        this.particles.push(particle);
			return particle;
		},

		initParticle: function( particle, x, y ){

			particle.position.x = x + this.positionRandom.x * rndab(-1,1);
			particle.position.y = y + this.positionRandom.y * rndab(-1,1);

			var newAngle = (this.angle + this.angleRandom * rndab(-1,1) ) * ( PI / 180 ); // convert to radians
			var vector = vector_create(Math.cos( newAngle ), sin( newAngle ));
			var vectorSpeed = this.speed + this.speedRandom * rndab(-1,1);
			particle.direction = vector_multiply( vector, vectorSpeed );

			particle.size = this.size + this.sizeRandom * rndab(-1,1);
			particle.size = particle.size <= 1 ? 1 : particle.size|0;
			particle.finishSize = this.finishSize + this.sizeRandom * rndab(-1,1);

			particle.area = this.area;
			particle.timeToLive = this.lifeSpan + this.lifeSpanRandom * rndab(-1,1);

			particle.sharpness = this.sharpness + this.sharpnessRandom * rndab(-1,1);
			particle.sharpness = particle.sharpness > 100 ? 100 : particle.sharpness < 0 ? 0 : particle.sharpness;
			// internal circle gradient size - affects the sharpness of the radial gradient
			particle.sizeSmall = ( particle.size / 200 ) * particle.sharpness|0; //(size/2/100)

			if (this.startColor) {
				var start = [
					this.startColor[ 0 ],
					this.startColor[ 1 ],
					this.startColor[ 2 ],
					this.startColor[ 3 ]
				];
				if (this.startColorRandom) {
					var that = this;
					range(4, function(j) {start[j] += that.startColorRandom[ j ] * rndab(-1,1) })
				}

				if (this.finishColor) {
					var end = [
						this.finishColor[ 0 ] + this.finishColorRandom[ 0 ] * rndab(-1,1),
						this.finishColor[ 1 ] + this.finishColorRandom[ 1 ] * rndab(-1,1),
						this.finishColor[ 2 ] + this.finishColorRandom[ 2 ] * rndab(-1,1),
						this.finishColor[ 3 ] + this.finishColorRandom[ 3 ] * rndab(-1,1)
					];
					particle.deltaColor = [
					                       ( end[ 0 ] - start[ 0 ] ) / particle.timeToLive,
					                       ( end[ 1 ] - start[ 1 ] ) / particle.timeToLive,
					                       ( end[ 2 ] - start[ 2 ] ) / particle.timeToLive,
					                       ( end[ 3 ] - start[ 3 ] ) / particle.timeToLive];
				}


			    particle.color = start;
			    if (DBG && isNaN(particle.color[ 2 ]) ) {
			    	console.log("Error");
			    }
			}
        	particle.deltaSize = (particle.finishSize - particle.size) / particle.timeToLive;
		},

		update: function( delta ){
	        delta = delta/31;
			if( this.active && this.emissionRate > 0 ){
				var rate = 1 / this.emissionRate;
				this.emitCounter += delta;
				while( this.particles.length < this.maxParticles && this.emitCounter > rate ){
					this.addParticle();
					this.emitCounter -= rate;
				}
				if( this.duration != -1) {
					this.elapsedTime += delta;
					if (this.duration < this.elapsedTime ){
						this.stopParticleEmitter();
					}
				}
			}

	        var that = this;
	        each(this.particles, function(currentParticle, particleIndex) {

				// If the current particle is alive then update it
				if( currentParticle.timeToLive > 0 ){

					// Calculate the new direction based on gravity
	                if (that.gravity)
					    currentParticle.direction = vector_add( currentParticle.direction, that.gravity );

	                // wind speed - only horizontal
	                if (that.wind) {
	                	currentParticle.direction.x += windForce(that.wind(currentParticle),
	                											 currentParticle.direction.x,
	                											 currentParticle.area);
	                }

//	                if (that.forcePoints) {
//		                for (var i=0; i<that.forcePoints.length; i++) {
//		                    var fp = that.forcePoints[i];
//		                    var weight = fp[0];
//		                    var location = fp[1];
//		                    var dir = vector_sub(currentParticle.position, location);
//		//                    var dist = vector_len(dir);
//		//                    if (dist == 0) {
//		//                        continue;
//		//                    }
//		                    // todo: force may depend on dist (ie. farther is weaker or other)
//		                    var force = vector_multiply(dir, weight/**1/dist*/);
//		                    currentParticle.direction = vector_add( currentParticle.direction, force);
//		                }
//	                }
					currentParticle.position.add( currentParticle.direction );
					currentParticle.timeToLive -= delta;

					// allow extenrnal update - set timeTolive to zero if particle should die
					that.updateParticle(currentParticle, particleIndex);
				}

				if( currentParticle.timeToLive > 0 ){

					currentParticle.size += currentParticle.deltaSize * delta;
					currentParticle.sizeSmall =  ( currentParticle.size / 200 ) * currentParticle.sharpness |0; //(size/2/100)

					// Update colors based on delta
					if (currentParticle.deltaColor) {
						currentParticle.color[ 0 ] += ( currentParticle.deltaColor[ 0 ] * delta );
						currentParticle.color[ 1 ] += ( currentParticle.deltaColor[ 1 ] * delta );
						currentParticle.color[ 2 ] += ( currentParticle.deltaColor[ 2 ] * delta );
						currentParticle.color[ 3 ] += ( currentParticle.deltaColor[ 3 ] * delta );
					}
//	                if (isNaN(a) ) {
//	                    console.log("Error");
//	                }
					if (currentParticle.color) {
						currentParticle.drawColorEdge = that.colorEdge || rgba(currentParticle.color,0);
						currentParticle.drawColor = rgba(currentParticle.color);
					}
				} else {
					that.particles.splice(particleIndex,1);
					that.graveyard.push(currentParticle);
				}
	        });
		},

		stopParticleEmitter: function(){
			this.active = false;
			this.elapsedTime = 0;
			this.emitCounter = 0;
		},

		renderParticles: function( context ){
			var that = this;
	        each(this.particles, function(particle, particleIndex) {
	        	that.renderParticle(context, particle);
	            //context.arc(x,y, halfSize, Math.PI*2, false);
			});
		}
	}
	res.init(maxParticles, options);
	return res;
}

module.exports = {
  ParticlePointEmitter: ParticlePointEmitter,

}

},{}],9:[function(require,module,exports){
var camera = require('./camera');
var KEYS = require('./input');
var stickman = require('./stickman');

(function() {

// private:
  var x=0, y=0,
    vx=0,vy=0,
    onGround= 1,
    WIDTH=15, HEIGHT=25,
    totalElapsed=0,
    curAnim,
    run = stickman.animations.run,
    direction=0,
    stand = stickman.animations.stand;


function setAnim(anim) {
  if (anim != curAnim) {
    curAnim = anim;
    totalElapsed = 0;
  }
}

// public
module.exports = {


  update: function(world, elapsed) {
    var step = world.cellSize/60;

    totalElapsed += elapsed;
    // update speed
    /*if (KEYS[40]) {
      vy += step;
      vy = Math.min(vy, world.cellSize);
    }
    else*/ if (KEYS[38]) { // UP
      if (onGround) {
        vy -= world.jumpFromGround;
      }
      else {
        vy -= world.jumpFromAir;
      }
      vy = Math.max(vy, -world.maxSpeedY);

    }
    vy += world.gravity;
    vy = Math.min(vy, world.maxSpeedY);

    if (KEYS[39]) { // RIGHT
      vx += step;
      vx = Math.min(vx, world.maxSpeedX);
      setAnim(run);
      direction = 0;
    }
    else if (KEYS[37]) {  // LEFT
      vx -= step;
      vx = Math.max(vx, -world.maxSpeedX);
      setAnim(run);
      direction = 1;
    }
    else {
      vx *= .2;
      if (Math.abs(vx) < 0.01) {
        vx = 0;
        if (onGround) {
          setAnim(stand);
        }
      }
    }

    // COLLISION DETECTION

    // find maze cell for collision check
    // initially checking Y collision, use smaller X
    var cellXLeft = Math.floor((x+vx+2) / world.cellSize),
      cellXRight = Math.floor((WIDTH-3+x+vx) / world.cellSize),
      cellYTop = Math.floor((y+vy) / world.cellSize),
      cellYBottom = Math.floor((HEIGHT+y+vy) / world.cellSize);


    onGround = 0;
    if (vy > 0) {
      //moving down
      if (!world.maze.get(cellXLeft, cellYBottom) || !world.maze.get(cellXRight, cellYBottom)) {
          // collided down, move to closest to top edge of cell
        y = cellYBottom * world.cellSize - HEIGHT;
        vy = 0;
        onGround = 1;
      }
    }
    else if (vy < 0) {
      if (!world.maze.get(cellXLeft, cellYTop) || !world.maze.get(cellXRight, cellYTop)) {
          // collided up, move to bottom edge of cell
        y = (cellYTop+1)*world.cellSize;
        vy = 0;
      }
    }

    // checking X collision, use smaller Y
    var cellXLeft = Math.floor((x+vx) / world.cellSize),
      cellXRight = Math.floor((WIDTH+x+vx) / world.cellSize),
      cellYTop = Math.floor((y+vy+2) / world.cellSize),
      cellYBottom = Math.floor((HEIGHT-1+y+vy-2) / world.cellSize);

    if (vx > 0) {
      //moving right
      if (!world.maze.get(cellXRight, cellYTop) || !world.maze.get(cellXRight, cellYBottom)) {
          // collided right, move to closest to left edge of cell
        x = cellXRight * world.cellSize - WIDTH-1;
        vx = 0;
        if (KEYS[39] && vy > 0) {
          //collided with wall, moving down, pressing left = slide down walls
          vy *= world.wallFriction;
          if (Math.random() < world.chanceJumpWall) {  // small chance to be "onGround" and be able to jump
            onGround = true;
          }
        }
      }
    }
    else if (vx < 0) {
      if (!world.maze.get(cellXLeft, cellYTop) || !world.maze.get(cellXLeft, cellYBottom)) {
          // collided left, move to right edge of cell
        x = (cellXLeft+1)*world.cellSize+1;
        vx = 0;
        if (KEYS[37] && vy > 0) {
          //collided with wall, moving down = slide down walls
          vy *= world.wallFriction;
          if (Math.random() < world.chanceJumpWall) {
            onGround = true;
          }
        }
      }
    }

    if (!onGround) {
      if (vy > 0) {
        setAnim(stickman.animations.fall);
      }
      else {
        setAnim(stickman.animations.jump);
      }
    }

    x += vx;
    y += vy;
    if (KEYS[83]) {
      camera.scale = Math.min(camera.scale + 0.05, 5);
    }
    if (KEYS[65]) {
      camera.scale = Math.max(camera.scale - 0.05, 0.5);
    }
    camera.setTarget(x,y);

  },

  draw: function(ctx,dt) {
    if (onGround) {
      ctx.fillStyle = "#ff0";
    }
    else {
      ctx.fillStyle = "#0f0";
    }
    ctx.save()
    // ctx.translate(x,y)
    // ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ctx.translate(WIDTH/2, HEIGHT);
    ctx.translate(x+WIDTH/2, y+HEIGHT);
    ctx.scale(0.15,0.15);
    ctx.lineWidth = 15;
    ctx.lineJoin = 'bevel';

    if (direction) {
      ctx.scale(-1,1);
    }

    curAnim.render(ctx, totalElapsed);
    ctx.restore()
  }
}
})();

},{"./camera":3,"./input":6,"./stickman":12}],10:[function(require,module,exports){
// Holds last iteration timestamp.
var time = 0;

/**
 * Calls `fn` on next frame.
 *
 * @param  {Function} fn The function
 * @return {int} The request ID
 * @api private
 */
function raf(fn) {
  return window.requestAnimationFrame(function() {
    var now = Date.now();
    var elapsed = now - time;

    if (elapsed > 999) {
      elapsed = 1 / 60;  // elapsed too much - probably tab switched so animation paused
    } else {
      elapsed /= 1000;
    }

    time = now;
    fn(elapsed);
  });
}

module.exports = {
  /**
   * Calls `fn` on every frame with `elapsed` set to the elapsed
   * time in milliseconds.
   *
   * @param  {Function} fn The function
   * @return {int} The request ID
   * @api public
   */
  start: function(fn) {
    return raf(function tick(elapsed) {
      fn(elapsed);
      raf(tick);
    });
  },
  /**
   * Cancels the specified animation frame request.
   *
   * @param {int} id The request ID
   * @api public
   */
  stop: function(id) {
    window.cancelAnimationFrame(id);
  }
};

},{}],11:[function(require,module,exports){
module.exports = function(seed) {
  var random = Math.random//whrandom(seed);
  var rng = {
    /**
     * Return an integer within [0, max).
     *
     * @param  {int} [max]
     * @return {int}
     * @api public
     */
    int: function(max) {
      return random() * (max || 0xfffffff) | 0;
    },
    /**
     * Return a float within [0.0, 1.0).
     *
     * @return {float}
     * @api public
     */
    float: function() {
      return random();
    },
    /**
     * Return a boolean.
     *
     * @return {Boolean}
     * @api public
     */
    bool: function() {
      return random() > 0.5;
    },
    /**
     * Return an integer within [min, max).
     *
     * @param  {int} min
     * @param  {int} max
     * @return {int}
     * @api public
     */
    range: function(min, max) {
      return rng.int(max - min) + min;
    },
    /**
     * Pick an element from the source.
     *
     * @param  {mixed[]} source
     * @return {mixed}
     * @api public
     */
    pick: function(source) {
      return source[rng.int(source.length)];
    }
  };

  return rng;
};

// /**
//  * Generate a seeded random number using Python's whrandom implementation.
//  * See https://github.com/ianb/whrandom for more information.
//  *
//  * @param  {int} [seed]
//  * @return {Function}
//  * @api private
//  */
// function whrandom(seed) {
//   if (!seed) {
//     seed = Date.now();
//   }
//
//   var x = (seed % 30268) + 1;
//   seed = (seed - (seed % 30268)) / 30268;
//   var y = (seed % 30306) + 1;
//   seed = (seed - (seed % 30306)) / 30306;
//   var z = (seed % 30322) + 1;
//   seed = (seed - (seed % 30322)) / 30322;
//
//   return function() {
//     x = (171 * x) % 30269;
//     y = (172 * y) % 30307;
//     z = (170 * z) % 30323;
//     return (x / 30269.0 + y / 30307.0 + z / 30323.0) % 1.0;
//   };
// }

},{}],12:[function(require,module,exports){

/*******************************************************************************
.*........HeadEnd.
.*..........|.
.*.......HeadStart.
.*..........|.
.*......E---A---Elbow---Hand.
.*......|...|.
.*......H...|.
.*..........B.
.*........./.\.
.*........K.Knee.
.*........|...|.
.*........F..FootStart-FootEnd
 *
 *
 * Stickfigure data:  array of x,y pairs in this order:
 *
 * [A,															index:  0,1
 * Head,Head-End, 												  2,3,   4,5
 * Elbow1,Hand1,													  6,7,   8,9
 * Elbow2,Hand2,													  10,11, 12,13
 * B,																				14,15
 * Knee1,FootStart,FootEnd,								  16,17, 18,19, 20,21
 * Knee2,Foot2Start, Foot2End]						  22,23, 24,25, 26,27
 ******************************************************************************/

function StickMan() {
	this.animations = {};
}

StickMan.prototype.add = function(key, duration,  frames, flip, repeat) {
	this.animations[key] = new StickAnimation(duration,  frames, flip, repeat);
};


function StickAnimation(duration, frames, flip, repeat) {
  this.duration = duration;
	this.repeat = repeat;
	//this.frames = frames;
	// duplicate frames with flip arms and legs
	if (flip) {
		this.frames = frames.slice();
		for (var i=0; i<frames.length; i++) {
			var frame = frames[i];
			var newFrame = frame.slice();
			for (var k=6; k<10; k++) {
				newFrame[k] = frame[k+4]; // switch hands
				newFrame[k+4] = frame[k];
				newFrame[k+10] = frame[k+16];
				newFrame[k+16] = frame[k+10];
			}
			newFrame[20] = frame[26];
			newFrame[21] = frame[27];
			newFrame[26] = frame[20];
			newFrame[27] = frame[21];
			this.frames.push(newFrame)
		}
	}
	else {
		this.frames = frames;
	}
}


function linearMix(frame1, frame2, fraction) {
	var result = [];
	var frac1 = 1-fraction;
	for (var i=0; i<frame1.length; i++) {
		result.push(frame1[i]*frac1 +  frame2[i]*fraction);
	}
	return result;
}

// StickAnimation.prototype.getOffset = function(elapsed) {
// 	return this.width*elapsed/this.duration;
// }

// var lastFrame = -1;
StickAnimation.prototype.render = function(ctx, elapsed) {
	var anim = this;
	var duration = anim.duration;
	ctx.save();

	var frames = anim.frames;
	var frame;
	if (this.repeat || elapsed < duration) {
		var durationPerFrame = duration/frames.length;

		var frame1 = ((elapsed / durationPerFrame)|0)% frames.length;
		var frame2 = (frame1+1) % frames.length;

	  // if (frame1 != lastFrame) {
		// 	console.log("frame1 = "+frame1);
		// 	lastFrame = frame1;
		// }
		var partialElapsed = elapsed % durationPerFrame;

		frame = linearMix(frames[frame1], frames[frame2],
				partialElapsed/durationPerFrame);
	}
	else {
		// not repeat and past duration - stuck on final frame
		frame = frames[frames.length-1];
	}


	var moveTo = function(i) {
		ctx.moveTo(frame[2*i], frame[2*i+1]);
	}
	var lineTo = function(i) {
		ctx.lineTo(frame[2*i], frame[2*i+1]);
	}

//	ctx.lineCap = "round";

	ctx.strokeStyle = "#222299";
  ctx.beginPath();
	moveTo(0);  // A
	lineTo(5);  // Elbow 2
	lineTo(6);  // hand 2

	moveTo(7); // B
	lineTo(11); // Knee2
	lineTo(12); // Foot2 start
	lineTo(13); // Foot2 end
	ctx.stroke();

	ctx.strokeStyle = "#4444bb";
	ctx.beginPath();
	moveTo(0); // A
	lineTo(1); // HeadStart
	var centerHead = [(frame[2]+frame[4])/2, (frame[3]+frame[5])/2];
	var frame0 = frames[0];
	var radiusHead = Math.hypot(frame0[2]-frame0[4], frame0[3]-frame0[5])/2;
	ctx.arc(centerHead[0], centerHead[1], radiusHead, 0.5*Math.PI,  2.5* Math.PI, false);
//	ctx.lineTo(frame[4], frame[5]);
  moveTo(0);
  lineTo(7); // B
	ctx.stroke();

	ctx.strokeStyle = "#6666dd";
  ctx.beginPath();
	moveTo(0);  // A
	lineTo(3);  // Elbow
	lineTo(4);  // Hand

	moveTo(7); // B
	lineTo(8); // Knee1
	lineTo(9); // Foot1 start
	lineTo(10); // Foot1 end

	ctx.stroke();
	ctx.restore();


};



var sm = new StickMan();

sm.add('run',
				0.6, // seconds for walk cycle
				require('./tools/run'), true, true)

sm.add('stand', 3.2, require('./tools/stand'), true, true);
sm.add('jump', 1.2, require('./tools/jump'), false, false);
sm.add('fall', 2.4, require('./tools/fall'), false, false);

module.exports = sm;

},{"./tools/fall":13,"./tools/jump":14,"./tools/run":15,"./tools/stand":16}],13:[function(require,module,exports){
module.exports = [ // 2 frames generated from fall.svg
[  // frame 0
         -6, -138  // A
    ,   -11, -153  // HeadStart
    ,   -19, -180  // HeadEnd
    ,   -29, -165  // Elbow1
    ,   -35, -207  // Hand1
    ,     0, -172  // Elbow2
    ,   -14, -209  // Hand2
    ,     7, -100  // B
    ,    20, -80   // Knee1
    ,    26, -45   // Foot1Start
    ,    36, -70   // Foot1End
    ,    31, -121  // Knee2
    ,    34, -86   // Foot2Start
    ,    46, -101  // Foot2End
], [  // frame 1
          5, -113  // A
    ,     9, -130  // HeadStart
    ,    14, -157  // HeadEnd
    ,   -21, -130  // Elbow1
    ,    -7, -170  // Hand1
    ,    35, -124  // Elbow2
    ,    40, -159  // Hand2
    ,    -4, -67   // B
    ,    13, -38   // Knee1
    ,    20, 0     // Foot1Start
    ,    33, -19   // Foot1End
    ,    34, -55   // Knee2
    ,    30, -22   // Foot2Start
    ,    46, -39   // Foot2End
]]

},{}],14:[function(require,module,exports){
module.exports = [ // 2 frames generated from jump.svg
[  // frame 0
          9, -121  // A
    ,    13, -137  // HeadStart
    ,     6, -159  // HeadEnd
    ,    41, -119  // Elbow1
    ,    42, -155  // Hand1
    ,    36, -138  // Elbow2
    ,    24, -172  // Hand2
    ,    -9, -75   // B
    ,   -10, -42   // Knee1
    ,   -27, -18   // Foot1Start
    ,   -15, 0     // Foot1End
    ,    33, -90   // Knee2
    ,     7, -65   // Foot2Start
    ,    -1, -44   // Foot2End
], [  // frame 1
          4, -186  // A
    ,     9, -205  // HeadStart
    ,    17, -227  // HeadEnd
    ,    34, -207  // Elbow1
    ,    18, -236  // Hand1
    ,    39, -200  // Elbow2
    ,    27, -239  // Hand2
    ,    -3, -143  // B
    ,    -6, -111  // Knee1
    ,   -28, -86   // Foot1Start
    ,   -27, -65   // Foot1End
    ,    30, -160  // Knee2
    ,    14, -121  // Foot2Start
    ,    31, -100  // Foot2End
]]

},{}],15:[function(require,module,exports){
module.exports = [ // 6 frames generated from run.svg
[  // frame 0
         13, -136  // A
    ,    19, -149  // HeadStart
    ,    23, -172  // HeadEnd
    ,   -19, -142  // Elbow1
    ,   -47, -115  // Hand1
    ,    19, -100  // Elbow2
    ,    41, -109  // Hand2
    ,   -13, -89   // B
    ,    15, -48   // Knee1
    ,    43, -3    // Foot1Start
    ,    58, -18   // Foot1End
    ,   -33, -48   // Knee2
    ,   -60, -80   // Foot2Start
    ,   -76, -64   // Foot2End
], [  // frame 1
         12, -123  // A
    ,    15, -135  // HeadStart
    ,    21, -158  // HeadEnd
    ,   -25, -107  // Elbow1
    ,   -45, -72   // Hand1
    ,    21, -81   // Elbow2
    ,    46, -88   // Hand2
    ,   -11, -66   // B
    ,    29, -40   // Knee1
    ,    10, -4    // Foot1Start
    ,    32, -3    // Foot1End
    ,   -13, -26   // Knee2
    ,   -45, -44   // Foot2Start
    ,   -64, -37   // Foot2End
], [  // frame 2
         12, -127  // A
    ,    17, -139  // HeadStart
    ,    23, -162  // HeadEnd
    ,   -12, -98   // Elbow1
    ,   -21, -56   // Hand1
    ,     3, -97   // Elbow2
    ,    25, -71   // Hand2
    ,   -11, -74   // B
    ,     1, -39   // Knee1
    ,   -14, -2    // Foot1Start
    ,     5, -3    // Foot1End
    ,    10, -45   // Knee2
    ,   -20, -35   // Foot2Start
    ,   -31, -18   // Foot2End
], [  // frame 3
         15, -137  // A
    ,    20, -151  // HeadStart
    ,    24, -173  // HeadEnd
    ,     1, -103  // Elbow1
    ,    28, -84   // Hand1
    ,   -11, -112  // Elbow2
    ,    -3, -77   // Hand2
    ,   -14, -84   // B
    ,   -21, -44   // Knee1
    ,   -50, -15   // Foot1Start
    ,   -31, -1    // Foot1End
    ,    24, -68   // Knee2
    ,     1, -37   // Foot2Start
    ,    12, -18   // Foot2End
], [  // frame 4
         13, -144  // A
    ,    20, -159  // HeadStart
    ,    24, -181  // HeadEnd
    ,     5, -105  // Elbow1
    ,    38, -96   // Hand1
    ,   -19, -123  // Elbow2
    ,   -14, -86   // Hand2
    ,   -12, -98   // B
    ,   -42, -57   // Knee1
    ,   -79, -22   // Foot1Start
    ,   -71, 0     // Foot1End
    ,    25, -79   // Knee2
    ,    24, -34   // Foot2Start
    ,    44, -30   // Foot2End
], [  // frame 5
         15, -145  // A
    ,    21, -155  // HeadStart
    ,    29, -179  // HeadEnd
    ,    17, -100  // Elbow1
    ,    50, -103  // Hand1
    ,   -23, -131  // Elbow2
    ,   -33, -92   // Hand2
    ,   -14, -93   // B
    ,   -40, -50   // Knee1
    ,   -91, -48   // Foot1Start
    ,   -98, -24   // Foot1End
    ,    29, -77   // Knee2
    ,    39, -31   // Foot2Start
    ,    61, -40   // Foot2End
]]

},{}],16:[function(require,module,exports){
module.exports = [ // 3 frames generated from stand.svg
[  // frame 0
         12, -126  // A
    ,    17, -138  // HeadStart
    ,    24, -161  // HeadEnd
    ,   -11, -94   // Elbow1
    ,   -14, -56   // Hand1
    ,     2, -93   // Elbow2
    ,    25, -63   // Hand2
    ,   -11, -70   // B
    ,     2, -37   // Knee1
    ,   -13, -2    // Foot1Start
    ,     8, -2    // Foot1End
    ,     9, -38   // Knee2
    ,    -7, -1    // Foot2Start
    ,    10, -2    // Foot2End
], [  // frame 1
         10, -127  // A
    ,    14, -140  // HeadStart
    ,    20, -161  // HeadEnd
    ,    -9, -92   // Elbow1
    ,   -10, -57   // Hand1
    ,     5, -93   // Elbow2
    ,    21, -60   // Hand2
    ,    -9, -72   // B
    ,     2, -35   // Knee1
    ,   -14, -1    // Foot1Start
    ,     2, -2    // Foot1End
    ,     8, -36   // Knee2
    ,    -7, -2    // Foot2Start
    ,    11, -1    // Foot2End
], [  // frame 2
         12, -126  // A
    ,    15, -141  // HeadStart
    ,    24, -161  // HeadEnd
    ,   -10, -90   // Elbow1
    ,    -6, -55   // Hand1
    ,     3, -89   // Elbow2
    ,    15, -59   // Hand2
    ,   -11, -68   // B
    ,     3, -35   // Knee1
    ,   -15, 0     // Foot1Start
    ,     1, -1    // Foot1End
    ,     7, -37   // Knee2
    ,    -5, -2    // Foot2Start
    ,    11, -2    // Foot2End
]]

},{}],17:[function(require,module,exports){


var RNG = {
	setSeed: function(seed) {
	    seed = (seed < 1 ? 1/seed : seed);

	    this._seed = seed;
	    this._s0 = (seed >>> 0) * this._frac;

	    seed = (seed*69069 + 1) >>> 0;
	    this._s1 = seed * this._frac;

	    seed = (seed*69069 + 1) >>> 0;
	    this._s2 = seed * this._frac;

	    this._c = 1;
	    return this;
	},

    _s0: 0,
    _s1: 0,
    _s2: 0,
    _c: 0,
    _frac: 2.3283064365386963e-10 /* 2^-32 */
},

/**
 * @returns {float} Pseudorandom value [0,1), uniformly distributed
 */
rnd= function() {
    var t = 2091639 * RNG._s0 + RNG._c * RNG._frac;
    RNG._s0 = RNG._s1;
    RNG._s1 = RNG._s2;
    RNG._c = t | 0;
    RNG._s2 = t - RNG._c;
    return RNG._s2;
}


RNG.setSeed(5)

module.exports = {
	range: function(maxInt,iterFu) {
    for (var i=0; i<maxInt; i++)
        iterFu(i)
	},
// breaking-range - will return non-false value from iterator and break the loop
	brrange: function(maxInt,iterFu) {
    for (var i=0; i<maxInt; i++) {
        var res = iterFu(i)
        if (res) return res;
    }
	},
// return non-false value from iterator will break the loop
	each: function(collection, iterFu) {
	// looping from end to start - to allow easy removal of iterated element without skipping
    for (var i=collection.length-1; i>=0; i--) {
        var $=collection[i];
        if (iterFu($,i)) {
        	return;
        }
    }
	},

	minmax: function(mn, mx, v) { return min(mx, max(mn, v))},

	duRange: function(w,h, fu) {
		for (var y=0; y<h; y++)
			for (var x=0; x<w; x++)
				fu(x,y);
	},
};
// createCanvas = function(w,h) {
// 	  var c = DC.createElement('canvas');
// 	  c.width = w || WIDTH;
// 	  c.height = h || HEIGHT;
// 	  return c;
// 	},
//
// avg = function(a,b) { return (a+b)/2 },
//
// // LAYERS
// canvases = [],
// contexts = [],
//
//
// Ctx = function(canvas) {
// 	return canvas.getContext('2d')
// },
//
// DC = document;
//
// DC.getElementById('overlay').style.width = WIDTH+"px";
// DC.getElementById('overlay').style.left = (-WIDTH>>1)+"px";
//
// var cont =  DC.getElementById('canvas_cont');
// range(6, function(i) {
//    var canvas = (i==5) ? createCanvas(innerWidth, innerHeight) : createCanvas();
//    if (i==5) {
// 	   canvas.style.left = '0px';
// 	   canvas.style.top = '0px';
// 	   canvas.style['margin-left'] = '0px';
// 	   canvas.style['margin-top'] = '0px';
//    }
//    else {
// 	   canvas.style.left = (-WIDTH>>1)+'px';
//    }
//    cont.appendChild(canvas);
//    canvases.push(canvas);
//    contexts.push(Ctx(canvas))
// });
//
//  // current canvas to draw to - may toggle around for double buffering
//
// var skyCtx = contexts[0],
// skySpritesCtx = contexts[1],
// mountainCtx = contexts[2],
// spritesCtx = contexts[3],
// waterCtx = contexts[4],
// overlayCtx = contexts[5],
// overlayCanv = canvases[5],
//
//
// abs = Math.abs,
// min = Math.min,
// max = Math.max,
// sin= Math.sin,
// round = Math.round,
// sqrt=Math.sqrt,
// sq=function(x){return x*x},
// U8 = 255, // max unsigned 8bit
// PI = Math.PI,
// TPI = 2*PI,
//
//
// // random in range [0,a)
// rnda = function(a) { return rnd()*a},
// // random integer in range [0,a-1]
// irnda = function(a) { return rnda(a)|0},
// // random in range [a,b)
// rndab = function(a,b) { return a+rnda(b-a)},
// // random integer in range [a,b-1]
// irndab = function(a,b) { return rndab(a,b)|0 },
//
//
// // polyfill RequestAnimFrame
// suffix = 'equestAnimationFrame',
// RQ= window['r'+suffix] || window['mozR'+suffix] || window['webkitR'+suffix];
// if (!RQ) {
//     var lastTime = 0;
//     RQ = function(callback) {
//         var currTime = Date.now();
//         var timeToCall = max(0, 16 - (currTime - lastTime));
//         var id = window.setTimeout(function() { callback(currTime + timeToCall); },
//             timeToCall);
//         lastTime = currTime + timeToCall;
//     }
// }

if (false) {
	window.onerror = function(errorMsg, url, lineNumber) {
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			alert("Error occured: " + errorMsg+"  at line:"+lineNumber);
		}
		console.warn("Error: "+errorMsg+"\n URL: "+ url+"\n Line: "+lineNumber);
	    return false;
	}
	window.savePng = function(c) {
		document.location.href =  c.toDataURL('image/png').replace("image/png", "image/octet-stream")
	}
	window.globalDetect = function() {
		if (window.standard_globals) {
			var _keys = {}
			for (var i=0; i<standard_globals.length; i++) {
				_keys[standard_globals[i]] = 1;
			}
			for (var k in window) {
				if (!_keys[k]) {
					console.log("Leak: ",k);
				}
			}
		}
		else {
			var _keys = [];
			for (var k in window) {
				_keys.push('"'+k+'"');
			}
			console.log("standard_globals = ["+_keys.join(", ")+"]")
		}
	}
}

// // get img data from
// var getPixels= function(ctx) {
//   return ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
// },
//
//
// render2pixels=function(width, height, renderFunction) {
// 	var canvas = createCanvas(width, height),
// 		ctx=Ctx(canvas),
// 		imgData=getPixels(ctx),
// 	    d = imgData.data;
// 	renderFunction(d,ctx,canvas);
//     ctx.putImageData(imgData,0,0);
// 	return canvas;
// },
//
// drawImg = function(ctx, img, x,y) {
// 	ctx.drawImage(img, x,y, img.width, img.height);
// },
//
//
//
// initQueue = [],
// initFu = function(text, pg, fu) {
// 	initQueue.push([text,pg,fu])
// }

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL2lmdGFoL2RldmVsL2pzMTNfMjAxNS9qczEzXzIwMTUvc3JjL2F1ZGlvLmpzIiwiL1VzZXJzL2lmdGFoL2RldmVsL2pzMTNfMjAxNS9qczEzXzIwMTUvc3JjL2NhbWVyYS5qcyIsIi9Vc2Vycy9pZnRhaC9kZXZlbC9qczEzXzIwMTUvanMxM18yMDE1L3NyYy9kZnNfbWF6ZV9nZW4uanMiLCIvVXNlcnMvaWZ0YWgvZGV2ZWwvanMxM18yMDE1L2pzMTNfMjAxNS9zcmMvZnBzY291bnRlci5qcyIsIi9Vc2Vycy9pZnRhaC9kZXZlbC9qczEzXzIwMTUvanMxM18yMDE1L3NyYy9pbnB1dC5qcyIsIi9Vc2Vycy9pZnRhaC9kZXZlbC9qczEzXzIwMTUvanMxM18yMDE1L3NyYy9qc2Z4ci5qcyIsIi9Vc2Vycy9pZnRhaC9kZXZlbC9qczEzXzIwMTUvanMxM18yMDE1L3NyYy9wYXJ0aWNsZS5qcyIsIi9Vc2Vycy9pZnRhaC9kZXZlbC9qczEzXzIwMTUvanMxM18yMDE1L3NyYy9wbGF5ZXIuanMiLCIvVXNlcnMvaWZ0YWgvZGV2ZWwvanMxM18yMDE1L2pzMTNfMjAxNS9zcmMvcmFmLmpzIiwiL1VzZXJzL2lmdGFoL2RldmVsL2pzMTNfMjAxNS9qczEzXzIwMTUvc3JjL3JuZy5qcyIsIi9Vc2Vycy9pZnRhaC9kZXZlbC9qczEzXzIwMTUvanMxM18yMDE1L3NyYy9zdGlja21hbi5qcyIsIi9Vc2Vycy9pZnRhaC9kZXZlbC9qczEzXzIwMTUvanMxM18yMDE1L3NyYy90b29scy9mYWxsLmpzIiwiL1VzZXJzL2lmdGFoL2RldmVsL2pzMTNfMjAxNS9qczEzXzIwMTUvc3JjL3Rvb2xzL2p1bXAuanMiLCIvVXNlcnMvaWZ0YWgvZGV2ZWwvanMxM18yMDE1L2pzMTNfMjAxNS9zcmMvdG9vbHMvcnVuLmpzIiwiL1VzZXJzL2lmdGFoL2RldmVsL2pzMTNfMjAxNS9qczEzXzIwMTUvc3JjL3Rvb2xzL3N0YW5kLmpzIiwiL1VzZXJzL2lmdGFoL2RldmVsL2pzMTNfMjAxNS9qczEzXzIwMTUvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDak1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXCJzdHJpY3QgbW9kZVwiXG52YXIgcmFmID0gcmVxdWlyZSgnLi9yYWYnKTtcbnZhciBybmcgPSByZXF1aXJlKCcuL3JuZycpO1xudmFyIFBBUlRJQ0xFID0gcmVxdWlyZSgnLi9wYXJ0aWNsZScpO1xuXG5cbnZhciBBVURJTyA9IHJlcXVpcmUoJy4vYXVkaW8nKTtcbnZhciBjYW1lcmEgPSByZXF1aXJlKCcuL2NhbWVyYScpO1xudmFyIHBsYXllciA9IHJlcXVpcmUoJy4vcGxheWVyJyk7XG5yZXF1aXJlKCcuL2Zwc2NvdW50ZXInKTtcblxudmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnYW1lJyk7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbnZhciBNYXplID0gcmVxdWlyZSgnLi9kZnNfbWF6ZV9nZW4nKTtcblxudmFyIGlucHV0ID0gcmVxdWlyZSgnLi9pbnB1dCcpO1xuXG52YXIgcmFuZCA9IHJuZygpO1xuXG52YXIgdG90YWxFbGFwc2VkID0gMDtcblxudmFyIG1hemUgPSBNYXplKDI0LDIwKTtcblxudmFyIHdpZHRoLCBoZWlnaHQsIGhhbGZXaWR0aCwgaGFsZkhlaWdodDtcbndpbmRvdy5vbnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB3aWR0aD1jYW52YXMud2lkdGggPSBpbm5lcldpZHRoO1xuICBoZWlnaHQ9Y2FudmFzLmhlaWdodCA9IGlubmVySGVpZ2h0O1xuICBoYWxmV2lkdGggPSB3aWR0aCA+PiAxO1xuICBoYWxmSGVpZ2h0ID0gaGVpZ2h0ID4+IDE7XG59XG5vbnJlc2l6ZSgpO1xuLypcbnZhciBqZXRwYWNrID0gUEFSVElDTEUuUGFydGljbGVQb2ludEVtaXR0ZXIoMzUwLCB7XG5cdHBvc2l0aW9uOiB2ZWN0b3JfY3JlYXRlKCksXG5cdGFuZ2xlOiA5MCxcblx0YW5nbGVSYW5kb206IDEwLFxuXHRkdXJhdGlvbjogLTEsXG5cdGZpbmlzaENvbG9yOiBbMjAwLCA0NSwgMTAsIDBdLFxuXHRmaW5pc2hDb2xvclJhbmRvbTogWzQwLDQwLDQwLDBdLFxuXHRncmF2aXR5OiB2ZWN0b3JfY3JlYXRlKDAsLjAzKSxcblx0bGlmZVNwYW46IDEsXG5cdHBvc2l0aW9uUmFuZG9tOiB2ZWN0b3JfY3JlYXRlKDQsNiksXG5cdHNoYXJwbmVzczogMTIsXG5cdHNoYXJwbmVzc1JhbmRvbTogMTIsXG5cdHNpemU6IDMwKlNJWkVfRkFDVE9SfDAsXG5cdGZpbmlzaFNpemU6IDc1KlNJWkVfRkFDVE9SfDAsXG5cdGNvbG9yRWRnZTogWzQwLDIwLDEwLDBdLFxuXHRzaXplUmFuZG9tOiA1KlNJWkVfRkFDVE9SLFxuXHRzcGVlZDogNCpTSVpFX0ZBQ1RPUixcblx0c3BlZWRSYW5kb206IDEqU0laRV9GQUNUT1IsXG5cdGVtaXNzaW9uUmF0ZTogMTQwLFxuXHRzdGFydENvbG9yOiBbMjIwLCAxODgsIDg4LCAxXSxcblx0c3RhcnRDb2xvclJhbmRvbTogWzMyLCAzNSwgMzgsIDBdLFxuXHR1cGRhdGVQYXJ0aWNsZTogZnVuY3Rpb24ocGFydGljbGUpIHtcblxuXHR9LFxuXHR3aW5kOiAwLjEsXG5cdGFyZWE6IDAuMVxufSk7Ki9cblxuXG5cbnZhciB3b3JsZCA9IHtcbiAgY2VsbFNpemU6IDMyLCAvLzIqTWF0aC5taW4oKGNhbnZhcy53aWR0aC0yMCkvNDgsIChjYW52YXMuaGVpZ2h0LTIwKS80MCk7XG4gIG1hemU6IG1hemUsXG4gIGdyYXZpdHk6IDAuNSwgLy8gcmVkdWNlIHNwZWVkIFkgZXZlcnkgdGlja1xuICBtYXhTcGVlZFg6IDYsXG4gIG1heFNwZWVkWTogOCxcbiAganVtcEZyb21Hcm91bmQ6IDcuNSwgLy8gYm9vc3QgdXAgc3BlZWQgd2hlbiBqdW1waW5nIG9mZiBncm91bmRcbiAganVtcEZyb21BaXI6IDAuMSwgLy8gc21hbGxlciBncmF2aXR5IHdoZW4gcHJlc3NpbmcgdXAgZXZlbiBpbiBhaXJcbiAgY2hhbmNlSnVtcFdhbGw6IDAuMiwgIC8vIGNoYW5jZSB0byBiZSBhYmxlIHRvIGp1bXAgZnJvbVxuICB3YWxsRnJpY3Rpb246IDAuNyxcbn1cblxuXG5cbnJhZi5zdGFydChmdW5jdGlvbihlbGFwc2VkKSB7XG5cbiAgLy8gQ2xlYXIgdGhlIHNjcmVlblxuICAvL2N0eC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgY3R4LmZpbGxTdHlsZSA9IFwiIzIyMlwiO1xuICBjdHguZmlsbFJlY3QoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG5cdGN0eC5zYXZlKCk7XG5cbiAgcGxheWVyLnVwZGF0ZSh3b3JsZCwgZWxhcHNlZCk7XG4gIGNhbWVyYS51cGRhdGUoKTtcblxuICBjdHgudHJhbnNsYXRlKGhhbGZXaWR0aCwgaGFsZkhlaWdodCk7IC8vIHpvb20gdG8gbWlkIG9mIHNjcmVlblxuICBjdHguc2NhbGUoY2FtZXJhLnNjYWxlLGNhbWVyYS5zY2FsZSk7XG4gIGN0eC50cmFuc2xhdGUoLWNhbWVyYS5YLCAtY2FtZXJhLlkpOyAvLyB0cmFuc2xhdGUgY2FtZXJhXG4gIC8vbWF6ZSBzaG91bGQgYmUgMjB4IHRoZSB3aWR0aCBvZiB0aGUgY2FudmFzXG5cblxuICBtYXplLmRyYXcoY3R4LCB3b3JsZC5jZWxsU2l6ZSk7XG4gIHBsYXllci5kcmF3KGN0eCk7XG4gIGN0eC5yZXN0b3JlKCk7XG5cblxuXG4gIC8vIGlmIChmbGlwKSB7XG4gIC8vICAgY3R4LnNjYWxlKC0xLDEpO1xuICAvLyB9XG4gIC8vIGlmICgodG90YWxFbGFwc2VkICUgNSkgPiAyLjUpIHtcbiAgLy8gXHRjdHgudHJhbnNsYXRlKDMwMCwwKTtcbiAgLy8gfVxuXG5cdGNoZWNrZnBzKCk7XG59KTtcbiIsInZhciBybmcgPSByZXF1aXJlKCcuL3JuZycpO1xudmFyIGpzZnhyID0gcmVxdWlyZSgnLi9qc2Z4cicpO1xuXG5mdW5jdGlvbiBBcmNhZGVBdWRpbygpIHtcbiAgdGhpcy5zb3VuZHMgPSB7fTtcbn1cblxuQXJjYWRlQXVkaW8ucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKCBrZXksIGNvdW50LCBzZXR0aW5ncyApIHtcbiAgdGhpcy5zb3VuZHNbIGtleSBdID0gW107XG4gIHNldHRpbmdzLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtLCBpbmRleCApIHtcbiAgICB0aGlzLnNvdW5kc1sga2V5IF0ucHVzaCgge1xuICAgICAgdGljazogMCxcbiAgICAgIGNvdW50OiBjb3VudCxcbiAgICAgIHBvb2w6IFtdXG4gICAgfSApO1xuICAgIGZvciggdmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKyApIHtcbiAgICAgIHZhciBhdWRpbyA9IG5ldyBBdWRpbygpO1xuICAgICAgYXVkaW8uc3JjID0ganNmeHIoIGVsZW0gKTtcbiAgICAgIHRoaXMuc291bmRzWyBrZXkgXVsgaW5kZXggXS5wb29sLnB1c2goIGF1ZGlvICk7XG4gICAgfVxuICB9LCB0aGlzICk7XG59O1xuXG5BcmNhZGVBdWRpby5wcm90b3R5cGUucGxheSA9IGZ1bmN0aW9uKCBrZXkgKSB7XG4gIHZhciBzb3VuZCA9IHRoaXMuc291bmRzWyBrZXkgXTtcbiAgdmFyIHNvdW5kRGF0YSA9IHJuZy5waWNrKHNvdW5kKTtcbiAgc291bmREYXRhLnBvb2xbIHNvdW5kRGF0YS50aWNrIF0ucGxheSgpO1xuICBzb3VuZERhdGEudGljayA8IHNvdW5kRGF0YS5jb3VudCAtIDEgPyBzb3VuZERhdGEudGljaysrIDogc291bmREYXRhLnRpY2sgPSAwO1xufTtcblxudmFyIGFhID0gbmV3IEFyY2FkZUF1ZGlvKCk7XG5cbmFhLmFkZCggJ3Bvd2VydXAnLCAxMCxcbiAgW1xuICAgIFswLCwwLjAxLCwwLjQzODQsMC4yLCwwLjEyLDAuMjgsMSwwLjY1LCwsMC4wNDE5LCwsLCwxLCwsLCwwLjNdXG4gIF1cbik7XG5cbmFhLmFkZCggJ2xhc2VyJywgNSxcbiAgW1xuICAgIFsyLCwwLjIsLDAuMTc1MywwLjY0LCwtMC41MjYxLCwsLCwsMC41NTIyLC0wLjU2NCwsLCwxLCwsLCwwLjI1XSxcbiAgICBbMCwsMC4xNiwwLjE4LDAuMTgsMC40NywwLjAwODQsLTAuMjYsLCwsLCwwLjc0LC0xLCwtMC43NiwsMSwsLCwsMC4xNV1cbiAgXVxuKTtcblxuYWEuYWRkKCAnZGFtYWdlJywgMyxcbiAgW1xuICAgIFszLCwwLjAxMzgsLDAuMjcwMSwwLjQ5MzUsLC0wLjY4ODEsLCwsLCwsLCwsLDEsLCwsLDAuMjVdLFxuICAgIFswLCwwLjA2MzksLDAuMjQyNSwwLjc1ODIsLC0wLjYyMTcsLCwsLCwwLjQwMzksLCwsLDEsLCwsLDAuMjVdLFxuICAgIFszLCwwLjA5NDgsLDAuMjExNiwwLjcxODgsLC0wLjYzNzIsLCwsLCwsLCwsLDEsLCwwLjIyMzYsLDAuMjVdLFxuICAgIFszLCwwLjE2MDYsMC41OTg4LDAuMjk1NywwLjExNTcsLC0wLjM5MjEsLCwsLCwsLCwwLjMyMjUsLTAuMjUyMiwxLCwsLCwwLjI1XSxcbiAgICBbMywsMC4xNzI2LDAuMjQ5NiwwLjIxMTYsMC4wNjIzLCwtMC4yMDk2LCwsLCwsLCwsMC4yNjY1LC0wLjE0NTksMSwsLCwsMC4yNV0sXG4gICAgWzMsLDAuMTY0NSwwLjcyMzYsMC4zNDAyLDAuMDMxNywsLCwsLCwsLCwsLCwxLCwsLCwwLjI1XVxuICBdXG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFhO1xuIiwiKGZ1bmN0aW9uKCkge1xuXG4vLyBwcml2YXRlIHZhcmlhYmxlczpcbiAgdmFyIHRhcmdldFg9MCwgICAgLy8gd2hlcmUgdGhlIGNhbWVyYSBzaG91bGQgbW92ZSB0b1xuICAgIHRhcmdldFk9MCxcblxuICAgIGN1clggPTAsICAvLyB3aGVyZSB0aGUgY2FtZXJhIGN1cnJlbnRseSBpcyAtIGZsb2F0XG4gICAgY3VyWSA9IDA7XG5cblxuLy8gZ2xvYmFsczpcbiAgbW9kdWxlLmV4cG9ydHMgPSAge1xuICAgIFg6IDAsIC8vIHdoZXJlIHRoZSBjYW1lcmEgY3VycmVudGx5IGlzIC0gaW50ZWdlciBwaXhlbHMgIChzdWl0YWJsZSBmb3IgY2FudmFzIHRyYW5zbGF0ZSlcbiAgICBZOiAwLFxuICAgIHNjYWxlOiAxLFxuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBtb3ZlIHRoZSBjYW1lcmEgc2xpZ2h0bHkgdG93YXJkcyB0aGUgdGFyZ2V0LCBjYWxsZWQgZnJvbSB0aGUgcmFmIGZ1bmN0aW9uXG4gICAgICBjdXJYID0gY3VyWCouOSArIHRhcmdldFgqLjE7XG4gICAgICBjdXJZID0gY3VyWSouOSArIHRhcmdldFkqLjE7XG4gICAgICB0aGlzLlggPSBNYXRoLnJvdW5kKGN1clgpO1xuICAgICAgdGhpcy5ZID0gTWF0aC5yb3VuZChjdXJZKTtcbiAgICB9LFxuXG4gICAgc2V0VGFyZ2V0OiBmdW5jdGlvbih4LHkpIHtcbiAgICAgIHRhcmdldFggPSB4O1xuICAgICAgdGFyZ2V0WSA9IHk7XG4gICAgfVxuICB9XG59KSgpO1xuIiwiXG5mdW5jdGlvbiBpc0VtcHR5KG9iaikge1xuICBmb3IodmFyIGkgaW4gb2JqKSB7IHJldHVybiBmYWxzZTsgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIHJvb20oeCx5KSB7XG4gIHJldHVybiB4K1wiLFwiK3k7XG59XG4vLyBUT0RPOiByZXBsYWNlIHdpdGggcmFuZG9tIHdpdGggYSBzZWVkID9cbmZ1bmN0aW9uIHJuZEludChteCkge1xuICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIG14IHwgMDtcbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZU1hemUoTUFaRV9YLCBNQVpFX1kpIHtcbiAgdmFyIHVudmlzaXRlZENlbGxzID0ge30sXG4gICAgbWF6ZSA9IFtdLFxuICAgIFdBTEwgPSAwLFxuICAgIEFJUiA9IDEsXG4gICAgeCx5LHQsXG4gICAgICBzdGFjaz1bXSxcbiAgICAgIG54LG55LG5laWdoYm9yc0R1cCxkaXIsXG4gICAgICBwb3BjZWxsLFxuICAgICAgIC8vIHBhaXJzIG9mIChkeCxkeSlcbiAgICAgICAvLyBkdXBsaWNhdGUgaG9yaXpvbnRhbCB0byBnaXZlIG1vcmUgY2hhbmNlIGZvciBob3Jpem9udGFsIHBhdGhlc1xuICAgICAgbmVpZ2hib3JzID0gWzAsMSwgMCwtMSwgMSwwLDEsMCwxLDAsICAgLTEsMCwtMSwwLC0xLDBdO1xuXG4vLyBtYXplIGlzIDQgdGltZXMgYmlnZ2VyIHRoYW4gTUFYRV9YIHggTUFaRV9ZIC0gc28gZG8gdHdpY2UgZWFjaCByb3csIGFuZCBhZGQgdHdvIGNlbGxzIGZvciBlYWNoIFhcblxuICBmb3IgKHk9MDsgeTxNQVpFX1k7IHkrKykge1xuICAgIGZvciAodD0wOyB0PDI7IHQrKykge1xuICAgICAgZm9yICh4PTA7IHg8TUFaRV9YOyB4KyspIHtcbiAgICAgICAgdW52aXNpdGVkQ2VsbHNbcm9vbSh4LHkpXSA9IDE7XG4gICAgICAgIG1hemUucHVzaChXQUxMKTtcbiAgICAgICAgbWF6ZS5wdXNoKFdBTEwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHggPSBybmRJbnQoTUFaRV9YKTtcbiAgeT1ybmRJbnQoTUFaRV9ZKTtcblxuICBNQVpFX1ggKj0gMjtcbiAgTUFaRV9ZICo9IDI7XG5cbiAgd2hpbGUgKDEpIHtcbiAgICAvLyB2aXNpdCB4LHkgKHVubGVzcyB3ZSd2ZSBiZWVuIGhlcmUgYmVmb3JlIGFuZCB0aGlzIGlzIGEgYmFja3RyYWNrKVxuICAgIGlmICh1bnZpc2l0ZWRDZWxsc1tyb29tKHgseSldKSB7XG4gICAgICBkZWxldGUgdW52aXNpdGVkQ2VsbHNbcm9vbSh4LHkpXTtcbiAgICAgIG1hemVbTUFaRV9YKnkqMit4KjJdID0gQUlSO1xuICAgICAgaWYgKGlzRW1wdHkodW52aXNpdGVkQ2VsbHMpKSB7XG4gICAgICAgIC8vIGFsbCBkb25lXG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBsb29rIGZvciBhIGRpcmVjdGlvbiB0byBtb3ZlXG4gICAgbmVpZ2hib3JzRHVwID0gbmVpZ2hib3JzLnNsaWNlKCk7XG4gICAgd2hpbGUgKDEpIHtcblxuICAgICAgaWYgKG5laWdoYm9yc0R1cC5sZW5ndGggPT0gMCkge1xuICAgICAgICAvLyByZWFjaGVkIGEgZGVhZGVuZCAtIGJhY2t0cmFjayB0byBzb21lcGxhY2Ugbm90IGRlYWRcbiAgICAgICAgcG9wY2VsbCA9IHN0YWNrLnBvcCgpLnNwbGl0KCcsJyk7XG4gICAgICAgIHggPSArcG9wY2VsbFswXTtcbiAgICAgICAgeSA9ICtwb3BjZWxsWzFdO1xuICAgICAgICBicmVhazsgLy8gdHJ5IGFnYWluIGZyb20gZWFybGllciBwb2ludCBpbiB0aGUgc3RhY2tcbiAgICAgIH1cbiAgICAgIGRpciA9IG5laWdoYm9yc0R1cC5zcGxpY2UoMipybmRJbnQobmVpZ2hib3JzRHVwLmxlbmd0aC8yKSwgMik7IC8vIHBpY2sgYSBkaXJlY3Rpb25cblxuICAgICAgbnggPSB4ICsgZGlyWzBdO1xuICAgICAgbnkgPSB5ICsgZGlyWzFdO1xuICAgICAgLy8gY2hlY2sgaWYgYWxyZWFkeSB2aXNpdGVkID0gbm90IHVudmlzaXRlZFxuICAgICAgLy8gaW5jaWRlbnRseSwgdGhpcyBhbHNvIGNhcHR1cmVzIHRoZSBvdXQgb2YgbWF6ZSBlZGdlIHNjZW5hcmlvLFxuICAgICAgLy8gc2luY2UgXCItMSw0XCIgd2lsbCBiZSB1bmRlZmluZWQgc28gdW5kZXJzdG9vZCBhcyB2aXNpdGVkIGFscmVhZHlcbiAgICAgIGlmICghdW52aXNpdGVkQ2VsbHNbcm9vbShueCxueSldKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gZm91bmQgYSBnb29kIGRpcmVjdGlvbiFcbiAgICAgIG1hemVbTUFaRV9YKigyKnkrZGlyWzFdKSsyKngrZGlyWzBdXSA9IEFJUjtcblxuICAgICAgLy8gc2F2ZSB0aGlzIGxvY2F0aW9uIGluIGNhc2Ugd2UgcmVhY2ggYSBkZWFkIGVuZCBsYXRlciBhbmQgbmVlZCB0byBiYWNrdHJhY2tcbiAgICAgIHN0YWNrLnB1c2gocm9vbSh4LHkpKTtcblxuICAgICAgLy8gbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgIHggPSBueDtcbiAgICAgIHkgPSBueTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG5cbiAgZnVuY3Rpb24gZmluZFBsYWNlcygpIHtcbiAgICAvLyBtYXliZSBpbnN0ZWFkIG9mIG1hcHMgdXNlIGFycmF5IGFuZCBiaW5hcnkgc2VhcmNoIGluIGNhc2UgbmVlZCB0byBjaGVjayBjb250YWlucz9cbiAgICAvLyAgaHR0cDovL29saS5tZS51ay8yMDEzLzA2LzA4L3NlYXJjaGluZy1qYXZhc2NyaXB0LWFycmF5cy13aXRoLWEtYmluYXJ5LXNlYXJjaC9cbiAgICB2YXIgcGxhY2VzID0ge1xuICAgICAgaG9yaXpERToge30sICAvLyBERSA9IGRlYWQgZW5kXG4gICAgICB0b3BERToge30sXG4gICAgICBib3R0b21ERToge30sXG4gICAgICBoYWxsd2F5OiB7fSxcbiAgICAgIGNodXRlOiB7fSxcbiAgICB9O1xuXG4gICAgZm9yICh2YXIgeT0wOyB5PE1BWkVfWTsgeSsrICkge1xuICAgICAgZm9yICh2YXIgeD0wOyB4PE1BWkVfWDsgeCsrICkge1xuICAgICAgICB2YXIgb2ZzID0gTUFaRV9YKnkreDtcbiAgICAgICAgaWYgKG1hemVbb2ZzXSkge1xuICAgICAgICAgIGlmIChtYXplW29mcysxXSAmJiBtYXplW29mcy0xXSkgeyAvLyBib3RoIGxlZnQgYW5kIHJpZ2h0XG4gICAgICAgICAgICBpZiAobWF6ZVtvZnMrMl0gJiYgbWF6ZVtvZnMtMl0gJiYgIW1hemVbb2ZzK01BWkVfWF0pXG4gICAgICAgICAgICAgIHBsYWNlcy5oYWxsd2F5W29mc10gPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChtYXplW29mcysxXSB8fCBtYXplW29mcy0xXSkgeyAgLy8gb25seSBsZWZ0IG9yIG9ubHkgcmlnaHRcbiAgICAgICAgICAgIC8vIGNoZWNrIG5vdCBjb3JuZXJcbiAgICAgICAgICAgIGlmICghbWF6ZVtvZnMrTUFaRV9YXSAmJiAhbWF6ZVtvZnMtTUFaRV9YXSlcbiAgICAgICAgICAgICAgcGxhY2VzLmhvcml6REVbb2ZzXSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKG1hemVbb2ZzK01BWkVfWF0gJiYgbWF6ZVtvZnMtTUFaRV9YXSkge1xuICAgICAgICAgICAgcGxhY2VzLmNodXRlW29mc10gPSAxOyAvLyBib3RoIHVwIGFuZCBkb3duXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2UgaWYgKG1hemVbb2ZzLU1BWkVfWF0pIHtcbiAgICAgICAgICAgIHBsYWNlcy5ib3R0b21ERVtvZnNdID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSBpZiAobWF6ZVtvZnMrTUFaRV9YXSkge1xuICAgICAgICAgICAgcGxhY2VzLnRvcERFW29mc10gPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGxhY2VzO1xuICB9XG5cblxuICAvLyBUT0RPOiAgTWF5YmUgbm8gbmVlZCBmb3IgQkZTPyAgd2l0aG91dCBjeWNsZXMgREZTIGlzIGdvb2QgZGlzdGFuY2UgbWVhc3VybWVudCBhcyB3ZWxsXG4gIC8vIFRPRE86IEZsb3lkIE1hcnNoYWwgZm9yIGFsbCBwYWlyc1xuICAvLyAgICAgICBodHRwczovL21nZWNoZXYuZ2l0aHViLmlvL2phdmFzY3JpcHQtYWxnb3JpdGhtcy9ncmFwaHNfc2hvcnRlc3QtcGF0aF9mbG95ZC13YXJzaGFsbC5qcy5odG1sXG4gIGZ1bmN0aW9uIEJGUyhvZnMwKSB7XG4gICAgLy8gcmVzZXRcbiAgICBmb3IgKHZhciB5PTA7IHk8TUFaRV9ZOyB5KyspIHtcbiAgICAgIGZvciAodmFyIHg9MDsgeDxNQVpFX1g7IHgrKykge1xuICAgICAgICB2YXIgb2ZzID0gTUFaRV9YKnkreDtcbiAgICAgICAgaWYgKG1hemVbb2ZzXSkge1xuICAgICAgICAgIG1hemVbb2ZzXSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdmFyIG9mcz1vZnMwLFxuICAgICAgICBzdGFjayA9IFtvZnNdLFxuICAgICAgICBkLFxuICAgICAgICBmdSA9IGZ1bmN0aW9uKG9mcykge1xuICAgICAgICAgIGlmIChtYXplW29mc109PTEpIHtcbiAgICAgICAgICAgIG1hemVbb2ZzXT1kO1xuICAgICAgICAgICAgc3RhY2sucHVzaChvZnMpXG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgd2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuICAgICAgb2ZzID0gc3RhY2sucG9wKCk7XG4gICAgICBkID0gbWF6ZVtvZnNdKzE7XG4gICAgICBmdShvZnMrMSk7XG4gICAgICBmdShvZnMtMSk7XG4gICAgICBmdShvZnMrTUFaRV9YKTtcbiAgICAgIGZ1KG9mcy1NQVpFX1gpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRPRE86IGFkZCBrZXlzIGFuZCBsb2NrcywgZWcgaHR0cDovL3d3dy5zcXVpZGkubmV0L3RocmVlL2VudHJ5LnBocD9pZD00XG5cbiAgZnVuY3Rpb24gZHJhd01hemUoY3R4LCBjZWxsU2l6ZSkge1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiI2VlZlwiO1xuICAgICAgdmFyIHNtYWxsID0gY2VsbFNpemUvMztcbiAgICAgIC8vY3R4LmZpbGxTdHlsZSA9IFwiIzAwMFwiO1xuICAgICAgLy9jdHguZmlsbFJlY3QoMCwwLCBXLCBIKTtcbiAgICAgIC8vQkZTKE1BWkVfWCpNQVpFX1ktTUFaRV9YKTtcbiAgICAgIC8vdmFyIHBsYWNlcyA9IGZpbmRQbGFjZXMoKTtcbiAgICAgIGZvciAodmFyIHk9LTM7IHk8TUFaRV9ZKzI7IHkrKykge1xuICAgICAgICB2YXIgeDA9LTMsIG9mcyA9IHkqTUFaRV9YO1xuICAgICAgICBmb3IgKHZhciB4PTA7IHg8TUFaRV9YOyB4KyspIHtcblxuICAgICAgICAgIGlmIChtYXplW29mc10pIHtcbiAgICAgICAgICAgIC8vIGZvdW5kIGFpciAtIGRyYXcgcmVjdCBmcm9tIHByZXYgcm9jayB0byB0aGlzIFhcbiAgICAgICAgICAgIGlmICh4MCAhPSAtMSkge1xuICAgICAgICAgICAgICBjdHguZmlsbFJlY3QoeDAqY2VsbFNpemUsIHkqY2VsbFNpemUsICh4LXgwKSpjZWxsU2l6ZSwgY2VsbFNpemUpO1xuICAgICAgICAgICAgICB4MCA9IC0xO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobWF6ZS5wbGFjZXMuYm90dG9tREVbb2ZzXSkge1xuICAgICAgICAgICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiI2ZhYVwiO1xuICAgICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHgqY2VsbFNpemUrc21hbGwsIHkqY2VsbFNpemUrc21hbGwsIHNtYWxsLHNtYWxsKTtcbiAgICAgICAgICAgICAgIGN0eC5maWxsU3R5bGUgPSBcIiNlZWZcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBmb3VuZCByb2NrLCB1cGRhdGUgeDBcbiAgICAgICAgICAgIGlmICh4MCA9PSAtMSkge1xuICAgICAgICAgICAgICB4MCA9IHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgICAgLy92YXIgdD0gbWF6ZVtvZnNdO1xuICAgICAgICAgICAgLy9jdHguZmlsbFN0eWxlID0gJ3JnYignK3QrXCIsXCIrdCtcIixcIit0K1wiKVwiO1xuXG4gICAgICAgICAgICAvLyBpZiAocGxhY2VzLnRvcERFW29mc10pIHtcbiAgICAgICAgICAgIC8vICAgY3R4LmZpbGxTdHlsZSA9IFwiI2ZmYVwiO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgLy8gaWYgKHBsYWNlcy5ib3R0b21ERVtvZnNdKSB7XG4gICAgICAgICAgICAvLyAgIGN0eC5maWxsU3R5bGUgPSBcIiNmYWFcIjtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIGlmIChwbGFjZXMuaG9yaXpERVtvZnNdKSB7XG4gICAgICAgICAgICAvLyAgIGN0eC5maWxsU3R5bGUgPSBcIiNhZmFcIjtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vIGlmIChwbGFjZXMuaGFsbHdheVtvZnNdKSB7XG4gICAgICAgICAgICAvLyAgIGN0eC5maWxsU3R5bGUgPSBcIiNhYWZcIjtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvL2N0eC5maWxsUmVjdCh4KmNlbGxTaXplLCB5KmNlbGxTaXplLCBjZWxsU2l6ZSwgY2VsbFNpemUpO1xuICAgICAgICAgIG9mcysrO1xuICAgICAgICB9XG4gICAgICAgIGN0eC5maWxsUmVjdCh4MCpjZWxsU2l6ZSwgeSpjZWxsU2l6ZSwgKDIreC14MCkqY2VsbFNpemUsIGNlbGxTaXplKTtcbiAgICAgIH1cbiAgfVxuXG4gIG1hemUuQkZTID0gQkZTO1xuICBtYXplLnBsYWNlcyA9IGZpbmRQbGFjZXMoKTtcbiAgbWF6ZS5kcmF3ID0gZHJhd01hemU7XG4gIG1hemUuZ2V0ID0gZnVuY3Rpb24oeCx5KSB7XG4gICAgcmV0dXJuIG1hemVbeSpNQVpFX1greF07XG4gIH1cbiAgcmV0dXJuIG1hemU7XG59XG5cbi8qXG52YXIgTUFaRV9YPTQ4LFxuICAgIE1BWkVfWT00MCxcbiAgICBtYXplID0gZ2VuZXJhdGVNYXplKE1BWkVfWC8yLCBNQVpFX1kvMiksXG5cbiAgICBXID0gNjAwLFxuICAgIEggPSA0MDA7Ly8sXG5cbiAgLy8gIGN0eCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXMnKS5nZXRDb250ZXh0KFwiMmRcIik7XG4qL1xuLy9kcmF3TWF6ZSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdlbmVyYXRlTWF6ZTtcbiIsIi8qXG4gKiBmcHNjb3VudGVyLmpzXG4gKlxuICogQSBzaW1wbGUgaW4tYnJvd3NlciBmcHMgY291bnRlciwgc3VpdGFibGUgZm9yIHVzaW5nIHdpdGggYSBib29rbWFya2xldFxuICpcbiAqIEBhdXRob3IgUGV0ZSBPdGFxdWkgPHBldGVAb3RhcXVpLmNvbT5cbiAqIEB1cmwgaHR0cHM6Ly9naXRodWIuY29tL3BldGUtb3RhcXVpL2Zwc2NvdW50ZXJcbiAqIEBsaWNlbnNlIENyZWF0aXZlIENvbW1vbnMgQXR0cmlidXRpb24gMy4wIFVucG9ydGVkXG4gKiBAbGljZW5zZSBodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9saWNlbnNlcy9ieS8zLjAvZGVlZC5lbl9HQlxuKi9cbihmdW5jdGlvbihnbG9iYWwpIHtcbiAgICBnbG9iYWwuZnBzY291bnRlciA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgICAvLyBsYXRlIGJpbmRpbmcgZm9yIG9wdGlvbnMgPiBnbG9iYWwuZnBzY291bnRlcl9vcHRpb25zID4gZGVmYXVsdHNcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIHZhciBnbG9iYWxzID0gZ2xvYmFsLmZwc2NvdW50ZXJfb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgICAgICByZW1vdmVfb25fY2xpY2s6IGZhbHNlLFxuICAgICAgICAgICAgd2lkdGg6IDEwMCxcbiAgICAgICAgICAgIGhlaWdodDogNTBcbiAgICAgICAgfTtcbiAgICAgICAgT2JqZWN0LmtleXMoZGVmYXVsdHMpLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBvcHRpb25zW2tleV0gPSBvcHRpb25zW2tleV0gfHwgZ2xvYmFsc1trZXldIHx8IGRlZmF1bHRzW2tleV07XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgLy8gZ2V0IHRoZSB3aWR0aCBoZWlnaHQgZm9yIHJlcGVhdGVkIHVzZVxuICAgICAgICB2YXIgY2FudmFzX3cgPSBvcHRpb25zLndpZHRoLFxuICAgICAgICAgICAgY2FudmFzX2ggPSBvcHRpb25zLmhlaWdodDtcblxuICAgICAgICAvLyBjcmVhdGUgdGhlIG5ldyBkb20gZWxlbWVudHMsIHRoZSBjYW52YXMgY29udGV4dCwgdGhlIHN0eWxlXG4gICAgICAgIHZhciBlbGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWxlLmNsYXNzTmFtZSA9ICdmcHNjb3VudGVyJztcbiAgICAgICAgZWxlLnN0eWxlLndpZHRoID0gY2FudmFzX3cgKyAncHgnO1xuICAgICAgICBlbGUuc3R5bGUuaGVpZ2h0ID0gY2FudmFzX2ggKyAncHgnO1xuXG4gICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgY2FudmFzLmNsYXNzTmFtZSA9ICdmcHNjb3VudGVyLWNhbnZhcyc7XG4gICAgICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhc193O1xuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzX2g7XG5cbiAgICAgICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSxcbiAgICAgICAgICAgIHRleHRfZnBzX3ggPSBjYW52YXNfdy8yIC0gMTQsXG4gICAgICAgICAgICB0ZXh0X2Zwc195ID0gY2FudmFzX2gvMiArIDEwLFxuICAgICAgICAgICAgdGV4dF9tYXhfeCA9IDQsXG4gICAgICAgICAgICB0ZXh0X21heF95ID0gOCxcbiAgICAgICAgICAgIHRleHRfbWluX3ggPSA0LFxuICAgICAgICAgICAgdGV4dF9taW5feSA9IGNhbnZhc19oIC0gNCxcbiAgICAgICAgICAgIGZwc19mb250ID0gJ2JvbGQgMzBweCBNb25vc3BhY2UnLFxuICAgICAgICAgICAgbWluX21heF9mb250ID0gJzEwcHggTW9ub3NwYWNlJztcblxuICAgICAgICB2YXIgZ3JhZGllbnRfZmlsbCA9IGNvbnRleHQuY3JlYXRlTGluZWFyR3JhZGllbnQoMCwwLDAsY2FudmFzX2gpO1xuICAgICAgICBncmFkaWVudF9maWxsLmFkZENvbG9yU3RvcCgwLCAnIzAwMTEzMycpO1xuICAgICAgICBncmFkaWVudF9maWxsLmFkZENvbG9yU3RvcCgxLCAnIzExMjI4OCcpO1xuXG4gICAgICAgIHZhciBncmFkaWVudF9saW5lID0gY29udGV4dC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLDAsMCxjYW52YXNfaCk7XG4gICAgICAgIGdyYWRpZW50X2xpbmUuYWRkQ29sb3JTdG9wKDAsICcjMjg0OGQ4Jyk7XG4gICAgICAgIGdyYWRpZW50X2xpbmUuYWRkQ29sb3JTdG9wKDEsICcjMzM2NmZmJyk7XG5cbiAgICAgICAgY29udGV4dC5saW5lV2lkdGggPSAxO1xuICAgICAgICBjb250ZXh0LnN0cm9rZVN0eWxlID0gZ3JhZGllbnRfbGluZTtcblxuXG4gICAgICAgIHZhciBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLnRleHRDb250ZW50ID0gJy5mcHNjb3VudGVyIHsgJytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3Bvc2l0aW9uOiBmaXhlZDsgJytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3RvcDogMDsgJytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3JpZ2h0OiAwOyAnK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcjogIzAwMDsgJytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbG9yOiAjZmZmOyAnK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplOiAzMHB4OyAnK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZm9udC1mYW1pbHk6IG1vbm9zcGFjZTsnK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnei1pbmRleDogOTk5OTk5JytcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnfSc7XG5cbiAgICAgICAgZWxlLmFwcGVuZENoaWxkKGNhbnZhcyk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlKTtcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZCcpLmFwcGVuZENoaWxkKHN0eWxlKTtcblxuXG4gICAgICAgIC8vIGluaXRpYWxpemUgc29tZSB0aW1pbmcgYW5kIGhpc3RvcnkgdmFyaWFibGVzXG4gICAgICAgIHZhciB0X3ByZSwgdF9ub3csIHVfcHJlLCB1X2xpbSxcbiAgICAgICAgICAgIGhfYXJyID0gW10sIGhfbGVuID0gY2FudmFzX3csXG4gICAgICAgICAgICByYWZfcmVxdWVzdCwgcmFmX3J1bm5pbmc7XG5cbiAgICAgICAgLy8gd2Ugd29uJ3QgdXBkYXRlIGFueXRoaW5nIG1vcmUgb2Z0ZW4gdGhhbiB0aGlzIG1hbnkgbWlsbGlzZWNvbmRzXG4gICAgICAgIHVfbGltID0gMTAwO1xuXG4gICAgICAgIC8vIHJlZHVjZSBhbiBhcnJheSBvZiB2YWx1ZXMgdG8gaXQgbWVtYmVycyBib3VuZGluZyB2YWx1ZXMgaW4gdGhlIGZvcm0gW21pbiwgbWF4XVxuICAgICAgICBmdW5jdGlvbiBoX3JlZHVjZShtZW1vLCBpdGVtKSB7XG4gICAgICAgICAgICBpZiAoICFtZW1vWzBdIHx8IGl0ZW0gPCBtZW1vWzBdKSBtZW1vWzBdID0gaXRlbTtcbiAgICAgICAgICAgIGlmICggIW1lbW9bMV0gfHwgaXRlbSA+IG1lbW9bMV0pIG1lbW9bMV0gPSBpdGVtO1xuICAgICAgICAgICAgcmV0dXJuIG1lbW87XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjaGVja2ZwcygpIHtcbiAgICAgICAgICAgIHZhciBmcHMsIGNfbWluX21heCwgY19taW4sIGNfZGVsdGEsIGZpcnN0X3BvaW50LCB4eTtcbiAgICAgICAgICAgIHJhZl9ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHRfbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIC8vIHRoaXMgaXMgd2hlcmUgd2UgdGhyb3R0bGUgZGlzcGxheWVkIHVwZGF0ZXNcbiAgICAgICAgICAgIGlmICggdF9ub3cgPj0gdV9wcmUgKyB1X2xpbSkge1xuXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBmcHMgZm9yIHRoZSBoaXN0b3J5XG4gICAgICAgICAgICAgICAgZnBzID0gTWF0aC5taW4oNjAsIE1hdGgucm91bmQoMS8odF9ub3ctdF9wcmUpKjEwMDApKTtcbiAgICAgICAgICAgICAgICBoX2Fyci51bnNoaWZ0KGZwcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBkbyByZXF1aXJlZCBtYXRoXG4gICAgICAgICAgICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzX3csIGNhbnZhc19oKTtcbiAgICAgICAgICAgICAgICBpZiAoIGhfYXJyLmxlbmd0aCA+IGhfbGVuICkgaF9hcnIucG9wKCk7XG4gICAgICAgICAgICAgICAgY19taW5fbWF4ID0gaF9hcnIucmVkdWNlKGhfcmVkdWNlLCBbXSk7XG4gICAgICAgICAgICAgICAgY19taW4gPSBjX21pbl9tYXhbMF07XG4gICAgICAgICAgICAgICAgY19tYXggPSBjX21pbl9tYXhbMV07XG4gICAgICAgICAgICAgICAgY19kZWx0YSA9IGNfbWF4IC0gY19taW47XG5cblxuICAgICAgICAgICAgICAgIC8vIGRyYXcgdGhlIGxpbmUgZ3JhcGhcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9IGdyYWRpZW50X2ZpbGw7XG4gICAgICAgICAgICAgICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgICAgICAvLyBmaXJzdF9wb2ludCA9IGZwc1RvUG9pbnQoMCwgaF9hcnJbMF0sIGNfbWluLCBjX2RlbHRhKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0Lm1vdmVUbyhjYW52YXNfdywgY2FudmFzX2gpO1xuICAgICAgICAgICAgICAgIGhfYXJyLmZvckVhY2goZnVuY3Rpb24oZnBzX3ZhbCwgaW5kZXgpIHtcbiAgICAgICAgICAgICAgICAgICAgeHkgPSBmcHNUb1BvaW50KGluZGV4LCBmcHNfdmFsLCBjX21pbiwgY19kZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubGluZVRvKHh5WzBdLCB4eVsxXSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29udGV4dC5saW5lVG8oeHlbMF0sIGNhbnZhc19oKTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmxpbmVUbyhjYW52YXNfdywgY2FudmFzX2gpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbCgpO1xuICAgICAgICAgICAgICAgIGNvbnRleHQuc3Ryb2tlKCk7XG5cbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxTdHlsZSA9ICcjZmZmJztcbiAgICAgICAgICAgICAgICAvLyB3cml0ZSB0aGUgbWFpbiBGUFMgdGV4dFxuICAgICAgICAgICAgICAgIGNvbnRleHQuZm9udCA9IGZwc19mb250O1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZmlsbFRleHQoZnBzLCB0ZXh0X2Zwc194LCB0ZXh0X2Zwc195KTtcblxuICAgICAgICAgICAgICAgIC8vIHdyaXRlIHRoZSBsaW1pdCB0ZXh0c1xuICAgICAgICAgICAgICAgIGNvbnRleHQuZm9udCA9IG1pbl9tYXhfZm9udDtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxUZXh0KGNfbWluLCB0ZXh0X21pbl94LCB0ZXh0X21pbl95KTtcbiAgICAgICAgICAgICAgICBjb250ZXh0LmZpbGxUZXh0KGNfbWF4LCB0ZXh0X21heF94LCB0ZXh0X21heF95KTtcblxuICAgICAgICAgICAgICAgIC8vIHNldCB0aGUgXCJ1cGRhdGUgdGltZVwiIGNvdW50ZXJcbiAgICAgICAgICAgICAgICB1X3ByZSA9IHRfbm93O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBzZXQgdGhlIFwiZnJhbWUgdGltZVwiIGNvdW50ZXJcbiAgICAgICAgICAgIHRfcHJlID0gdF9ub3c7XG5cbiAgICAgICAgICAgIC8vIHJlcXVlc3QgYW5vdGhlciB1cGRhdGUgbGF0ZXJcbiAgICAgICAgICAgIC8vIGlmICggcmFmX3J1bm5pbmcgKSB7XG4gICAgICAgICAgICAvLyAgICAgcmFmX3JlcXVlc3QgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2hlY2tmcHMpO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29udmVydCBhbiBmcHMgdmFsdWUgdG8gYW4gW3gseV0gYXJyYXlcbiAgICAgICAgZnVuY3Rpb24gZnBzVG9Qb2ludChpbmRleCwgZnBzX3ZhbCwgbWluLCBkZWx0YSkge1xuICAgICAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgICAgICBjYW52YXNfdyAtIGluZGV4LFxuICAgICAgICAgICAgICAgIGNhbnZhc19oIC0gY2FudmFzX2ggKiAoZnBzX3ZhbCAtIG1pbikgLyBkZWx0YVxuICAgICAgICAgICAgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGFkZCByZW1vdmFsIGV2ZW50XG4gICAgICAgIGVsZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmFmX3J1bm5pbmcgPSAhcmFmX3J1bm5pbmc7XG4gICAgICAgICAgICBpZiAocmFmX3J1bm5pbmcpIHtcbiAgICAgICAgICAgICAgICBzdGFydCgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShyYWZfcmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgaWYgKCBvcHRpb25zLnJlbW92ZV9vbl9jbGljayApIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChlbGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gc3RhcnRcbiAgICAgICAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgICAgICAgICB0X3ByZSA9IERhdGUubm93KCk7XG4gICAgICAgICAgICBoX2FyciA9IFtdO1xuICAgICAgICAgICAgdV9wcmUgPSB0X3ByZTtcbiAgICAgICAgICAgIGNoZWNrZnBzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGFydCgpO1xuXG4gICAgICAgIGdsb2JhbC5jaGVja2ZwcyA9IGNoZWNrZnBzO1xuICAgIH07XG5cbiAgICAvLyBsb3RzIG9mIG5lZ2F0aXZlcyBoZXJlIGJlY2F1c2UgdGhlIGFzc3VtcHRpb24gaXMgd2Ugc2hvdWxkIHN0YXJ0XG4gICAgaWYgKCAhZ2xvYmFsLmZwc2NvdW50ZXJfb3B0aW9ucyB8fCBnbG9iYWwuZnBzY291bnRlcl9vcHRpb25zLmF1dG9fc3RhcnQgIT09IGZhbHNlKSB7XG4gICAgICAgIGdsb2JhbC5mcHNjb3VudGVyKCk7XG4gICAgfVxuXG59KSh3aW5kb3cpO1xuIiwidXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJylcblxuXG52YXIgS0VZUz17fVxudmFyIHVwZGF0ZUZyb21LZXlzID0gZnVuY3Rpb24oZSwgcmVhbEV2KSB7XG4gIHZhciBjb2RlPSBlLmtleUNvZGU7XG4gICAgS0VZU1tjb2RlXT0gIGUudHlwZSA9PSAna2V5ZG93bic7XG4gICAgLy9jb25zb2xlLmxvZygnY29kZSBpcyAnLGNvZGUpO1xuICAgIC8vIFBsYXllci5sZWZ0ID0gS0VZU1szN107XG4gICAgLy8gUGxheWVyLnJpZ2h0ID0gS0VZU1szOV07XG4gICAgLy8gUGxheWVyLnVwID0gS0VZU1szOF07XG4gICAgLy8gUGxheWVyLmRvd24gPSBLRVlTWzQwXTtcbiAgICAvLyBQbGF5ZXIuanVtcCA9IEtFWVNbMzJdO1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY29kZSk7XG4gICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgIGlmIChLRVlTW2NvZGVdKSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnY2xpY2tlZCcpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnY2xpY2tlZCcpO1xuICAgICAgfVxuICAgICAgaWYgKHJlYWxFdiAmJiByZWFsRXYucHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgcmVhbEV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgfVxuICAgIH1cbn1cblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIHVwZGF0ZUZyb21LZXlzKTtcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdXBkYXRlRnJvbUtleXMpO1xuXG4vLyBVR0xZIC0gdXNpbmcgaGFyZCBjb2RlZCB2YWx1ZXMgZnJvbSBDU1NcbnZhciBwMCA9IDEwICsgNTUrNjUrNTUsXG4gIHAxID0gMTArNTUrNjUsXG4gIHAyID0gMTArNTU7XG5cblxudXRpbHMuZWFjaChbJ21vdXNlZG93bicsJ21vdXNldXAnLCAndG91Y2hzdGFydCcsJ3RvdWNobW92ZScsJ3RvdWNoZW5kJ10sIGZ1bmN0aW9uKGV2TmFtZSkge1xuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxlZnRcIikuYWRkRXZlbnRMaXN0ZW5lcihldk5hbWUsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdmFyIHR5cGUgPSBldmVudC50eXBlLCB4PWV2ZW50LmNsaWVudFgsIHk9ZXZlbnQuY2xpZW50WTtcbiAgICAgIGlmICh0eXBlPT0ndG91Y2hlbmQnKSB7XG4gICAgICAgIHVwZGF0ZUZyb21LZXlzKHt0eXBlOjAsIGtleUNvZGU6IDQwIH0sIGV2ZW50KTtcbiAgICAgICAgdXBkYXRlRnJvbUtleXMoe3R5cGU6MCwga2V5Q29kZTogMzkgfSwgZXZlbnQpO1xuICAgICAgICB1cGRhdGVGcm9tS2V5cyh7dHlwZTowLCBrZXlDb2RlOiAzOCB9LCBldmVudCk7XG4gICAgICAgIHVwZGF0ZUZyb21LZXlzKHt0eXBlOjAsIGtleUNvZGU6IDM3IH0sIGV2ZW50KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXZlbnQudG91Y2hlcykge1xuICAgICAgICB4ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRYO1xuICAgICAgICB5ID0gZXZlbnQudG91Y2hlc1swXS5jbGllbnRZO1xuICAgICAgfVxuICAgICAgdmFyIGUgPSB7dHlwZTogKHR5cGUgPT0gJ21vdXNldXAnKT8gMDogJ2tleWRvd24nIH07XG4gICAgICBpZiAoeCA8IHAyKSB7XG4gICAgICAgIGUua2V5Q29kZSA9IDM3O1xuICAgICAgICB1cGRhdGVGcm9tS2V5cyhlLCBldmVudCk7XG4gICAgICAgIHVwZGF0ZUZyb21LZXlzKHt0eXBlOjAsIGtleUNvZGU6IDM5IH0sIGV2ZW50KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKHg8cDAgJiYgcDEgPHgpIHtcbiAgICAgICAgZS5rZXlDb2RlID0gMzk7XG4gICAgICAgIHVwZGF0ZUZyb21LZXlzKGUsIGV2ZW50KTtcbiAgICAgICAgdXBkYXRlRnJvbUtleXMoe3R5cGU6MCwga2V5Q29kZTogMzcgfSwgZXZlbnQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG5cbiAgICAgIH1cbiAgICAgIHZhciB5ID0gaW5uZXJIZWlnaHQgLSB5O1xuICAgICAgaWYgKHkgPCBwMikge1xuICAgICAgICBlLmtleUNvZGUgPSA0MDtcbiAgICAgICAgdXBkYXRlRnJvbUtleXMoZSwgZXZlbnQpO1xuICAgICAgICB1cGRhdGVGcm9tS2V5cyh7dHlwZTowLCBrZXlDb2RlOiAzOCB9LCBldmVudCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmICh5IDwgcDAgJiYgcDE8eSkge1xuICAgICAgICBlLmtleUNvZGUgPSAzODtcbiAgICAgICAgdXBkYXRlRnJvbUtleXMoZSwgZXZlbnQpO1xuICAgICAgICB1cGRhdGVGcm9tS2V5cyh7dHlwZTowLCBrZXlDb2RlOiA0MCB9LCBldmVudCk7XG4gICAgICB9XG5cbiAgfSwgZmFsc2UpO1xufSk7XG5cbnV0aWxzLmVhY2goZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5idXR0b25cIiksIGZ1bmN0aW9uKGVsKSB7XG4gIHV0aWxzLmVhY2goWydtb3VzZWRvd24nLCdtb3VzZXVwJywgJ3RvdWNoc3RhcnQnLCd0b3VjaG1vdmUnLCd0b3VjaGVuZCddLCBmdW5jdGlvbihldk5hbWUpIHtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKGV2TmFtZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciB0eXBlID0gZXZlbnQudHlwZTtcbiAgICAgIGNvbnNvbGUubG9nKFwiZXZlbnQgXCIrIHR5cGUrIFwiIFwiK2V2ZW50LnRhcmdldC5pZCk7XG4gICAgICB2YXIgZSA9IHt0eXBlOiAodHlwZSA9PSAnbW91c2V1cCcgfHwgdHlwZT09J3RvdWNoZW5kJyk/IDA6ICdrZXlkb3duJywga2V5Q29kZTogZXZlbnQudGFyZ2V0LmlkIH07XG4gICAgICAvLyBmYWtlIGEga2V5ZG93bi91cCBldmVudFxuICAgICAgdXBkYXRlRnJvbUtleXMoZSwgZXZlbnQpO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEtFWVM7XG4iLCIvKipcbiAqIFNmeHJQYXJhbXNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMCBUaG9tYXMgVmlhblxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogQGF1dGhvciBUaG9tYXMgVmlhblxuICovXG4gLy8gSlMgUG9ydDogaHR0cHM6Ly9naXRodWIuY29tL21uZXVicmFuZC9qc2Z4ci9ibG9iL21hc3Rlci9qc2Z4ci5qc1xuXG4vKiogQGNvbnN0cnVjdG9yICovXG5mdW5jdGlvbiBTZnhyUGFyYW1zKCkge1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG4gIC8vICBTZXR0aW5ncyBTdHJpbmcgTWV0aG9kc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhIHNldHRpbmdzIGFycmF5IGludG8gdGhlIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIGFycmF5IEFycmF5IG9mIHRoZSBzZXR0aW5ncyB2YWx1ZXMsIHdoZXJlIGVsZW1lbnRzIDAgLSAyMyBhcmVcbiAgICogICAgICAgICAgICAgICAgYTogd2F2ZVR5cGVcbiAgICogICAgICAgICAgICAgICAgYjogYXR0YWNrVGltZVxuICAgKiAgICAgICAgICAgICAgICBjOiBzdXN0YWluVGltZVxuICAgKiAgICAgICAgICAgICAgICBkOiBzdXN0YWluUHVuY2hcbiAgICogICAgICAgICAgICAgICAgZTogZGVjYXlUaW1lXG4gICAqICAgICAgICAgICAgICAgIGY6IHN0YXJ0RnJlcXVlbmN5XG4gICAqICAgICAgICAgICAgICAgIGc6IG1pbkZyZXF1ZW5jeVxuICAgKiAgICAgICAgICAgICAgICBoOiBzbGlkZVxuICAgKiAgICAgICAgICAgICAgICBpOiBkZWx0YVNsaWRlXG4gICAqICAgICAgICAgICAgICAgIGo6IHZpYnJhdG9EZXB0aFxuICAgKiAgICAgICAgICAgICAgICBrOiB2aWJyYXRvU3BlZWRcbiAgICogICAgICAgICAgICAgICAgbDogY2hhbmdlQW1vdW50XG4gICAqICAgICAgICAgICAgICAgIG06IGNoYW5nZVNwZWVkXG4gICAqICAgICAgICAgICAgICAgIG46IHNxdWFyZUR1dHlcbiAgICogICAgICAgICAgICAgICAgbzogZHV0eVN3ZWVwXG4gICAqICAgICAgICAgICAgICAgIHA6IHJlcGVhdFNwZWVkXG4gICAqICAgICAgICAgICAgICAgIHE6IHBoYXNlck9mZnNldFxuICAgKiAgICAgICAgICAgICAgICByOiBwaGFzZXJTd2VlcFxuICAgKiAgICAgICAgICAgICAgICBzOiBscEZpbHRlckN1dG9mZlxuICAgKiAgICAgICAgICAgICAgICB0OiBscEZpbHRlckN1dG9mZlN3ZWVwXG4gICAqICAgICAgICAgICAgICAgIHU6IGxwRmlsdGVyUmVzb25hbmNlXG4gICAqICAgICAgICAgICAgICAgIHY6IGhwRmlsdGVyQ3V0b2ZmXG4gICAqICAgICAgICAgICAgICAgIHc6IGhwRmlsdGVyQ3V0b2ZmU3dlZXBcbiAgICogICAgICAgICAgICAgICAgeDogbWFzdGVyVm9sdW1lXG4gICAqIEByZXR1cm4gSWYgdGhlIHN0cmluZyBzdWNjZXNzZnVsbHkgcGFyc2VkXG4gICAqL1xuICB0aGlzLnNldFNldHRpbmdzID0gZnVuY3Rpb24odmFsdWVzKVxuICB7XG4gICAgZm9yICggdmFyIGkgPSAwOyBpIDwgMjQ7IGkrKyApXG4gICAge1xuICAgICAgdGhpc1tTdHJpbmcuZnJvbUNoYXJDb2RlKCA5NyArIGkgKV0gPSB2YWx1ZXNbaV0gfHwgMDtcbiAgICB9XG5cbiAgICAvLyBJIG1vdmVkIHRoaXMgaGVyZSBmcm9tIHRoZSByZXNldCh0cnVlKSBmdW5jdGlvblxuICAgIGlmICh0aGlzWydjJ10gPCAuMDEpIHtcbiAgICAgIHRoaXNbJ2MnXSA9IC4wMTtcbiAgICB9XG5cbiAgICB2YXIgdG90YWxUaW1lID0gdGhpc1snYiddICsgdGhpc1snYyddICsgdGhpc1snZSddO1xuICAgIGlmICh0b3RhbFRpbWUgPCAuMTgpIHtcbiAgICAgIHZhciBtdWx0aXBsaWVyID0gLjE4IC8gdG90YWxUaW1lO1xuICAgICAgdGhpc1snYiddICAqPSBtdWx0aXBsaWVyO1xuICAgICAgdGhpc1snYyddICo9IG11bHRpcGxpZXI7XG4gICAgICB0aGlzWydlJ10gICAqPSBtdWx0aXBsaWVyO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNmeHJTeW50aFxuICpcbiAqIENvcHlyaWdodCAyMDEwIFRob21hcyBWaWFuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKiBAYXV0aG9yIFRob21hcyBWaWFuXG4gKi9cbi8qKiBAY29uc3RydWN0b3IgKi9cbmZ1bmN0aW9uIFNmeHJTeW50aCgpIHtcbiAgLy8gQWxsIHZhcmlhYmxlcyBhcmUga2VwdCBhbGl2ZSB0aHJvdWdoIGZ1bmN0aW9uIGNsb3N1cmVzXG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuICAvLyAgU291bmQgUGFyYW1ldGVyc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgdGhpcy5fcGFyYW1zID0gbmV3IFNmeHJQYXJhbXMoKTsgIC8vIFBhcmFtcyBpbnN0YW5jZVxuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9cbiAgLy8gIFN5bnRoIFZhcmlhYmxlc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgdmFyIF9lbnZlbG9wZUxlbmd0aDAsIC8vIExlbmd0aCBvZiB0aGUgYXR0YWNrIHN0YWdlXG4gICAgICBfZW52ZWxvcGVMZW5ndGgxLCAvLyBMZW5ndGggb2YgdGhlIHN1c3RhaW4gc3RhZ2VcbiAgICAgIF9lbnZlbG9wZUxlbmd0aDIsIC8vIExlbmd0aCBvZiB0aGUgZGVjYXkgc3RhZ2VcblxuICAgICAgX3BlcmlvZCwgICAgICAgICAgLy8gUGVyaW9kIG9mIHRoZSB3YXZlXG4gICAgICBfbWF4UGVyaW9kLCAgICAgICAvLyBNYXhpbXVtIHBlcmlvZCBiZWZvcmUgc291bmQgc3RvcHMgKGZyb20gbWluRnJlcXVlbmN5KVxuXG4gICAgICBfc2xpZGUsICAgICAgICAgICAvLyBOb3RlIHNsaWRlXG4gICAgICBfZGVsdGFTbGlkZSwgICAgICAvLyBDaGFuZ2UgaW4gc2xpZGVcblxuICAgICAgX2NoYW5nZUFtb3VudCwgICAgLy8gQW1vdW50IHRvIGNoYW5nZSB0aGUgbm90ZSBieVxuICAgICAgX2NoYW5nZVRpbWUsICAgICAgLy8gQ291bnRlciBmb3IgdGhlIG5vdGUgY2hhbmdlXG4gICAgICBfY2hhbmdlTGltaXQsICAgICAvLyBPbmNlIHRoZSB0aW1lIHJlYWNoZXMgdGhpcyBsaW1pdCwgdGhlIG5vdGUgY2hhbmdlc1xuXG4gICAgICBfc3F1YXJlRHV0eSwgICAgICAvLyBPZmZzZXQgb2YgY2VudGVyIHN3aXRjaGluZyBwb2ludCBpbiB0aGUgc3F1YXJlIHdhdmVcbiAgICAgIF9kdXR5U3dlZXA7ICAgICAgIC8vIEFtb3VudCB0byBjaGFuZ2UgdGhlIGR1dHkgYnlcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG4gIC8vICBTeW50aCBNZXRob2RzXG4gIC8vXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSBydW5pbmcgdmFyaWFibGVzIGZyb20gdGhlIHBhcmFtc1xuICAgKiBVc2VkIG9uY2UgYXQgdGhlIHN0YXJ0ICh0b3RhbCByZXNldCkgYW5kIGZvciB0aGUgcmVwZWF0IGVmZmVjdCAocGFydGlhbCByZXNldClcbiAgICovXG4gIHRoaXMucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTaG9ydGVyIHJlZmVyZW5jZVxuICAgIHZhciBwID0gdGhpcy5fcGFyYW1zO1xuXG4gICAgX3BlcmlvZCAgICAgICA9IDEwMCAvIChwWydmJ10gKiBwWydmJ10gKyAuMDAxKTtcbiAgICBfbWF4UGVyaW9kICAgID0gMTAwIC8gKHBbJ2cnXSAgICogcFsnZyddICAgKyAuMDAxKTtcblxuICAgIF9zbGlkZSAgICAgICAgPSAxIC0gcFsnaCddICogcFsnaCddICogcFsnaCddICogLjAxO1xuICAgIF9kZWx0YVNsaWRlICAgPSAtcFsnaSddICogcFsnaSddICogcFsnaSddICogLjAwMDAwMTtcblxuICAgIGlmICghcFsnYSddKSB7XG4gICAgICBfc3F1YXJlRHV0eSA9IC41IC0gcFsnbiddIC8gMjtcbiAgICAgIF9kdXR5U3dlZXAgID0gLXBbJ28nXSAqIC4wMDAwNTtcbiAgICB9XG5cbiAgICBfY2hhbmdlQW1vdW50ID0gIDEgKyBwWydsJ10gKiBwWydsJ10gKiAocFsnbCddID4gMCA/IC0uOSA6IDEwKTtcbiAgICBfY2hhbmdlVGltZSAgID0gMDtcbiAgICBfY2hhbmdlTGltaXQgID0gcFsnbSddID09IDEgPyAwIDogKDEgLSBwWydtJ10pICogKDEgLSBwWydtJ10pICogMjAwMDAgKyAzMjtcbiAgfVxuXG4gIC8vIEkgc3BsaXQgdGhlIHJlc2V0KCkgZnVuY3Rpb24gaW50byB0d28gZnVuY3Rpb25zIGZvciBiZXR0ZXIgcmVhZGFiaWxpdHlcbiAgdGhpcy50b3RhbFJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgLy8gU2hvcnRlciByZWZlcmVuY2VcbiAgICB2YXIgcCA9IHRoaXMuX3BhcmFtcztcblxuICAgIC8vIENhbGN1bGF0aW5nIHRoZSBsZW5ndGggaXMgYWxsIHRoYXQgcmVtYWluZWQgaGVyZSwgZXZlcnl0aGluZyBlbHNlIG1vdmVkIHNvbWV3aGVyZVxuICAgIF9lbnZlbG9wZUxlbmd0aDAgPSBwWydiJ10gICogcFsnYiddICAqIDEwMDAwMDtcbiAgICBfZW52ZWxvcGVMZW5ndGgxID0gcFsnYyddICogcFsnYyddICogMTAwMDAwO1xuICAgIF9lbnZlbG9wZUxlbmd0aDIgPSBwWydlJ10gICAqIHBbJ2UnXSAgICogMTAwMDAwICsgMTI7XG4gICAgLy8gRnVsbCBsZW5ndGggb2YgdGhlIHZvbHVtZSBlbnZlbG9wIChhbmQgdGhlcmVmb3JlIHNvdW5kKVxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgbGVuZ3RoIGNhbiBiZSBkaXZpZGVkIGJ5IDMgc28gd2Ugd2lsbCBub3QgbmVlZCB0aGUgcGFkZGluZyBcIj09XCIgYWZ0ZXIgYmFzZTY0IGVuY29kZVxuICAgIHJldHVybiAoKF9lbnZlbG9wZUxlbmd0aDAgKyBfZW52ZWxvcGVMZW5ndGgxICsgX2VudmVsb3BlTGVuZ3RoMikgLyAzIHwgMCkgKiAzO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlcyB0aGUgd2F2ZSB0byB0aGUgc3VwcGxpZWQgYnVmZmVyIEJ5dGVBcnJheVxuICAgKiBAcGFyYW0gYnVmZmVyIEEgQnl0ZUFycmF5IHRvIHdyaXRlIHRoZSB3YXZlIHRvXG4gICAqIEByZXR1cm4gSWYgdGhlIHdhdmUgaXMgZmluaXNoZWRcbiAgICovXG4gIHRoaXMuc3ludGhXYXZlID0gZnVuY3Rpb24oYnVmZmVyLCBsZW5ndGgpIHtcbiAgICAvLyBTaG9ydGVyIHJlZmVyZW5jZVxuICAgIHZhciBwID0gdGhpcy5fcGFyYW1zO1xuXG4gICAgLy8gSWYgdGhlIGZpbHRlcnMgYXJlIGFjdGl2ZVxuICAgIHZhciBfZmlsdGVycyA9IHBbJ3MnXSAhPSAxIHx8IHBbJ3YnXSxcbiAgICAgICAgLy8gQ3V0b2ZmIG11bHRpcGxpZXIgd2hpY2ggYWRqdXN0cyB0aGUgYW1vdW50IHRoZSB3YXZlIHBvc2l0aW9uIGNhbiBtb3ZlXG4gICAgICAgIF9ocEZpbHRlckN1dG9mZiA9IHBbJ3YnXSAqIHBbJ3YnXSAqIC4xLFxuICAgICAgICAvLyBTcGVlZCBvZiB0aGUgaGlnaC1wYXNzIGN1dG9mZiBtdWx0aXBsaWVyXG4gICAgICAgIF9ocEZpbHRlckRlbHRhQ3V0b2ZmID0gMSArIHBbJ3cnXSAqIC4wMDAzLFxuICAgICAgICAvLyBDdXRvZmYgbXVsdGlwbGllciB3aGljaCBhZGp1c3RzIHRoZSBhbW91bnQgdGhlIHdhdmUgcG9zaXRpb24gY2FuIG1vdmVcbiAgICAgICAgX2xwRmlsdGVyQ3V0b2ZmID0gcFsncyddICogcFsncyddICogcFsncyddICogLjEsXG4gICAgICAgIC8vIFNwZWVkIG9mIHRoZSBsb3ctcGFzcyBjdXRvZmYgbXVsdGlwbGllclxuICAgICAgICBfbHBGaWx0ZXJEZWx0YUN1dG9mZiA9IDEgKyBwWyd0J10gKiAuMDAwMSxcbiAgICAgICAgLy8gSWYgdGhlIGxvdyBwYXNzIGZpbHRlciBpcyBhY3RpdmVcbiAgICAgICAgX2xwRmlsdGVyT24gPSBwWydzJ10gIT0gMSxcbiAgICAgICAgLy8gbWFzdGVyVm9sdW1lICogbWFzdGVyVm9sdW1lIChmb3IgcXVpY2sgY2FsY3VsYXRpb25zKVxuICAgICAgICBfbWFzdGVyVm9sdW1lID0gcFsneCddICogcFsneCddLFxuICAgICAgICAvLyBNaW5pbXVtIGZyZXF1ZW5jeSBiZWZvcmUgc3RvcHBpbmdcbiAgICAgICAgX21pbkZyZXFlbmN5ID0gcFsnZyddLFxuICAgICAgICAvLyBJZiB0aGUgcGhhc2VyIGlzIGFjdGl2ZVxuICAgICAgICBfcGhhc2VyID0gcFsncSddIHx8IHBbJ3InXSxcbiAgICAgICAgLy8gQ2hhbmdlIGluIHBoYXNlIG9mZnNldFxuICAgICAgICBfcGhhc2VyRGVsdGFPZmZzZXQgPSBwWydyJ10gKiBwWydyJ10gKiBwWydyJ10gKiAuMixcbiAgICAgICAgLy8gUGhhc2Ugb2Zmc2V0IGZvciBwaGFzZXIgZWZmZWN0XG4gICAgICAgIF9waGFzZXJPZmZzZXQgPSBwWydxJ10gKiBwWydxJ10gKiAocFsncSddIDwgMCA/IC0xMDIwIDogMTAyMCksXG4gICAgICAgIC8vIE9uY2UgdGhlIHRpbWUgcmVhY2hlcyB0aGlzIGxpbWl0LCBzb21lIG9mIHRoZSAgICBpYWJsZXMgYXJlIHJlc2V0XG4gICAgICAgIF9yZXBlYXRMaW1pdCA9IHBbJ3AnXSA/ICgoMSAtIHBbJ3AnXSkgKiAoMSAtIHBbJ3AnXSkgKiAyMDAwMCB8IDApICsgMzIgOiAwLFxuICAgICAgICAvLyBUaGUgcHVuY2ggZmFjdG9yIChsb3VkZXIgYXQgYmVnaW5pbmcgb2Ygc3VzdGFpbilcbiAgICAgICAgX3N1c3RhaW5QdW5jaCA9IHBbJ2QnXSxcbiAgICAgICAgLy8gQW1vdW50IHRvIGNoYW5nZSB0aGUgcGVyaW9kIG9mIHRoZSB3YXZlIGJ5IGF0IHRoZSBwZWFrIG9mIHRoZSB2aWJyYXRvIHdhdmVcbiAgICAgICAgX3ZpYnJhdG9BbXBsaXR1ZGUgPSBwWydqJ10gLyAyLFxuICAgICAgICAvLyBTcGVlZCBhdCB3aGljaCB0aGUgdmlicmF0byBwaGFzZSBtb3Zlc1xuICAgICAgICBfdmlicmF0b1NwZWVkID0gcFsnayddICogcFsnayddICogLjAxLFxuICAgICAgICAvLyBUaGUgdHlwZSBvZiB3YXZlIHRvIGdlbmVyYXRlXG4gICAgICAgIF93YXZlVHlwZSA9IHBbJ2EnXTtcblxuICAgIHZhciBfZW52ZWxvcGVMZW5ndGggICAgICA9IF9lbnZlbG9wZUxlbmd0aDAsICAgICAvLyBMZW5ndGggb2YgdGhlIGN1cnJlbnQgZW52ZWxvcGUgc3RhZ2VcbiAgICAgICAgX2VudmVsb3BlT3Zlckxlbmd0aDAgPSAxIC8gX2VudmVsb3BlTGVuZ3RoMCwgLy8gKGZvciBxdWljayBjYWxjdWxhdGlvbnMpXG4gICAgICAgIF9lbnZlbG9wZU92ZXJMZW5ndGgxID0gMSAvIF9lbnZlbG9wZUxlbmd0aDEsIC8vIChmb3IgcXVpY2sgY2FsY3VsYXRpb25zKVxuICAgICAgICBfZW52ZWxvcGVPdmVyTGVuZ3RoMiA9IDEgLyBfZW52ZWxvcGVMZW5ndGgyOyAvLyAoZm9yIHF1aWNrIGNhbGN1bGF0aW9ucylcblxuICAgIC8vIERhbXBpbmcgbXVsaXBsaWVyIHdoaWNoIHJlc3RyaWN0cyBob3cgZmFzdCB0aGUgd2F2ZSBwb3NpdGlvbiBjYW4gbW92ZVxuICAgIHZhciBfbHBGaWx0ZXJEYW1waW5nID0gNSAvICgxICsgcFsndSddICogcFsndSddICogMjApICogKC4wMSArIF9scEZpbHRlckN1dG9mZik7XG4gICAgaWYgKF9scEZpbHRlckRhbXBpbmcgPiAuOCkge1xuICAgICAgX2xwRmlsdGVyRGFtcGluZyA9IC44O1xuICAgIH1cbiAgICBfbHBGaWx0ZXJEYW1waW5nID0gMSAtIF9scEZpbHRlckRhbXBpbmc7XG5cbiAgICB2YXIgX2ZpbmlzaGVkID0gZmFsc2UsICAgICAvLyBJZiB0aGUgc291bmQgaGFzIGZpbmlzaGVkXG4gICAgICAgIF9lbnZlbG9wZVN0YWdlICAgID0gMCwgLy8gQ3VycmVudCBzdGFnZSBvZiB0aGUgZW52ZWxvcGUgKGF0dGFjaywgc3VzdGFpbiwgZGVjYXksIGVuZClcbiAgICAgICAgX2VudmVsb3BlVGltZSAgICAgPSAwLCAvLyBDdXJyZW50IHRpbWUgdGhyb3VnaCBjdXJyZW50IGVuZWxvcGUgc3RhZ2VcbiAgICAgICAgX2VudmVsb3BlVm9sdW1lICAgPSAwLCAvLyBDdXJyZW50IHZvbHVtZSBvZiB0aGUgZW52ZWxvcGVcbiAgICAgICAgX2hwRmlsdGVyUG9zICAgICAgPSAwLCAvLyBBZGp1c3RlZCB3YXZlIHBvc2l0aW9uIGFmdGVyIGhpZ2gtcGFzcyBmaWx0ZXJcbiAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgPSAwLCAvLyBDaGFuZ2UgaW4gbG93LXBhc3Mgd2F2ZSBwb3NpdGlvbiwgYXMgYWxsb3dlZCBieSB0aGUgY3V0b2ZmIGFuZCBkYW1waW5nXG4gICAgICAgIF9scEZpbHRlck9sZFBvcywgICAgICAgLy8gUHJldmlvdXMgbG93LXBhc3Mgd2F2ZSBwb3NpdGlvblxuICAgICAgICBfbHBGaWx0ZXJQb3MgICAgICA9IDAsIC8vIEFkanVzdGVkIHdhdmUgcG9zaXRpb24gYWZ0ZXIgbG93LXBhc3MgZmlsdGVyXG4gICAgICAgIF9wZXJpb2RUZW1wLCAgICAgICAgICAgLy8gUGVyaW9kIG1vZGlmaWVkIGJ5IHZpYnJhdG9cbiAgICAgICAgX3BoYXNlICAgICAgICAgICAgPSAwLCAvLyBQaGFzZSB0aHJvdWdoIHRoZSB3YXZlXG4gICAgICAgIF9waGFzZXJJbnQsICAgICAgICAgICAgLy8gSW50ZWdlciBwaGFzZXIgb2Zmc2V0LCBmb3IgYml0IG1hdGhzXG4gICAgICAgIF9waGFzZXJQb3MgICAgICAgID0gMCwgLy8gUG9zaXRpb24gdGhyb3VnaCB0aGUgcGhhc2VyIGJ1ZmZlclxuICAgICAgICBfcG9zLCAgICAgICAgICAgICAgICAgIC8vIFBoYXNlIGV4cHJlc2VkIGFzIGEgTnVtYmVyIGZyb20gMC0xLCB1c2VkIGZvciBmYXN0IHNpbiBhcHByb3hcbiAgICAgICAgX3JlcGVhdFRpbWUgICAgICAgPSAwLCAvLyBDb3VudGVyIGZvciB0aGUgcmVwZWF0c1xuICAgICAgICBfc2FtcGxlLCAgICAgICAgICAgICAgIC8vIFN1Yi1zYW1wbGUgY2FsY3VsYXRlZCA4IHRpbWVzIHBlciBhY3R1YWwgc2FtcGxlLCBhdmVyYWdlZCBvdXQgdG8gZ2V0IHRoZSBzdXBlciBzYW1wbGVcbiAgICAgICAgX3N1cGVyU2FtcGxlLCAgICAgICAgICAvLyBBY3R1YWwgc2FtcGxlIHdyaXRlbiB0byB0aGUgd2F2ZVxuICAgICAgICBfdmlicmF0b1BoYXNlICAgICA9IDA7IC8vIFBoYXNlIHRocm91Z2ggdGhlIHZpYnJhdG8gc2luZSB3YXZlXG5cbiAgICAvLyBCdWZmZXIgb2Ygd2F2ZSB2YWx1ZXMgdXNlZCB0byBjcmVhdGUgdGhlIG91dCBvZiBwaGFzZSBzZWNvbmQgd2F2ZVxuICAgIHZhciBfcGhhc2VyQnVmZmVyID0gbmV3IEFycmF5KDEwMjQpLFxuICAgICAgICAvLyBCdWZmZXIgb2YgcmFuZG9tIHZhbHVlcyB1c2VkIHRvIGdlbmVyYXRlIG5vaXNlXG4gICAgICAgIF9ub2lzZUJ1ZmZlciAgPSBuZXcgQXJyYXkoMzIpO1xuICAgIGZvciAodmFyIGkgPSBfcGhhc2VyQnVmZmVyLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgIF9waGFzZXJCdWZmZXJbaV0gPSAwO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gX25vaXNlQnVmZmVyLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgIF9ub2lzZUJ1ZmZlcltpXSA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoX2ZpbmlzaGVkKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBlYXRzIGV2ZXJ5IF9yZXBlYXRMaW1pdCB0aW1lcywgcGFydGlhbGx5IHJlc2V0dGluZyB0aGUgc291bmQgcGFyYW1ldGVyc1xuICAgICAgaWYgKF9yZXBlYXRMaW1pdCkge1xuICAgICAgICBpZiAoKytfcmVwZWF0VGltZSA+PSBfcmVwZWF0TGltaXQpIHtcbiAgICAgICAgICBfcmVwZWF0VGltZSA9IDA7XG4gICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIF9jaGFuZ2VMaW1pdCBpcyByZWFjaGVkLCBzaGlmdHMgdGhlIHBpdGNoXG4gICAgICBpZiAoX2NoYW5nZUxpbWl0KSB7XG4gICAgICAgIGlmICgrK19jaGFuZ2VUaW1lID49IF9jaGFuZ2VMaW1pdCkge1xuICAgICAgICAgIF9jaGFuZ2VMaW1pdCA9IDA7XG4gICAgICAgICAgX3BlcmlvZCAqPSBfY2hhbmdlQW1vdW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFjY2NlbGVyYXRlIGFuZCBhcHBseSBzbGlkZVxuICAgICAgX3NsaWRlICs9IF9kZWx0YVNsaWRlO1xuICAgICAgX3BlcmlvZCAqPSBfc2xpZGU7XG5cbiAgICAgIC8vIENoZWNrcyBmb3IgZnJlcXVlbmN5IGdldHRpbmcgdG9vIGxvdywgYW5kIHN0b3BzIHRoZSBzb3VuZCBpZiBhIG1pbkZyZXF1ZW5jeSB3YXMgc2V0XG4gICAgICBpZiAoX3BlcmlvZCA+IF9tYXhQZXJpb2QpIHtcbiAgICAgICAgX3BlcmlvZCA9IF9tYXhQZXJpb2Q7XG4gICAgICAgIGlmIChfbWluRnJlcWVuY3kgPiAwKSB7XG4gICAgICAgICAgX2ZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBfcGVyaW9kVGVtcCA9IF9wZXJpb2Q7XG5cbiAgICAgIC8vIEFwcGxpZXMgdGhlIHZpYnJhdG8gZWZmZWN0XG4gICAgICBpZiAoX3ZpYnJhdG9BbXBsaXR1ZGUgPiAwKSB7XG4gICAgICAgIF92aWJyYXRvUGhhc2UgKz0gX3ZpYnJhdG9TcGVlZDtcbiAgICAgICAgX3BlcmlvZFRlbXAgKj0gMSArIE1hdGguc2luKF92aWJyYXRvUGhhc2UpICogX3ZpYnJhdG9BbXBsaXR1ZGU7XG4gICAgICB9XG5cbiAgICAgIF9wZXJpb2RUZW1wIHw9IDA7XG4gICAgICBpZiAoX3BlcmlvZFRlbXAgPCA4KSB7XG4gICAgICAgIF9wZXJpb2RUZW1wID0gODtcbiAgICAgIH1cblxuICAgICAgLy8gU3dlZXBzIHRoZSBzcXVhcmUgZHV0eVxuICAgICAgaWYgKCFfd2F2ZVR5cGUpIHtcbiAgICAgICAgX3NxdWFyZUR1dHkgKz0gX2R1dHlTd2VlcDtcbiAgICAgICAgaWYgKF9zcXVhcmVEdXR5IDwgMCkge1xuICAgICAgICAgIF9zcXVhcmVEdXR5ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChfc3F1YXJlRHV0eSA+IC41KSB7XG4gICAgICAgICAgX3NxdWFyZUR1dHkgPSAuNTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNb3ZlcyB0aHJvdWdoIHRoZSBkaWZmZXJlbnQgc3RhZ2VzIG9mIHRoZSB2b2x1bWUgZW52ZWxvcGVcbiAgICAgIGlmICgrK19lbnZlbG9wZVRpbWUgPiBfZW52ZWxvcGVMZW5ndGgpIHtcbiAgICAgICAgX2VudmVsb3BlVGltZSA9IDA7XG5cbiAgICAgICAgc3dpdGNoICgrK19lbnZlbG9wZVN0YWdlKSAge1xuICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIF9lbnZlbG9wZUxlbmd0aCA9IF9lbnZlbG9wZUxlbmd0aDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBfZW52ZWxvcGVMZW5ndGggPSBfZW52ZWxvcGVMZW5ndGgyO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHZvbHVtZSBiYXNlZCBvbiB0aGUgcG9zaXRpb24gaW4gdGhlIGVudmVsb3BlXG4gICAgICBzd2l0Y2ggKF9lbnZlbG9wZVN0YWdlKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBfZW52ZWxvcGVWb2x1bWUgPSBfZW52ZWxvcGVUaW1lICogX2VudmVsb3BlT3Zlckxlbmd0aDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBfZW52ZWxvcGVWb2x1bWUgPSAxICsgKDEgLSBfZW52ZWxvcGVUaW1lICogX2VudmVsb3BlT3Zlckxlbmd0aDEpICogMiAqIF9zdXN0YWluUHVuY2g7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBfZW52ZWxvcGVWb2x1bWUgPSAxIC0gX2VudmVsb3BlVGltZSAqIF9lbnZlbG9wZU92ZXJMZW5ndGgyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gMDtcbiAgICAgICAgICBfZmluaXNoZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBNb3ZlcyB0aGUgcGhhc2VyIG9mZnNldFxuICAgICAgaWYgKF9waGFzZXIpIHtcbiAgICAgICAgX3BoYXNlck9mZnNldCArPSBfcGhhc2VyRGVsdGFPZmZzZXQ7XG4gICAgICAgIF9waGFzZXJJbnQgPSBfcGhhc2VyT2Zmc2V0IHwgMDtcbiAgICAgICAgaWYgKF9waGFzZXJJbnQgPCAwKSB7XG4gICAgICAgICAgX3BoYXNlckludCA9IC1fcGhhc2VySW50O1xuICAgICAgICB9IGVsc2UgaWYgKF9waGFzZXJJbnQgPiAxMDIzKSB7XG4gICAgICAgICAgX3BoYXNlckludCA9IDEwMjM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTW92ZXMgdGhlIGhpZ2gtcGFzcyBmaWx0ZXIgY3V0b2ZmXG4gICAgICBpZiAoX2ZpbHRlcnMgJiYgX2hwRmlsdGVyRGVsdGFDdXRvZmYpIHtcbiAgICAgICAgX2hwRmlsdGVyQ3V0b2ZmICo9IF9ocEZpbHRlckRlbHRhQ3V0b2ZmO1xuICAgICAgICBpZiAoX2hwRmlsdGVyQ3V0b2ZmIDwgLjAwMDAxKSB7XG4gICAgICAgICAgX2hwRmlsdGVyQ3V0b2ZmID0gLjAwMDAxO1xuICAgICAgICB9IGVsc2UgaWYgKF9ocEZpbHRlckN1dG9mZiA+IC4xKSB7XG4gICAgICAgICAgX2hwRmlsdGVyQ3V0b2ZmID0gLjE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgX3N1cGVyU2FtcGxlID0gMDtcbiAgICAgIGZvciAodmFyIGogPSA4OyBqLS07ICkge1xuICAgICAgICAvLyBDeWNsZXMgdGhyb3VnaCB0aGUgcGVyaW9kXG4gICAgICAgIF9waGFzZSsrO1xuICAgICAgICBpZiAoX3BoYXNlID49IF9wZXJpb2RUZW1wKSB7XG4gICAgICAgICAgX3BoYXNlICU9IF9wZXJpb2RUZW1wO1xuXG4gICAgICAgICAgLy8gR2VuZXJhdGVzIG5ldyByYW5kb20gbm9pc2UgZm9yIHRoaXMgcGVyaW9kXG4gICAgICAgICAgaWYgKF93YXZlVHlwZSA9PSAzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gX25vaXNlQnVmZmVyLmxlbmd0aDsgbi0tOyApIHtcbiAgICAgICAgICAgICAgX25vaXNlQnVmZmVyW25dID0gTWF0aC5yYW5kb20oKSAqIDIgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldHMgdGhlIHNhbXBsZSBmcm9tIHRoZSBvc2NpbGxhdG9yXG4gICAgICAgIHN3aXRjaCAoX3dhdmVUeXBlKSB7XG4gICAgICAgICAgY2FzZSAwOiAvLyBTcXVhcmUgd2F2ZVxuICAgICAgICAgICAgX3NhbXBsZSA9ICgoX3BoYXNlIC8gX3BlcmlvZFRlbXApIDwgX3NxdWFyZUR1dHkpID8gLjUgOiAtLjU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDE6IC8vIFNhdyB3YXZlXG4gICAgICAgICAgICBfc2FtcGxlID0gMSAtIF9waGFzZSAvIF9wZXJpb2RUZW1wICogMjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMjogLy8gU2luZSB3YXZlIChmYXN0IGFuZCBhY2N1cmF0ZSBhcHByb3gpXG4gICAgICAgICAgICBfcG9zID0gX3BoYXNlIC8gX3BlcmlvZFRlbXA7XG4gICAgICAgICAgICBfcG9zID0gKF9wb3MgPiAuNSA/IF9wb3MgLSAxIDogX3BvcykgKiA2LjI4MzE4NTMxO1xuICAgICAgICAgICAgX3NhbXBsZSA9IDEuMjczMjM5NTQgKiBfcG9zICsgLjQwNTI4NDczNSAqIF9wb3MgKiBfcG9zICogKF9wb3MgPCAwID8gMSA6IC0xKTtcbiAgICAgICAgICAgIF9zYW1wbGUgPSAuMjI1ICogKChfc2FtcGxlIDwgMCA/IC0xIDogMSkgKiBfc2FtcGxlICogX3NhbXBsZSAgLSBfc2FtcGxlKSArIF9zYW1wbGU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM6IC8vIE5vaXNlXG4gICAgICAgICAgICBfc2FtcGxlID0gX25vaXNlQnVmZmVyW01hdGguYWJzKF9waGFzZSAqIDMyIC8gX3BlcmlvZFRlbXAgfCAwKV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBcHBsaWVzIHRoZSBsb3cgYW5kIGhpZ2ggcGFzcyBmaWx0ZXJzXG4gICAgICAgIGlmIChfZmlsdGVycykge1xuICAgICAgICAgIF9scEZpbHRlck9sZFBvcyA9IF9scEZpbHRlclBvcztcbiAgICAgICAgICBfbHBGaWx0ZXJDdXRvZmYgKj0gX2xwRmlsdGVyRGVsdGFDdXRvZmY7XG4gICAgICAgICAgaWYgKF9scEZpbHRlckN1dG9mZiA8IDApIHtcbiAgICAgICAgICAgIF9scEZpbHRlckN1dG9mZiA9IDA7XG4gICAgICAgICAgfSBlbHNlIGlmIChfbHBGaWx0ZXJDdXRvZmYgPiAuMSkge1xuICAgICAgICAgICAgX2xwRmlsdGVyQ3V0b2ZmID0gLjE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9scEZpbHRlck9uKSB7XG4gICAgICAgICAgICBfbHBGaWx0ZXJEZWx0YVBvcyArPSAoX3NhbXBsZSAtIF9scEZpbHRlclBvcykgKiBfbHBGaWx0ZXJDdXRvZmY7XG4gICAgICAgICAgICBfbHBGaWx0ZXJEZWx0YVBvcyAqPSBfbHBGaWx0ZXJEYW1waW5nO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfbHBGaWx0ZXJQb3MgPSBfc2FtcGxlO1xuICAgICAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgPSAwO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF9scEZpbHRlclBvcyArPSBfbHBGaWx0ZXJEZWx0YVBvcztcblxuICAgICAgICAgIF9ocEZpbHRlclBvcyArPSBfbHBGaWx0ZXJQb3MgLSBfbHBGaWx0ZXJPbGRQb3M7XG4gICAgICAgICAgX2hwRmlsdGVyUG9zICo9IDEgLSBfaHBGaWx0ZXJDdXRvZmY7XG4gICAgICAgICAgX3NhbXBsZSA9IF9ocEZpbHRlclBvcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFwcGxpZXMgdGhlIHBoYXNlciBlZmZlY3RcbiAgICAgICAgaWYgKF9waGFzZXIpIHtcbiAgICAgICAgICBfcGhhc2VyQnVmZmVyW19waGFzZXJQb3MgJSAxMDI0XSA9IF9zYW1wbGU7XG4gICAgICAgICAgX3NhbXBsZSArPSBfcGhhc2VyQnVmZmVyWyhfcGhhc2VyUG9zIC0gX3BoYXNlckludCArIDEwMjQpICUgMTAyNF07XG4gICAgICAgICAgX3BoYXNlclBvcysrO1xuICAgICAgICB9XG5cbiAgICAgICAgX3N1cGVyU2FtcGxlICs9IF9zYW1wbGU7XG4gICAgICB9XG5cbiAgICAgIC8vIEF2ZXJhZ2VzIG91dCB0aGUgc3VwZXIgc2FtcGxlcyBhbmQgYXBwbGllcyB2b2x1bWVzXG4gICAgICBfc3VwZXJTYW1wbGUgKj0gLjEyNSAqIF9lbnZlbG9wZVZvbHVtZSAqIF9tYXN0ZXJWb2x1bWU7XG5cbiAgICAgIC8vIENsaXBwaW5nIGlmIHRvbyBsb3VkXG4gICAgICBidWZmZXJbaV0gPSBfc3VwZXJTYW1wbGUgPj0gMSA/IDMyNzY3IDogX3N1cGVyU2FtcGxlIDw9IC0xID8gLTMyNzY4IDogX3N1cGVyU2FtcGxlICogMzI3NjcgfCAwO1xuICAgIH1cblxuICAgIHJldHVybiBsZW5ndGg7XG4gIH1cbn1cblxuLy8gQWRhcHRlZCBmcm9tIGh0dHA6Ly9jb2RlYmFzZS5lcy9yaWZmd2F2ZS9cbnZhciBzeW50aCA9IG5ldyBTZnhyU3ludGgoKTtcblxuLy8gRXhwb3J0IGZvciB0aGUgQ2xvc3VyZSBDb21waWxlclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZXR0aW5ncykge1xuICAvLyBJbml0aWFsaXplIFNmeHJQYXJhbXNcbiAgc3ludGguX3BhcmFtcy5zZXRTZXR0aW5ncyhzZXR0aW5ncyk7XG4gIC8vIFN5bnRoZXNpemUgV2F2ZVxuICB2YXIgZW52ZWxvcGVGdWxsTGVuZ3RoID0gc3ludGgudG90YWxSZXNldCgpO1xuICB2YXIgZGF0YSA9IG5ldyBVaW50OEFycmF5KCgoZW52ZWxvcGVGdWxsTGVuZ3RoICsgMSkgLyAyIHwgMCkgKiA0ICsgNDQpO1xuICB2YXIgdXNlZCA9IHN5bnRoLnN5bnRoV2F2ZShuZXcgVWludDE2QXJyYXkoZGF0YS5idWZmZXIsIDQ0KSwgZW52ZWxvcGVGdWxsTGVuZ3RoKSAqIDI7XG4gIHZhciBkdiA9IG5ldyBVaW50MzJBcnJheShkYXRhLmJ1ZmZlciwgMCwgNDQpO1xuICAvLyBJbml0aWFsaXplIGhlYWRlclxuICBkdlswXSA9IDB4NDY0NjQ5NTI7IC8vIFwiUklGRlwiXG4gIGR2WzFdID0gdXNlZCArIDM2OyAgLy8gcHV0IHRvdGFsIHNpemUgaGVyZVxuICBkdlsyXSA9IDB4NDU1NjQxNTc7IC8vIFwiV0FWRVwiXG4gIGR2WzNdID0gMHgyMDc0NkQ2NjsgLy8gXCJmbXQgXCJcbiAgZHZbNF0gPSAweDAwMDAwMDEwOyAvLyBzaXplIG9mIHRoZSBmb2xsb3dpbmdcbiAgZHZbNV0gPSAweDAwMDEwMDAxOyAvLyBNb25vOiAxIGNoYW5uZWwsIFBDTSBmb3JtYXRcbiAgZHZbNl0gPSAweDAwMDBBQzQ0OyAvLyA0NCwxMDAgc2FtcGxlcyBwZXIgc2Vjb25kXG4gIGR2WzddID0gMHgwMDAxNTg4ODsgLy8gYnl0ZSByYXRlOiB0d28gYnl0ZXMgcGVyIHNhbXBsZVxuICBkdls4XSA9IDB4MDAxMDAwMDI7IC8vIDE2IGJpdHMgcGVyIHNhbXBsZSwgYWxpZ25lZCBvbiBldmVyeSB0d28gYnl0ZXNcbiAgZHZbOV0gPSAweDYxNzQ2MTY0OyAvLyBcImRhdGFcIlxuICBkdlsxMF0gPSB1c2VkOyAgICAgIC8vIHB1dCBudW1iZXIgb2Ygc2FtcGxlcyBoZXJlXG5cbiAgLy8gQmFzZTY0IGVuY29kaW5nIHdyaXR0ZW4gYnkgbWUsIEBtYWV0dGlnXG4gIHVzZWQgKz0gNDQ7XG4gIHZhciBpID0gMCxcbiAgICAgIGJhc2U2NENoYXJhY3RlcnMgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLycsXG4gICAgICBvdXRwdXQgPSAnZGF0YTphdWRpby93YXY7YmFzZTY0LCc7XG4gIGZvciAoOyBpIDwgdXNlZDsgaSArPSAzKVxuICB7XG4gICAgdmFyIGEgPSBkYXRhW2ldIDw8IDE2IHwgZGF0YVtpICsgMV0gPDwgOCB8IGRhdGFbaSArIDJdO1xuICAgIG91dHB1dCArPSBiYXNlNjRDaGFyYWN0ZXJzW2EgPj4gMThdICsgYmFzZTY0Q2hhcmFjdGVyc1thID4+IDEyICYgNjNdICsgYmFzZTY0Q2hhcmFjdGVyc1thID4+IDYgJiA2M10gKyBiYXNlNjRDaGFyYWN0ZXJzW2EgJiA2M107XG4gIH1cbiAgcmV0dXJuIG91dHB1dDtcbn1cbiIsIi8qXG4gUGFydGljbGUgRW1pdHRlclxuXHRCYXNlZCBvbiBQYXJjeWNsZTogYnkgTXIgU3BlYWtlciAtIHd3dy5tcnNwZWFrZXIubmV0XG5cdHdoaWNoIGlzIGJhc2VkIG9uIHRoZSBjb2RlIGZyb20gNzFzcXVhcmVkLmNvbSBpUGhvbmUgdHV0b3JpYWxzXG5cbiAgTW9kaWZpZWQ6XG4gICAgZm9yY2VQb2ludHMgdG8gcHVzaCBhbmQgcHVsbCBwYXJ0aWNsZXNcbiAgICB3aW5kIGZ1bmN0aW9uXG4gICAgcmVuZGVyIHBhcnRpY2xlIG1ldGhvZFxuKi9cblxuXG5cbi8qIFZlY3RvciBIZWxwZXIgKi9cbnZhciB2ZWN0b3JfY3JlYXRlPWZ1bmN0aW9uKCB4LCB5ICl7XG4gICAgcmV0dXJuIHt4OnggfHwgMCx5OiB5IHx8IDAsXG4gICAgXHRzY2FsZTogZnVuY3Rpb24ocykgeyB0aGlzLnggKj0gczsgdGhpcy55ICo9IHN9LFxuICAgIFx0YWRkOiBmdW5jdGlvbih2KSB7dGhpcy54ICs9IHYueDsgdGhpcy55ICs9IHYueX0sXG4gICAgXHRzdWI6IGZ1bmN0aW9uKHYpIHt0aGlzLnggLT0gdi54OyB0aGlzLnkgLT0gdi55fVxuLy8gICAgXHQsbGVuMjogZnVuY3Rpb24oKSB7cmV0dXJuIHNxKHRoaXMueCkrc3EodGhpcy55KX1cbiAgICB9XG59LFxuXG52ZWN0b3JfbXVsdGlwbHk9IGZ1bmN0aW9uKCB2ZWN0b3IsIHNjYWxlRmFjdG9yICl7XG4gICAgcmV0dXJuIHZlY3Rvcl9jcmVhdGUodmVjdG9yLnggKiBzY2FsZUZhY3RvcixcbiAgICAgICAgICAgIHZlY3Rvci55ICogc2NhbGVGYWN0b3IpO1xufSxcbnZlY3Rvcl9hZGQgPSBmdW5jdGlvbiggdmVjdG9yMSwgdmVjdG9yMiApe1xuICAgIHJldHVybiB2ZWN0b3JfY3JlYXRlKHZlY3RvcjEueCArIHZlY3RvcjIueCxcbiAgICAgICAgICAgIHZlY3RvcjEueSArIHZlY3RvcjIueSk7XG59LFxudmVjdG9yX3N1YiA9IGZ1bmN0aW9uICh2ZWN0b3IxLCB2ZWN0b3IyKSB7XG4gICAgcmV0dXJuIHZlY3Rvcl9jcmVhdGUodmVjdG9yMS54IC0gdmVjdG9yMi54LFxuICAgICAgICAgICAgdmVjdG9yMS55IC0gdmVjdG9yMi55KTtcbn0sXG4vL3ZlY3Rvcl9sZW4yPSBmdW5jdGlvbih2ZWN0b3IpIHtcbi8vICAgIHJldHVybiBzcSh2ZWN0b3IueCkgKyBzcSh2ZWN0b3IueSk7XG4vL31cbnJnYmEgPSBmdW5jdGlvbihhcnIsIGFscGhhT3ZlcnJpZGUpIHtcblx0cmV0dXJuIFwicmdiYShcIitbICBtaW5tYXgoMCxVOCwgYXJyWyAwIF18MCksXG4gICAgICAgICAgICAgICAgICAgICAgbWlubWF4KDAsVTgsIGFyclsgMSBdfDApLFxuICAgICAgICAgICAgICAgICAgICAgIG1pbm1heCgwLFU4LCBhcnJbIDIgXXwwKSxcbiAgICAgICAgICAgICAgICAgICAgICBtaW5tYXgoMCwxLCBhbHBoYU92ZXJyaWRlIT11bmRlZmluZWQ/IGFscGhhT3ZlcnJpZGUgOiBhcnJbIDMgXS50b0ZpeGVkKDIpKV0uam9pbignLCcpICsgXCIpXCI7XG59LFxuXG4vLyBJbmRpdmlkdWFsIHBhcnRpY2xlXG5QYXJ0aWNsZSA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdC8vIHJlYWxseSBldmVyeXRoaW5nIGlzIG92ZXJ3cml0dGVuIC0gbm8gbmVlZCBzZXR0aW5nIGRlZmF1bHRzXG5cdCAgICBwb3NpdGlvbjogdmVjdG9yX2NyZWF0ZSgpXG4vL1x0ICAgIGRpcmVjdGlvbjogWzAsMF0sXG4vL1x0ICAgIHNpemU6IDAsXG4vL1x0ICAgIHNpemVTbWFsbDogMCxcbi8vXHQgICAgdGltZVRvTGl2ZTogMCxcbi8vXHQgICAgY29sb3I6IFtdLFxuLy9cdCAgICBkcmF3Q29sb3I6IFwiXCIsXG4vL1x0ICAgIGRlbHRhQ29sb3I6IFtdXG4vL1x0ICAgIGRlbHRhU2l6ZTogMCxcbi8vXHQgICAgc2hhcnBuZXNzOiAwLFxuXHR9XG59LFxuXG5cblBhcnRpY2xlUG9pbnRFbWl0dGVyID0gZnVuY3Rpb24obWF4UGFydGljbGVzLCBvcHRpb25zKSB7XG5cdHZhciByZXMgPSB7XG5cdFx0XHQvLyBvcHRpb25zIHdpbGwgb3ZlcnJpZGUgdGhlc2UgZGVmYXVsdHMsIG5vIG5lZWQgdG8gc2V0IHRoZW1cbi8vXHQgICAgcGFydGljbGVzOiBudWxsLFxuLy9cdCAgICBtYXhQYXJ0aWNsZXM6IG51bGwsXG5cblx0Ly8gRGVmYXVsdCBQcm9wZXJ0aWVzXG5cbi8vXHQgICAgc2l6ZTogMzAsICAgICAgICAgIC8vIGluaXRpYWwgc2l6ZSBvZiBwYXJ0aWNsZVxuLy9cdCAgICBzaXplUmFuZG9tOiAxMixcblxuLy9cdCAgICBzcGVlZDogNiwgICAgICAgICAvLyBpbml0aWFsIHNwZWVkIG9mIHBhcnRpY2xlXG4vL1x0ICAgIHNwZWVkUmFuZG9tOiAyLFxuXG4vL1x0ICAgIGFuZ2xlOiAwLCAgICAgICAgLy8gaW5pdGlhbCBkaXJlY3Rpb24gb2YgcGFydGljbGUgKGRlZ3JlZXMpXG4vL1x0ICAgIGFuZ2xlUmFuZG9tOiAxODAsXG5cbi8vXHQgICAgbGlmZVNwYW46IDgsICAgICAvLyBsaWZldGltZSBvZiBwYXJ0aWNsZSArIHVzZWQgYXMgaW5kaWNhdGlvbiBvZiBmcmVxdWVudGx5IHRvIGVtaXQgcGFydGljbGVzXG4vL1x0ICAgIGxpZmVTcGFuUmFuZG9tOiA2LFxuXG4vL1x0ICAgIHN0YXJ0Q29sb3I6IFsgMjIwLCAyMDgsIDg4LCAxIF0sICAgICAgICAgIC8vIGNvbG9yIGF0IGJlZ2luaW5nIG9mIGxpZmV0aW1lXG4vL1x0ICAgIHN0YXJ0Q29sb3JSYW5kb206IFsgNTIsIDU1LCA1OCwgMCBdLFxuLy9cdCAgICBmaW5pc2hDb2xvcjogWyAyNTUsIDQ1LCAxMCwgMCBdLFx0XHQgIC8vIGNvbG9yIGF0IGVuZCBvZiBsaWZldGltZVxuLy9cdCAgICBmaW5pc2hDb2xvclJhbmRvbTogWyA0MCwgNDAsIDQwLCAwIF0sXG5cdFx0Y29sb3JFZGdlOiAwLFx0XHRcdFx0XHRcdCAgLy8gY29sb3IgYXQgZWRnZSBvZiBwYXJ0aWNsZSBcImJhbGxcIiAtIG11c3QgYmUgemVybyBhbHBoYSwgIGZhbHNlIGZvciBzYW1lIGFzIGNvbG9yXG4vL1x0ICAgIHNoYXJwbmVzczogMzUsXHRcdFx0XHRcdFx0XHQgIC8vIGhvdyBzaGFycCAocGVyY2VudCkgd2lsbCB0aGUgcGFydGljbGUgXCJiYWxsXCIgYmUgKDAgLSB2ZXJ5IGZ1enp5KVxuLy9cdCAgICBzaGFycG5lc3NSYW5kb206IDEyLFxuXG4vL1x0ICAgIGZvcmNlUG9pbnRzOiAwLCAvLyBwYWlycyBvZiB3ZWlnaHQgYW5kIGxvY2F0aW9uLiAgcG9zaXRpdmUgd2VpZ2h0IGF0dHJhY3RzLCBuZWdhdGl2ZSB3ZWlnaHQgcHVzaGVzXG5cdCAgICB3aW5kOiAwLCAvLyBmdW5jdGlvbiByZXR1cm5pbmcgdmFsdWUgb2Ygd2luZCAtIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lXG5cdCAgICBhcmVhOiAwLjMsIC8vIHVzZWQgdG8gY2FsY3VsYXRlIHdpbmQgYWZmZWN0XG5cblx0ICAgIHVwZGF0ZVBhcnRpY2xlOiBmdW5jdGlvbigpIHt9LFxuXHQgICAgcmVuZGVyUGFydGljbGU6IGZ1bmN0aW9uKGNvbnRleHQsIHApIHtcbiAgICAgICAgICAgIHZhciBzaXplID0gcC5zaXplLFxuXHRcdFx0XHRoYWxmU2l6ZSA9IHNpemUgPj4gMSxcblx0XHRcdFx0eCA9IHAucG9zaXRpb24ueHwwLFxuXHRcdFx0XHR5ID0gcC5wb3NpdGlvbi55fDAsXG5cdFx0XHRcdHJhZGdyYWQgPSBjb250ZXh0LmNyZWF0ZVJhZGlhbEdyYWRpZW50KCB4LCB5LCBwLnNpemVTbWFsbCwgeCwgeSwgaGFsZlNpemUpO1xuXHRcdFx0cmFkZ3JhZC5hZGRDb2xvclN0b3AoIDAsIHAuZHJhd0NvbG9yICk7XG5cdFx0XHRyYWRncmFkLmFkZENvbG9yU3RvcCggMSwgcC5kcmF3Q29sb3JFZGdlICk7XG5cdFx0XHRjb250ZXh0LmZpbGxTdHlsZSA9IHJhZGdyYWQ7XG5cdFx0ICBcdGNvbnRleHQuZmlsbFJlY3QoIHgtaGFsZlNpemUsIHktaGFsZlNpemUsIHNpemUsIHNpemUgKTtcblx0ICAgIH0sXG5cblxuXHQgICAgaW5pdDogZnVuY3Rpb24obWF4UGFydGljbGVzLCBvcHRpb25zKSB7XG5cdFx0XHR0aGlzLnNldE9wdGlvbnMoe1xuXHRcdCAgICAgICAgbWF4UGFydGljbGVzOiBtYXhQYXJ0aWNsZXMsXG5cdFx0ICAgICAgICBwYXJ0aWNsZXM6IFtdLFxuXHRcdCAgICAgICAgZ3JhdmV5YXJkOiBbXSxcblx0XHQgICAgICAgIGFjdGl2ZTogZmFsc2UsXG5cblx0XHQvLyAgICAgICAgdGhpcy5wb3NpdGlvbiA9IHZlY3Rvcl9jcmVhdGUoMzAwLCAzMDApO1xuXHRcdCAgICAgICAgcG9zaXRpb25SYW5kb206ICB2ZWN0b3JfY3JlYXRlKDAsIDApLFxuXHRcdCAgICAgICAgZ3Jhdml0eTogIHZlY3Rvcl9jcmVhdGUoIDAuMCwgMC4zKSxcblxuXHRcdCAgICAgICAgZWxhcHNlZFRpbWU6IDAsIC8vIHVzZWQgdG8gY291bnQgYWN0aXZlIHRpbWUgLSBvbmx5IHdoZW4gZHVyYXRpb24gPiAwXG5cdFx0ICAgICAgICBkdXJhdGlvbjogLTEsICAgLy8gYXV0b3N0b3AgdGhlIGVtaXR0ZXIgYWZ0ZXIgdGhpcyBkdXJhdGlvbiAoLTEgPSBpbmZpbml0eSlcblx0XHQgICAgICAgIGVtaXNzaW9uUmF0ZTowLFxuXHRcdCAgICAgICAgZW1pdENvdW50ZXI6IDAsXG5cblx0XHQgICAgICAgIGxpZmVTcGFuUmFuZG9tOiAwLFxuXHRcdCAgICAgICAgYW5nbGVSYW5kb206IDAsXG5cdFx0ICAgICAgICBzaXplUmFuZG9tOiAwLFxuXHRcdCAgICAgICAgc3BlZWRSYW5kb206IDAsXG5cdFx0ICAgICAgICBzaGFycG5lc3NSYW5kb206IDAsXG5cblx0XHRcdFx0ZW1pdENvdW50ZXI6IDBcblx0XHRcdH0pXG5cdCAgICAgICAgdGhpcy5zZXRPcHRpb25zKG9wdGlvbnMgfHwge30pXG5cdFx0fSxcblxuXHQgICAgc2V0T3B0aW9uczogZnVuY3Rpb24ob3B0aW9ucykge1xuXHQgICAgICAgIGZvciAodmFyIGsgaW4gb3B0aW9ucykge1xuXHQgICAgICAgICAgICB0aGlzW2tdID0gb3B0aW9uc1trXTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgaWYgKCF0aGlzLmZpbmlzaFNpemUpIHtcblx0ICAgICAgICBcdHRoaXMuZmluaXNoU2l6ZSA9IHRoaXMuc2l6ZTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgaWYgKCF0aGlzLmVtaXNzaW9uUmF0ZSkge1xuXHQgICAgICAgIFx0dGhpcy5lbWlzc2lvblJhdGUgPSB0aGlzLm1heFBhcnRpY2xlcyAvIHRoaXMubGlmZVNwYW47XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGlmICh0aGlzLmNvbG9yRWRnZSkge1xuXHQgICAgICAgIFx0dGhpcy5jb2xvckVkZ2UgPSByZ2JhKHRoaXMuY29sb3JFZGdlKVxuXHQgICAgICAgIH1cblx0ICAgIH0sXG5cblxuXHRcdGFkZFBhcnRpY2xlOiBmdW5jdGlvbih4LHkpe1xuXHRcdFx0aWYodGhpcy5wYXJ0aWNsZXMubGVuZ3RoID49IHRoaXMubWF4UGFydGljbGVzKSB7XG5cdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBUYWtlIHRoZSBuZXh0IHBhcnRpY2xlIG91dCBvZiB0aGUgcGFydGljbGUgcG9vbCB3ZSBoYXZlIGNyZWF0ZWQgYW5kIGluaXRpYWxpemUgaXRcblxuXHRcdFx0dmFyIHBhcnRpY2xlID0gdGhpcy5ncmF2ZXlhcmQuc2hpZnQoKSB8fCBQYXJ0aWNsZSgpO1xuXHRcdFx0dGhpcy5pbml0UGFydGljbGUoIHBhcnRpY2xlLHggfHwgdGhpcy5wb3NpdGlvbi54LCB5IHx8IHRoaXMucG9zaXRpb24ueSk7XG5cdCAgICAgICAgdGhpcy5wYXJ0aWNsZXMucHVzaChwYXJ0aWNsZSk7XG5cdFx0XHRyZXR1cm4gcGFydGljbGU7XG5cdFx0fSxcblxuXHRcdGluaXRQYXJ0aWNsZTogZnVuY3Rpb24oIHBhcnRpY2xlLCB4LCB5ICl7XG5cblx0XHRcdHBhcnRpY2xlLnBvc2l0aW9uLnggPSB4ICsgdGhpcy5wb3NpdGlvblJhbmRvbS54ICogcm5kYWIoLTEsMSk7XG5cdFx0XHRwYXJ0aWNsZS5wb3NpdGlvbi55ID0geSArIHRoaXMucG9zaXRpb25SYW5kb20ueSAqIHJuZGFiKC0xLDEpO1xuXG5cdFx0XHR2YXIgbmV3QW5nbGUgPSAodGhpcy5hbmdsZSArIHRoaXMuYW5nbGVSYW5kb20gKiBybmRhYigtMSwxKSApICogKCBQSSAvIDE4MCApOyAvLyBjb252ZXJ0IHRvIHJhZGlhbnNcblx0XHRcdHZhciB2ZWN0b3IgPSB2ZWN0b3JfY3JlYXRlKE1hdGguY29zKCBuZXdBbmdsZSApLCBzaW4oIG5ld0FuZ2xlICkpO1xuXHRcdFx0dmFyIHZlY3RvclNwZWVkID0gdGhpcy5zcGVlZCArIHRoaXMuc3BlZWRSYW5kb20gKiBybmRhYigtMSwxKTtcblx0XHRcdHBhcnRpY2xlLmRpcmVjdGlvbiA9IHZlY3Rvcl9tdWx0aXBseSggdmVjdG9yLCB2ZWN0b3JTcGVlZCApO1xuXG5cdFx0XHRwYXJ0aWNsZS5zaXplID0gdGhpcy5zaXplICsgdGhpcy5zaXplUmFuZG9tICogcm5kYWIoLTEsMSk7XG5cdFx0XHRwYXJ0aWNsZS5zaXplID0gcGFydGljbGUuc2l6ZSA8PSAxID8gMSA6IHBhcnRpY2xlLnNpemV8MDtcblx0XHRcdHBhcnRpY2xlLmZpbmlzaFNpemUgPSB0aGlzLmZpbmlzaFNpemUgKyB0aGlzLnNpemVSYW5kb20gKiBybmRhYigtMSwxKTtcblxuXHRcdFx0cGFydGljbGUuYXJlYSA9IHRoaXMuYXJlYTtcblx0XHRcdHBhcnRpY2xlLnRpbWVUb0xpdmUgPSB0aGlzLmxpZmVTcGFuICsgdGhpcy5saWZlU3BhblJhbmRvbSAqIHJuZGFiKC0xLDEpO1xuXG5cdFx0XHRwYXJ0aWNsZS5zaGFycG5lc3MgPSB0aGlzLnNoYXJwbmVzcyArIHRoaXMuc2hhcnBuZXNzUmFuZG9tICogcm5kYWIoLTEsMSk7XG5cdFx0XHRwYXJ0aWNsZS5zaGFycG5lc3MgPSBwYXJ0aWNsZS5zaGFycG5lc3MgPiAxMDAgPyAxMDAgOiBwYXJ0aWNsZS5zaGFycG5lc3MgPCAwID8gMCA6IHBhcnRpY2xlLnNoYXJwbmVzcztcblx0XHRcdC8vIGludGVybmFsIGNpcmNsZSBncmFkaWVudCBzaXplIC0gYWZmZWN0cyB0aGUgc2hhcnBuZXNzIG9mIHRoZSByYWRpYWwgZ3JhZGllbnRcblx0XHRcdHBhcnRpY2xlLnNpemVTbWFsbCA9ICggcGFydGljbGUuc2l6ZSAvIDIwMCApICogcGFydGljbGUuc2hhcnBuZXNzfDA7IC8vKHNpemUvMi8xMDApXG5cblx0XHRcdGlmICh0aGlzLnN0YXJ0Q29sb3IpIHtcblx0XHRcdFx0dmFyIHN0YXJ0ID0gW1xuXHRcdFx0XHRcdHRoaXMuc3RhcnRDb2xvclsgMCBdLFxuXHRcdFx0XHRcdHRoaXMuc3RhcnRDb2xvclsgMSBdLFxuXHRcdFx0XHRcdHRoaXMuc3RhcnRDb2xvclsgMiBdLFxuXHRcdFx0XHRcdHRoaXMuc3RhcnRDb2xvclsgMyBdXG5cdFx0XHRcdF07XG5cdFx0XHRcdGlmICh0aGlzLnN0YXJ0Q29sb3JSYW5kb20pIHtcblx0XHRcdFx0XHR2YXIgdGhhdCA9IHRoaXM7XG5cdFx0XHRcdFx0cmFuZ2UoNCwgZnVuY3Rpb24oaikge3N0YXJ0W2pdICs9IHRoYXQuc3RhcnRDb2xvclJhbmRvbVsgaiBdICogcm5kYWIoLTEsMSkgfSlcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICh0aGlzLmZpbmlzaENvbG9yKSB7XG5cdFx0XHRcdFx0dmFyIGVuZCA9IFtcblx0XHRcdFx0XHRcdHRoaXMuZmluaXNoQ29sb3JbIDAgXSArIHRoaXMuZmluaXNoQ29sb3JSYW5kb21bIDAgXSAqIHJuZGFiKC0xLDEpLFxuXHRcdFx0XHRcdFx0dGhpcy5maW5pc2hDb2xvclsgMSBdICsgdGhpcy5maW5pc2hDb2xvclJhbmRvbVsgMSBdICogcm5kYWIoLTEsMSksXG5cdFx0XHRcdFx0XHR0aGlzLmZpbmlzaENvbG9yWyAyIF0gKyB0aGlzLmZpbmlzaENvbG9yUmFuZG9tWyAyIF0gKiBybmRhYigtMSwxKSxcblx0XHRcdFx0XHRcdHRoaXMuZmluaXNoQ29sb3JbIDMgXSArIHRoaXMuZmluaXNoQ29sb3JSYW5kb21bIDMgXSAqIHJuZGFiKC0xLDEpXG5cdFx0XHRcdFx0XTtcblx0XHRcdFx0XHRwYXJ0aWNsZS5kZWx0YUNvbG9yID0gW1xuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgKCBlbmRbIDAgXSAtIHN0YXJ0WyAwIF0gKSAvIHBhcnRpY2xlLnRpbWVUb0xpdmUsXG5cdFx0XHRcdFx0ICAgICAgICAgICAgICAgICAgICAgICAoIGVuZFsgMSBdIC0gc3RhcnRbIDEgXSApIC8gcGFydGljbGUudGltZVRvTGl2ZSxcblx0XHRcdFx0XHQgICAgICAgICAgICAgICAgICAgICAgICggZW5kWyAyIF0gLSBzdGFydFsgMiBdICkgLyBwYXJ0aWNsZS50aW1lVG9MaXZlLFxuXHRcdFx0XHRcdCAgICAgICAgICAgICAgICAgICAgICAgKCBlbmRbIDMgXSAtIHN0YXJ0WyAzIF0gKSAvIHBhcnRpY2xlLnRpbWVUb0xpdmVdO1xuXHRcdFx0XHR9XG5cblxuXHRcdFx0ICAgIHBhcnRpY2xlLmNvbG9yID0gc3RhcnQ7XG5cdFx0XHQgICAgaWYgKERCRyAmJiBpc05hTihwYXJ0aWNsZS5jb2xvclsgMiBdKSApIHtcblx0XHRcdCAgICBcdGNvbnNvbGUubG9nKFwiRXJyb3JcIik7XG5cdFx0XHQgICAgfVxuXHRcdFx0fVxuICAgICAgICBcdHBhcnRpY2xlLmRlbHRhU2l6ZSA9IChwYXJ0aWNsZS5maW5pc2hTaXplIC0gcGFydGljbGUuc2l6ZSkgLyBwYXJ0aWNsZS50aW1lVG9MaXZlO1xuXHRcdH0sXG5cblx0XHR1cGRhdGU6IGZ1bmN0aW9uKCBkZWx0YSApe1xuXHQgICAgICAgIGRlbHRhID0gZGVsdGEvMzE7XG5cdFx0XHRpZiggdGhpcy5hY3RpdmUgJiYgdGhpcy5lbWlzc2lvblJhdGUgPiAwICl7XG5cdFx0XHRcdHZhciByYXRlID0gMSAvIHRoaXMuZW1pc3Npb25SYXRlO1xuXHRcdFx0XHR0aGlzLmVtaXRDb3VudGVyICs9IGRlbHRhO1xuXHRcdFx0XHR3aGlsZSggdGhpcy5wYXJ0aWNsZXMubGVuZ3RoIDwgdGhpcy5tYXhQYXJ0aWNsZXMgJiYgdGhpcy5lbWl0Q291bnRlciA+IHJhdGUgKXtcblx0XHRcdFx0XHR0aGlzLmFkZFBhcnRpY2xlKCk7XG5cdFx0XHRcdFx0dGhpcy5lbWl0Q291bnRlciAtPSByYXRlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKCB0aGlzLmR1cmF0aW9uICE9IC0xKSB7XG5cdFx0XHRcdFx0dGhpcy5lbGFwc2VkVGltZSArPSBkZWx0YTtcblx0XHRcdFx0XHRpZiAodGhpcy5kdXJhdGlvbiA8IHRoaXMuZWxhcHNlZFRpbWUgKXtcblx0XHRcdFx0XHRcdHRoaXMuc3RvcFBhcnRpY2xlRW1pdHRlcigpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdCAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xuXHQgICAgICAgIGVhY2godGhpcy5wYXJ0aWNsZXMsIGZ1bmN0aW9uKGN1cnJlbnRQYXJ0aWNsZSwgcGFydGljbGVJbmRleCkge1xuXG5cdFx0XHRcdC8vIElmIHRoZSBjdXJyZW50IHBhcnRpY2xlIGlzIGFsaXZlIHRoZW4gdXBkYXRlIGl0XG5cdFx0XHRcdGlmKCBjdXJyZW50UGFydGljbGUudGltZVRvTGl2ZSA+IDAgKXtcblxuXHRcdFx0XHRcdC8vIENhbGN1bGF0ZSB0aGUgbmV3IGRpcmVjdGlvbiBiYXNlZCBvbiBncmF2aXR5XG5cdCAgICAgICAgICAgICAgICBpZiAodGhhdC5ncmF2aXR5KVxuXHRcdFx0XHRcdCAgICBjdXJyZW50UGFydGljbGUuZGlyZWN0aW9uID0gdmVjdG9yX2FkZCggY3VycmVudFBhcnRpY2xlLmRpcmVjdGlvbiwgdGhhdC5ncmF2aXR5ICk7XG5cblx0ICAgICAgICAgICAgICAgIC8vIHdpbmQgc3BlZWQgLSBvbmx5IGhvcml6b250YWxcblx0ICAgICAgICAgICAgICAgIGlmICh0aGF0LndpbmQpIHtcblx0ICAgICAgICAgICAgICAgIFx0Y3VycmVudFBhcnRpY2xlLmRpcmVjdGlvbi54ICs9IHdpbmRGb3JjZSh0aGF0LndpbmQoY3VycmVudFBhcnRpY2xlKSxcblx0ICAgICAgICAgICAgICAgIFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgY3VycmVudFBhcnRpY2xlLmRpcmVjdGlvbi54LFxuXHQgICAgICAgICAgICAgICAgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdCBjdXJyZW50UGFydGljbGUuYXJlYSk7XG5cdCAgICAgICAgICAgICAgICB9XG5cbi8vXHQgICAgICAgICAgICAgICAgaWYgKHRoYXQuZm9yY2VQb2ludHMpIHtcbi8vXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8dGhhdC5mb3JjZVBvaW50cy5sZW5ndGg7IGkrKykge1xuLy9cdFx0ICAgICAgICAgICAgICAgICAgICB2YXIgZnAgPSB0aGF0LmZvcmNlUG9pbnRzW2ldO1xuLy9cdFx0ICAgICAgICAgICAgICAgICAgICB2YXIgd2VpZ2h0ID0gZnBbMF07XG4vL1x0XHQgICAgICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IGZwWzFdO1xuLy9cdFx0ICAgICAgICAgICAgICAgICAgICB2YXIgZGlyID0gdmVjdG9yX3N1YihjdXJyZW50UGFydGljbGUucG9zaXRpb24sIGxvY2F0aW9uKTtcbi8vXHRcdC8vICAgICAgICAgICAgICAgICAgICB2YXIgZGlzdCA9IHZlY3Rvcl9sZW4oZGlyKTtcbi8vXHRcdC8vICAgICAgICAgICAgICAgICAgICBpZiAoZGlzdCA9PSAwKSB7XG4vL1x0XHQvLyAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuLy9cdFx0Ly8gICAgICAgICAgICAgICAgICAgIH1cbi8vXHRcdCAgICAgICAgICAgICAgICAgICAgLy8gdG9kbzogZm9yY2UgbWF5IGRlcGVuZCBvbiBkaXN0IChpZS4gZmFydGhlciBpcyB3ZWFrZXIgb3Igb3RoZXIpXG4vL1x0XHQgICAgICAgICAgICAgICAgICAgIHZhciBmb3JjZSA9IHZlY3Rvcl9tdWx0aXBseShkaXIsIHdlaWdodC8qKjEvZGlzdCovKTtcbi8vXHRcdCAgICAgICAgICAgICAgICAgICAgY3VycmVudFBhcnRpY2xlLmRpcmVjdGlvbiA9IHZlY3Rvcl9hZGQoIGN1cnJlbnRQYXJ0aWNsZS5kaXJlY3Rpb24sIGZvcmNlKTtcbi8vXHRcdCAgICAgICAgICAgICAgICB9XG4vL1x0ICAgICAgICAgICAgICAgIH1cblx0XHRcdFx0XHRjdXJyZW50UGFydGljbGUucG9zaXRpb24uYWRkKCBjdXJyZW50UGFydGljbGUuZGlyZWN0aW9uICk7XG5cdFx0XHRcdFx0Y3VycmVudFBhcnRpY2xlLnRpbWVUb0xpdmUgLT0gZGVsdGE7XG5cblx0XHRcdFx0XHQvLyBhbGxvdyBleHRlbnJuYWwgdXBkYXRlIC0gc2V0IHRpbWVUb2xpdmUgdG8gemVybyBpZiBwYXJ0aWNsZSBzaG91bGQgZGllXG5cdFx0XHRcdFx0dGhhdC51cGRhdGVQYXJ0aWNsZShjdXJyZW50UGFydGljbGUsIHBhcnRpY2xlSW5kZXgpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYoIGN1cnJlbnRQYXJ0aWNsZS50aW1lVG9MaXZlID4gMCApe1xuXG5cdFx0XHRcdFx0Y3VycmVudFBhcnRpY2xlLnNpemUgKz0gY3VycmVudFBhcnRpY2xlLmRlbHRhU2l6ZSAqIGRlbHRhO1xuXHRcdFx0XHRcdGN1cnJlbnRQYXJ0aWNsZS5zaXplU21hbGwgPSAgKCBjdXJyZW50UGFydGljbGUuc2l6ZSAvIDIwMCApICogY3VycmVudFBhcnRpY2xlLnNoYXJwbmVzcyB8MDsgLy8oc2l6ZS8yLzEwMClcblxuXHRcdFx0XHRcdC8vIFVwZGF0ZSBjb2xvcnMgYmFzZWQgb24gZGVsdGFcblx0XHRcdFx0XHRpZiAoY3VycmVudFBhcnRpY2xlLmRlbHRhQ29sb3IpIHtcblx0XHRcdFx0XHRcdGN1cnJlbnRQYXJ0aWNsZS5jb2xvclsgMCBdICs9ICggY3VycmVudFBhcnRpY2xlLmRlbHRhQ29sb3JbIDAgXSAqIGRlbHRhICk7XG5cdFx0XHRcdFx0XHRjdXJyZW50UGFydGljbGUuY29sb3JbIDEgXSArPSAoIGN1cnJlbnRQYXJ0aWNsZS5kZWx0YUNvbG9yWyAxIF0gKiBkZWx0YSApO1xuXHRcdFx0XHRcdFx0Y3VycmVudFBhcnRpY2xlLmNvbG9yWyAyIF0gKz0gKCBjdXJyZW50UGFydGljbGUuZGVsdGFDb2xvclsgMiBdICogZGVsdGEgKTtcblx0XHRcdFx0XHRcdGN1cnJlbnRQYXJ0aWNsZS5jb2xvclsgMyBdICs9ICggY3VycmVudFBhcnRpY2xlLmRlbHRhQ29sb3JbIDMgXSAqIGRlbHRhICk7XG5cdFx0XHRcdFx0fVxuLy9cdCAgICAgICAgICAgICAgICBpZiAoaXNOYU4oYSkgKSB7XG4vL1x0ICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yXCIpO1xuLy9cdCAgICAgICAgICAgICAgICB9XG5cdFx0XHRcdFx0aWYgKGN1cnJlbnRQYXJ0aWNsZS5jb2xvcikge1xuXHRcdFx0XHRcdFx0Y3VycmVudFBhcnRpY2xlLmRyYXdDb2xvckVkZ2UgPSB0aGF0LmNvbG9yRWRnZSB8fCByZ2JhKGN1cnJlbnRQYXJ0aWNsZS5jb2xvciwwKTtcblx0XHRcdFx0XHRcdGN1cnJlbnRQYXJ0aWNsZS5kcmF3Q29sb3IgPSByZ2JhKGN1cnJlbnRQYXJ0aWNsZS5jb2xvcik7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHRoYXQucGFydGljbGVzLnNwbGljZShwYXJ0aWNsZUluZGV4LDEpO1xuXHRcdFx0XHRcdHRoYXQuZ3JhdmV5YXJkLnB1c2goY3VycmVudFBhcnRpY2xlKTtcblx0XHRcdFx0fVxuXHQgICAgICAgIH0pO1xuXHRcdH0sXG5cblx0XHRzdG9wUGFydGljbGVFbWl0dGVyOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblx0XHRcdHRoaXMuZWxhcHNlZFRpbWUgPSAwO1xuXHRcdFx0dGhpcy5lbWl0Q291bnRlciA9IDA7XG5cdFx0fSxcblxuXHRcdHJlbmRlclBhcnRpY2xlczogZnVuY3Rpb24oIGNvbnRleHQgKXtcblx0XHRcdHZhciB0aGF0ID0gdGhpcztcblx0ICAgICAgICBlYWNoKHRoaXMucGFydGljbGVzLCBmdW5jdGlvbihwYXJ0aWNsZSwgcGFydGljbGVJbmRleCkge1xuXHQgICAgICAgIFx0dGhhdC5yZW5kZXJQYXJ0aWNsZShjb250ZXh0LCBwYXJ0aWNsZSk7XG5cdCAgICAgICAgICAgIC8vY29udGV4dC5hcmMoeCx5LCBoYWxmU2l6ZSwgTWF0aC5QSSoyLCBmYWxzZSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdH1cblx0cmVzLmluaXQobWF4UGFydGljbGVzLCBvcHRpb25zKTtcblx0cmV0dXJuIHJlcztcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIFBhcnRpY2xlUG9pbnRFbWl0dGVyOiBQYXJ0aWNsZVBvaW50RW1pdHRlcixcblxufVxuIiwidmFyIGNhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyk7XG52YXIgS0VZUyA9IHJlcXVpcmUoJy4vaW5wdXQnKTtcbnZhciBzdGlja21hbiA9IHJlcXVpcmUoJy4vc3RpY2ttYW4nKTtcblxuKGZ1bmN0aW9uKCkge1xuXG4vLyBwcml2YXRlOlxuICB2YXIgeD0wLCB5PTAsXG4gICAgdng9MCx2eT0wLFxuICAgIG9uR3JvdW5kPSAxLFxuICAgIFdJRFRIPTE1LCBIRUlHSFQ9MjUsXG4gICAgdG90YWxFbGFwc2VkPTAsXG4gICAgY3VyQW5pbSxcbiAgICBydW4gPSBzdGlja21hbi5hbmltYXRpb25zLnJ1bixcbiAgICBkaXJlY3Rpb249MCxcbiAgICBzdGFuZCA9IHN0aWNrbWFuLmFuaW1hdGlvbnMuc3RhbmQ7XG5cblxuZnVuY3Rpb24gc2V0QW5pbShhbmltKSB7XG4gIGlmIChhbmltICE9IGN1ckFuaW0pIHtcbiAgICBjdXJBbmltID0gYW5pbTtcbiAgICB0b3RhbEVsYXBzZWQgPSAwO1xuICB9XG59XG5cbi8vIHB1YmxpY1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cblxuICB1cGRhdGU6IGZ1bmN0aW9uKHdvcmxkLCBlbGFwc2VkKSB7XG4gICAgdmFyIHN0ZXAgPSB3b3JsZC5jZWxsU2l6ZS82MDtcblxuICAgIHRvdGFsRWxhcHNlZCArPSBlbGFwc2VkO1xuICAgIC8vIHVwZGF0ZSBzcGVlZFxuICAgIC8qaWYgKEtFWVNbNDBdKSB7XG4gICAgICB2eSArPSBzdGVwO1xuICAgICAgdnkgPSBNYXRoLm1pbih2eSwgd29ybGQuY2VsbFNpemUpO1xuICAgIH1cbiAgICBlbHNlKi8gaWYgKEtFWVNbMzhdKSB7IC8vIFVQXG4gICAgICBpZiAob25Hcm91bmQpIHtcbiAgICAgICAgdnkgLT0gd29ybGQuanVtcEZyb21Hcm91bmQ7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdnkgLT0gd29ybGQuanVtcEZyb21BaXI7XG4gICAgICB9XG4gICAgICB2eSA9IE1hdGgubWF4KHZ5LCAtd29ybGQubWF4U3BlZWRZKTtcblxuICAgIH1cbiAgICB2eSArPSB3b3JsZC5ncmF2aXR5O1xuICAgIHZ5ID0gTWF0aC5taW4odnksIHdvcmxkLm1heFNwZWVkWSk7XG5cbiAgICBpZiAoS0VZU1szOV0pIHsgLy8gUklHSFRcbiAgICAgIHZ4ICs9IHN0ZXA7XG4gICAgICB2eCA9IE1hdGgubWluKHZ4LCB3b3JsZC5tYXhTcGVlZFgpO1xuICAgICAgc2V0QW5pbShydW4pO1xuICAgICAgZGlyZWN0aW9uID0gMDtcbiAgICB9XG4gICAgZWxzZSBpZiAoS0VZU1szN10pIHsgIC8vIExFRlRcbiAgICAgIHZ4IC09IHN0ZXA7XG4gICAgICB2eCA9IE1hdGgubWF4KHZ4LCAtd29ybGQubWF4U3BlZWRYKTtcbiAgICAgIHNldEFuaW0ocnVuKTtcbiAgICAgIGRpcmVjdGlvbiA9IDE7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdnggKj0gLjI7XG4gICAgICBpZiAoTWF0aC5hYnModngpIDwgMC4wMSkge1xuICAgICAgICB2eCA9IDA7XG4gICAgICAgIGlmIChvbkdyb3VuZCkge1xuICAgICAgICAgIHNldEFuaW0oc3RhbmQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ09MTElTSU9OIERFVEVDVElPTlxuXG4gICAgLy8gZmluZCBtYXplIGNlbGwgZm9yIGNvbGxpc2lvbiBjaGVja1xuICAgIC8vIGluaXRpYWxseSBjaGVja2luZyBZIGNvbGxpc2lvbiwgdXNlIHNtYWxsZXIgWFxuICAgIHZhciBjZWxsWExlZnQgPSBNYXRoLmZsb29yKCh4K3Z4KzIpIC8gd29ybGQuY2VsbFNpemUpLFxuICAgICAgY2VsbFhSaWdodCA9IE1hdGguZmxvb3IoKFdJRFRILTMreCt2eCkgLyB3b3JsZC5jZWxsU2l6ZSksXG4gICAgICBjZWxsWVRvcCA9IE1hdGguZmxvb3IoKHkrdnkpIC8gd29ybGQuY2VsbFNpemUpLFxuICAgICAgY2VsbFlCb3R0b20gPSBNYXRoLmZsb29yKChIRUlHSFQreSt2eSkgLyB3b3JsZC5jZWxsU2l6ZSk7XG5cblxuICAgIG9uR3JvdW5kID0gMDtcbiAgICBpZiAodnkgPiAwKSB7XG4gICAgICAvL21vdmluZyBkb3duXG4gICAgICBpZiAoIXdvcmxkLm1hemUuZ2V0KGNlbGxYTGVmdCwgY2VsbFlCb3R0b20pIHx8ICF3b3JsZC5tYXplLmdldChjZWxsWFJpZ2h0LCBjZWxsWUJvdHRvbSkpIHtcbiAgICAgICAgICAvLyBjb2xsaWRlZCBkb3duLCBtb3ZlIHRvIGNsb3Nlc3QgdG8gdG9wIGVkZ2Ugb2YgY2VsbFxuICAgICAgICB5ID0gY2VsbFlCb3R0b20gKiB3b3JsZC5jZWxsU2l6ZSAtIEhFSUdIVDtcbiAgICAgICAgdnkgPSAwO1xuICAgICAgICBvbkdyb3VuZCA9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHZ5IDwgMCkge1xuICAgICAgaWYgKCF3b3JsZC5tYXplLmdldChjZWxsWExlZnQsIGNlbGxZVG9wKSB8fCAhd29ybGQubWF6ZS5nZXQoY2VsbFhSaWdodCwgY2VsbFlUb3ApKSB7XG4gICAgICAgICAgLy8gY29sbGlkZWQgdXAsIG1vdmUgdG8gYm90dG9tIGVkZ2Ugb2YgY2VsbFxuICAgICAgICB5ID0gKGNlbGxZVG9wKzEpKndvcmxkLmNlbGxTaXplO1xuICAgICAgICB2eSA9IDA7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gY2hlY2tpbmcgWCBjb2xsaXNpb24sIHVzZSBzbWFsbGVyIFlcbiAgICB2YXIgY2VsbFhMZWZ0ID0gTWF0aC5mbG9vcigoeCt2eCkgLyB3b3JsZC5jZWxsU2l6ZSksXG4gICAgICBjZWxsWFJpZ2h0ID0gTWF0aC5mbG9vcigoV0lEVEgreCt2eCkgLyB3b3JsZC5jZWxsU2l6ZSksXG4gICAgICBjZWxsWVRvcCA9IE1hdGguZmxvb3IoKHkrdnkrMikgLyB3b3JsZC5jZWxsU2l6ZSksXG4gICAgICBjZWxsWUJvdHRvbSA9IE1hdGguZmxvb3IoKEhFSUdIVC0xK3krdnktMikgLyB3b3JsZC5jZWxsU2l6ZSk7XG5cbiAgICBpZiAodnggPiAwKSB7XG4gICAgICAvL21vdmluZyByaWdodFxuICAgICAgaWYgKCF3b3JsZC5tYXplLmdldChjZWxsWFJpZ2h0LCBjZWxsWVRvcCkgfHwgIXdvcmxkLm1hemUuZ2V0KGNlbGxYUmlnaHQsIGNlbGxZQm90dG9tKSkge1xuICAgICAgICAgIC8vIGNvbGxpZGVkIHJpZ2h0LCBtb3ZlIHRvIGNsb3Nlc3QgdG8gbGVmdCBlZGdlIG9mIGNlbGxcbiAgICAgICAgeCA9IGNlbGxYUmlnaHQgKiB3b3JsZC5jZWxsU2l6ZSAtIFdJRFRILTE7XG4gICAgICAgIHZ4ID0gMDtcbiAgICAgICAgaWYgKEtFWVNbMzldICYmIHZ5ID4gMCkge1xuICAgICAgICAgIC8vY29sbGlkZWQgd2l0aCB3YWxsLCBtb3ZpbmcgZG93biwgcHJlc3NpbmcgbGVmdCA9IHNsaWRlIGRvd24gd2FsbHNcbiAgICAgICAgICB2eSAqPSB3b3JsZC53YWxsRnJpY3Rpb247XG4gICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPCB3b3JsZC5jaGFuY2VKdW1wV2FsbCkgeyAgLy8gc21hbGwgY2hhbmNlIHRvIGJlIFwib25Hcm91bmRcIiBhbmQgYmUgYWJsZSB0byBqdW1wXG4gICAgICAgICAgICBvbkdyb3VuZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHZ4IDwgMCkge1xuICAgICAgaWYgKCF3b3JsZC5tYXplLmdldChjZWxsWExlZnQsIGNlbGxZVG9wKSB8fCAhd29ybGQubWF6ZS5nZXQoY2VsbFhMZWZ0LCBjZWxsWUJvdHRvbSkpIHtcbiAgICAgICAgICAvLyBjb2xsaWRlZCBsZWZ0LCBtb3ZlIHRvIHJpZ2h0IGVkZ2Ugb2YgY2VsbFxuICAgICAgICB4ID0gKGNlbGxYTGVmdCsxKSp3b3JsZC5jZWxsU2l6ZSsxO1xuICAgICAgICB2eCA9IDA7XG4gICAgICAgIGlmIChLRVlTWzM3XSAmJiB2eSA+IDApIHtcbiAgICAgICAgICAvL2NvbGxpZGVkIHdpdGggd2FsbCwgbW92aW5nIGRvd24gPSBzbGlkZSBkb3duIHdhbGxzXG4gICAgICAgICAgdnkgKj0gd29ybGQud2FsbEZyaWN0aW9uO1xuICAgICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDwgd29ybGQuY2hhbmNlSnVtcFdhbGwpIHtcbiAgICAgICAgICAgIG9uR3JvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIW9uR3JvdW5kKSB7XG4gICAgICBpZiAodnkgPiAwKSB7XG4gICAgICAgIHNldEFuaW0oc3RpY2ttYW4uYW5pbWF0aW9ucy5mYWxsKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBzZXRBbmltKHN0aWNrbWFuLmFuaW1hdGlvbnMuanVtcCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgeCArPSB2eDtcbiAgICB5ICs9IHZ5O1xuICAgIGlmIChLRVlTWzgzXSkge1xuICAgICAgY2FtZXJhLnNjYWxlID0gTWF0aC5taW4oY2FtZXJhLnNjYWxlICsgMC4wNSwgNSk7XG4gICAgfVxuICAgIGlmIChLRVlTWzY1XSkge1xuICAgICAgY2FtZXJhLnNjYWxlID0gTWF0aC5tYXgoY2FtZXJhLnNjYWxlIC0gMC4wNSwgMC41KTtcbiAgICB9XG4gICAgY2FtZXJhLnNldFRhcmdldCh4LHkpO1xuXG4gIH0sXG5cbiAgZHJhdzogZnVuY3Rpb24oY3R4LGR0KSB7XG4gICAgaWYgKG9uR3JvdW5kKSB7XG4gICAgICBjdHguZmlsbFN0eWxlID0gXCIjZmYwXCI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY3R4LmZpbGxTdHlsZSA9IFwiIzBmMFwiO1xuICAgIH1cbiAgICBjdHguc2F2ZSgpXG4gICAgLy8gY3R4LnRyYW5zbGF0ZSh4LHkpXG4gICAgLy8gY3R4LmZpbGxSZWN0KDAsIDAsIFdJRFRILCBIRUlHSFQpO1xuICAgIC8vIGN0eC50cmFuc2xhdGUoV0lEVEgvMiwgSEVJR0hUKTtcbiAgICBjdHgudHJhbnNsYXRlKHgrV0lEVEgvMiwgeStIRUlHSFQpO1xuICAgIGN0eC5zY2FsZSgwLjE1LDAuMTUpO1xuICAgIGN0eC5saW5lV2lkdGggPSAxNTtcbiAgICBjdHgubGluZUpvaW4gPSAnYmV2ZWwnO1xuXG4gICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgY3R4LnNjYWxlKC0xLDEpO1xuICAgIH1cblxuICAgIGN1ckFuaW0ucmVuZGVyKGN0eCwgdG90YWxFbGFwc2VkKTtcbiAgICBjdHgucmVzdG9yZSgpXG4gIH1cbn1cbn0pKCk7XG4iLCIvLyBIb2xkcyBsYXN0IGl0ZXJhdGlvbiB0aW1lc3RhbXAuXG52YXIgdGltZSA9IDA7XG5cbi8qKlxuICogQ2FsbHMgYGZuYCBvbiBuZXh0IGZyYW1lLlxuICpcbiAqIEBwYXJhbSAge0Z1bmN0aW9ufSBmbiBUaGUgZnVuY3Rpb25cbiAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5mdW5jdGlvbiByYWYoZm4pIHtcbiAgcmV0dXJuIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgdmFyIGVsYXBzZWQgPSBub3cgLSB0aW1lO1xuXG4gICAgaWYgKGVsYXBzZWQgPiA5OTkpIHtcbiAgICAgIGVsYXBzZWQgPSAxIC8gNjA7ICAvLyBlbGFwc2VkIHRvbyBtdWNoIC0gcHJvYmFibHkgdGFiIHN3aXRjaGVkIHNvIGFuaW1hdGlvbiBwYXVzZWRcbiAgICB9IGVsc2Uge1xuICAgICAgZWxhcHNlZCAvPSAxMDAwO1xuICAgIH1cblxuICAgIHRpbWUgPSBub3c7XG4gICAgZm4oZWxhcHNlZCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIENhbGxzIGBmbmAgb24gZXZlcnkgZnJhbWUgd2l0aCBgZWxhcHNlZGAgc2V0IHRvIHRoZSBlbGFwc2VkXG4gICAqIHRpbWUgaW4gbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gICAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0YXJ0OiBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiByYWYoZnVuY3Rpb24gdGljayhlbGFwc2VkKSB7XG4gICAgICBmbihlbGFwc2VkKTtcbiAgICAgIHJhZih0aWNrKTtcbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIHNwZWNpZmllZCBhbmltYXRpb24gZnJhbWUgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtpbnR9IGlkIFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdG9wOiBmdW5jdGlvbihpZCkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlZWQpIHtcbiAgdmFyIHJhbmRvbSA9IE1hdGgucmFuZG9tLy93aHJhbmRvbShzZWVkKTtcbiAgdmFyIHJuZyA9IHtcbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYW4gaW50ZWdlciB3aXRoaW4gWzAsIG1heCkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtpbnR9IFttYXhdXG4gICAgICogQHJldHVybiB7aW50fVxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG4gICAgaW50OiBmdW5jdGlvbihtYXgpIHtcbiAgICAgIHJldHVybiByYW5kb20oKSAqIChtYXggfHwgMHhmZmZmZmZmKSB8IDA7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBSZXR1cm4gYSBmbG9hdCB3aXRoaW4gWzAuMCwgMS4wKS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge2Zsb2F0fVxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICovXG4gICAgZmxvYXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJhbmRvbSgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUmV0dXJuIGEgYm9vbGVhbi5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKi9cbiAgICBib29sOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByYW5kb20oKSA+IDAuNTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFJldHVybiBhbiBpbnRlZ2VyIHdpdGhpbiBbbWluLCBtYXgpLlxuICAgICAqXG4gICAgICogQHBhcmFtICB7aW50fSBtaW5cbiAgICAgKiBAcGFyYW0gIHtpbnR9IG1heFxuICAgICAqIEByZXR1cm4ge2ludH1cbiAgICAgKiBAYXBpIHB1YmxpY1xuICAgICAqL1xuICAgIHJhbmdlOiBmdW5jdGlvbihtaW4sIG1heCkge1xuICAgICAgcmV0dXJuIHJuZy5pbnQobWF4IC0gbWluKSArIG1pbjtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFBpY2sgYW4gZWxlbWVudCBmcm9tIHRoZSBzb3VyY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHttaXhlZFtdfSBzb3VyY2VcbiAgICAgKiBAcmV0dXJuIHttaXhlZH1cbiAgICAgKiBAYXBpIHB1YmxpY1xuICAgICAqL1xuICAgIHBpY2s6IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgcmV0dXJuIHNvdXJjZVtybmcuaW50KHNvdXJjZS5sZW5ndGgpXTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIHJuZztcbn07XG5cbi8vIC8qKlxuLy8gICogR2VuZXJhdGUgYSBzZWVkZWQgcmFuZG9tIG51bWJlciB1c2luZyBQeXRob24ncyB3aHJhbmRvbSBpbXBsZW1lbnRhdGlvbi5cbi8vICAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vaWFuYi93aHJhbmRvbSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbi8vICAqXG4vLyAgKiBAcGFyYW0gIHtpbnR9IFtzZWVkXVxuLy8gICogQHJldHVybiB7RnVuY3Rpb259XG4vLyAgKiBAYXBpIHByaXZhdGVcbi8vICAqL1xuLy8gZnVuY3Rpb24gd2hyYW5kb20oc2VlZCkge1xuLy8gICBpZiAoIXNlZWQpIHtcbi8vICAgICBzZWVkID0gRGF0ZS5ub3coKTtcbi8vICAgfVxuLy9cbi8vICAgdmFyIHggPSAoc2VlZCAlIDMwMjY4KSArIDE7XG4vLyAgIHNlZWQgPSAoc2VlZCAtIChzZWVkICUgMzAyNjgpKSAvIDMwMjY4O1xuLy8gICB2YXIgeSA9IChzZWVkICUgMzAzMDYpICsgMTtcbi8vICAgc2VlZCA9IChzZWVkIC0gKHNlZWQgJSAzMDMwNikpIC8gMzAzMDY7XG4vLyAgIHZhciB6ID0gKHNlZWQgJSAzMDMyMikgKyAxO1xuLy8gICBzZWVkID0gKHNlZWQgLSAoc2VlZCAlIDMwMzIyKSkgLyAzMDMyMjtcbi8vXG4vLyAgIHJldHVybiBmdW5jdGlvbigpIHtcbi8vICAgICB4ID0gKDE3MSAqIHgpICUgMzAyNjk7XG4vLyAgICAgeSA9ICgxNzIgKiB5KSAlIDMwMzA3O1xuLy8gICAgIHogPSAoMTcwICogeikgJSAzMDMyMztcbi8vICAgICByZXR1cm4gKHggLyAzMDI2OS4wICsgeSAvIDMwMzA3LjAgKyB6IC8gMzAzMjMuMCkgJSAxLjA7XG4vLyAgIH07XG4vLyB9XG4iLCJcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4uKi4uLi4uLi4uSGVhZEVuZC5cbi4qLi4uLi4uLi4uLnwuXG4uKi4uLi4uLi5IZWFkU3RhcnQuXG4uKi4uLi4uLi4uLi58LlxuLiouLi4uLi5FLS0tQS0tLUVsYm93LS0tSGFuZC5cbi4qLi4uLi4ufC4uLnwuXG4uKi4uLi4uLkguLi58LlxuLiouLi4uLi4uLi4uQi5cbi4qLi4uLi4uLi4uLy5cXC5cbi4qLi4uLi4uLi5LLktuZWUuXG4uKi4uLi4uLi4ufC4uLnwuXG4uKi4uLi4uLi4uRi4uRm9vdFN0YXJ0LUZvb3RFbmRcbiAqXG4gKlxuICogU3RpY2tmaWd1cmUgZGF0YTogIGFycmF5IG9mIHgseSBwYWlycyBpbiB0aGlzIG9yZGVyOlxuICpcbiAqIFtBLFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGluZGV4OiAgMCwxXG4gKiBIZWFkLEhlYWQtRW5kLCBcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgIDIsMywgICA0LDVcbiAqIEVsYm93MSxIYW5kMSxcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdCAgNiw3LCAgIDgsOVxuICogRWxib3cyLEhhbmQyLFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ICAxMCwxMSwgMTIsMTNcbiAqIEIsXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdDE0LDE1XG4gKiBLbmVlMSxGb290U3RhcnQsRm9vdEVuZCxcdFx0XHRcdFx0XHRcdFx0ICAxNiwxNywgMTgsMTksIDIwLDIxXG4gKiBLbmVlMixGb290MlN0YXJ0LCBGb290MkVuZF1cdFx0XHRcdFx0XHQgIDIyLDIzLCAyNCwyNSwgMjYsMjdcbiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmZ1bmN0aW9uIFN0aWNrTWFuKCkge1xuXHR0aGlzLmFuaW1hdGlvbnMgPSB7fTtcbn1cblxuU3RpY2tNYW4ucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGtleSwgZHVyYXRpb24sICBmcmFtZXMsIGZsaXAsIHJlcGVhdCkge1xuXHR0aGlzLmFuaW1hdGlvbnNba2V5XSA9IG5ldyBTdGlja0FuaW1hdGlvbihkdXJhdGlvbiwgIGZyYW1lcywgZmxpcCwgcmVwZWF0KTtcbn07XG5cblxuZnVuY3Rpb24gU3RpY2tBbmltYXRpb24oZHVyYXRpb24sIGZyYW1lcywgZmxpcCwgcmVwZWF0KSB7XG4gIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbjtcblx0dGhpcy5yZXBlYXQgPSByZXBlYXQ7XG5cdC8vdGhpcy5mcmFtZXMgPSBmcmFtZXM7XG5cdC8vIGR1cGxpY2F0ZSBmcmFtZXMgd2l0aCBmbGlwIGFybXMgYW5kIGxlZ3Ncblx0aWYgKGZsaXApIHtcblx0XHR0aGlzLmZyYW1lcyA9IGZyYW1lcy5zbGljZSgpO1xuXHRcdGZvciAodmFyIGk9MDsgaTxmcmFtZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBmcmFtZSA9IGZyYW1lc1tpXTtcblx0XHRcdHZhciBuZXdGcmFtZSA9IGZyYW1lLnNsaWNlKCk7XG5cdFx0XHRmb3IgKHZhciBrPTY7IGs8MTA7IGsrKykge1xuXHRcdFx0XHRuZXdGcmFtZVtrXSA9IGZyYW1lW2srNF07IC8vIHN3aXRjaCBoYW5kc1xuXHRcdFx0XHRuZXdGcmFtZVtrKzRdID0gZnJhbWVba107XG5cdFx0XHRcdG5ld0ZyYW1lW2srMTBdID0gZnJhbWVbaysxNl07XG5cdFx0XHRcdG5ld0ZyYW1lW2srMTZdID0gZnJhbWVbaysxMF07XG5cdFx0XHR9XG5cdFx0XHRuZXdGcmFtZVsyMF0gPSBmcmFtZVsyNl07XG5cdFx0XHRuZXdGcmFtZVsyMV0gPSBmcmFtZVsyN107XG5cdFx0XHRuZXdGcmFtZVsyNl0gPSBmcmFtZVsyMF07XG5cdFx0XHRuZXdGcmFtZVsyN10gPSBmcmFtZVsyMV07XG5cdFx0XHR0aGlzLmZyYW1lcy5wdXNoKG5ld0ZyYW1lKVxuXHRcdH1cblx0fVxuXHRlbHNlIHtcblx0XHR0aGlzLmZyYW1lcyA9IGZyYW1lcztcblx0fVxufVxuXG5cbmZ1bmN0aW9uIGxpbmVhck1peChmcmFtZTEsIGZyYW1lMiwgZnJhY3Rpb24pIHtcblx0dmFyIHJlc3VsdCA9IFtdO1xuXHR2YXIgZnJhYzEgPSAxLWZyYWN0aW9uO1xuXHRmb3IgKHZhciBpPTA7IGk8ZnJhbWUxLmxlbmd0aDsgaSsrKSB7XG5cdFx0cmVzdWx0LnB1c2goZnJhbWUxW2ldKmZyYWMxICsgIGZyYW1lMltpXSpmcmFjdGlvbik7XG5cdH1cblx0cmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gU3RpY2tBbmltYXRpb24ucHJvdG90eXBlLmdldE9mZnNldCA9IGZ1bmN0aW9uKGVsYXBzZWQpIHtcbi8vIFx0cmV0dXJuIHRoaXMud2lkdGgqZWxhcHNlZC90aGlzLmR1cmF0aW9uO1xuLy8gfVxuXG4vLyB2YXIgbGFzdEZyYW1lID0gLTE7XG5TdGlja0FuaW1hdGlvbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oY3R4LCBlbGFwc2VkKSB7XG5cdHZhciBhbmltID0gdGhpcztcblx0dmFyIGR1cmF0aW9uID0gYW5pbS5kdXJhdGlvbjtcblx0Y3R4LnNhdmUoKTtcblxuXHR2YXIgZnJhbWVzID0gYW5pbS5mcmFtZXM7XG5cdHZhciBmcmFtZTtcblx0aWYgKHRoaXMucmVwZWF0IHx8IGVsYXBzZWQgPCBkdXJhdGlvbikge1xuXHRcdHZhciBkdXJhdGlvblBlckZyYW1lID0gZHVyYXRpb24vZnJhbWVzLmxlbmd0aDtcblxuXHRcdHZhciBmcmFtZTEgPSAoKGVsYXBzZWQgLyBkdXJhdGlvblBlckZyYW1lKXwwKSUgZnJhbWVzLmxlbmd0aDtcblx0XHR2YXIgZnJhbWUyID0gKGZyYW1lMSsxKSAlIGZyYW1lcy5sZW5ndGg7XG5cblx0ICAvLyBpZiAoZnJhbWUxICE9IGxhc3RGcmFtZSkge1xuXHRcdC8vIFx0Y29uc29sZS5sb2coXCJmcmFtZTEgPSBcIitmcmFtZTEpO1xuXHRcdC8vIFx0bGFzdEZyYW1lID0gZnJhbWUxO1xuXHRcdC8vIH1cblx0XHR2YXIgcGFydGlhbEVsYXBzZWQgPSBlbGFwc2VkICUgZHVyYXRpb25QZXJGcmFtZTtcblxuXHRcdGZyYW1lID0gbGluZWFyTWl4KGZyYW1lc1tmcmFtZTFdLCBmcmFtZXNbZnJhbWUyXSxcblx0XHRcdFx0cGFydGlhbEVsYXBzZWQvZHVyYXRpb25QZXJGcmFtZSk7XG5cdH1cblx0ZWxzZSB7XG5cdFx0Ly8gbm90IHJlcGVhdCBhbmQgcGFzdCBkdXJhdGlvbiAtIHN0dWNrIG9uIGZpbmFsIGZyYW1lXG5cdFx0ZnJhbWUgPSBmcmFtZXNbZnJhbWVzLmxlbmd0aC0xXTtcblx0fVxuXG5cblx0dmFyIG1vdmVUbyA9IGZ1bmN0aW9uKGkpIHtcblx0XHRjdHgubW92ZVRvKGZyYW1lWzIqaV0sIGZyYW1lWzIqaSsxXSk7XG5cdH1cblx0dmFyIGxpbmVUbyA9IGZ1bmN0aW9uKGkpIHtcblx0XHRjdHgubGluZVRvKGZyYW1lWzIqaV0sIGZyYW1lWzIqaSsxXSk7XG5cdH1cblxuLy9cdGN0eC5saW5lQ2FwID0gXCJyb3VuZFwiO1xuXG5cdGN0eC5zdHJva2VTdHlsZSA9IFwiIzIyMjI5OVwiO1xuICBjdHguYmVnaW5QYXRoKCk7XG5cdG1vdmVUbygwKTsgIC8vIEFcblx0bGluZVRvKDUpOyAgLy8gRWxib3cgMlxuXHRsaW5lVG8oNik7ICAvLyBoYW5kIDJcblxuXHRtb3ZlVG8oNyk7IC8vIEJcblx0bGluZVRvKDExKTsgLy8gS25lZTJcblx0bGluZVRvKDEyKTsgLy8gRm9vdDIgc3RhcnRcblx0bGluZVRvKDEzKTsgLy8gRm9vdDIgZW5kXG5cdGN0eC5zdHJva2UoKTtcblxuXHRjdHguc3Ryb2tlU3R5bGUgPSBcIiM0NDQ0YmJcIjtcblx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRtb3ZlVG8oMCk7IC8vIEFcblx0bGluZVRvKDEpOyAvLyBIZWFkU3RhcnRcblx0dmFyIGNlbnRlckhlYWQgPSBbKGZyYW1lWzJdK2ZyYW1lWzRdKS8yLCAoZnJhbWVbM10rZnJhbWVbNV0pLzJdO1xuXHR2YXIgZnJhbWUwID0gZnJhbWVzWzBdO1xuXHR2YXIgcmFkaXVzSGVhZCA9IE1hdGguaHlwb3QoZnJhbWUwWzJdLWZyYW1lMFs0XSwgZnJhbWUwWzNdLWZyYW1lMFs1XSkvMjtcblx0Y3R4LmFyYyhjZW50ZXJIZWFkWzBdLCBjZW50ZXJIZWFkWzFdLCByYWRpdXNIZWFkLCAwLjUqTWF0aC5QSSwgIDIuNSogTWF0aC5QSSwgZmFsc2UpO1xuLy9cdGN0eC5saW5lVG8oZnJhbWVbNF0sIGZyYW1lWzVdKTtcbiAgbW92ZVRvKDApO1xuICBsaW5lVG8oNyk7IC8vIEJcblx0Y3R4LnN0cm9rZSgpO1xuXG5cdGN0eC5zdHJva2VTdHlsZSA9IFwiIzY2NjZkZFwiO1xuICBjdHguYmVnaW5QYXRoKCk7XG5cdG1vdmVUbygwKTsgIC8vIEFcblx0bGluZVRvKDMpOyAgLy8gRWxib3dcblx0bGluZVRvKDQpOyAgLy8gSGFuZFxuXG5cdG1vdmVUbyg3KTsgLy8gQlxuXHRsaW5lVG8oOCk7IC8vIEtuZWUxXG5cdGxpbmVUbyg5KTsgLy8gRm9vdDEgc3RhcnRcblx0bGluZVRvKDEwKTsgLy8gRm9vdDEgZW5kXG5cblx0Y3R4LnN0cm9rZSgpO1xuXHRjdHgucmVzdG9yZSgpO1xuXG5cbn07XG5cblxuXG52YXIgc20gPSBuZXcgU3RpY2tNYW4oKTtcblxuc20uYWRkKCdydW4nLFxuXHRcdFx0XHQwLjYsIC8vIHNlY29uZHMgZm9yIHdhbGsgY3ljbGVcblx0XHRcdFx0cmVxdWlyZSgnLi90b29scy9ydW4nKSwgdHJ1ZSwgdHJ1ZSlcblxuc20uYWRkKCdzdGFuZCcsIDMuMiwgcmVxdWlyZSgnLi90b29scy9zdGFuZCcpLCB0cnVlLCB0cnVlKTtcbnNtLmFkZCgnanVtcCcsIDEuMiwgcmVxdWlyZSgnLi90b29scy9qdW1wJyksIGZhbHNlLCBmYWxzZSk7XG5zbS5hZGQoJ2ZhbGwnLCAyLjQsIHJlcXVpcmUoJy4vdG9vbHMvZmFsbCcpLCBmYWxzZSwgZmFsc2UpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNtO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBbIC8vIDIgZnJhbWVzIGdlbmVyYXRlZCBmcm9tIGZhbGwuc3ZnXG5bICAvLyBmcmFtZSAwXG4gICAgICAgICAtNiwgLTEzOCAgLy8gQVxuICAgICwgICAtMTEsIC0xNTMgIC8vIEhlYWRTdGFydFxuICAgICwgICAtMTksIC0xODAgIC8vIEhlYWRFbmRcbiAgICAsICAgLTI5LCAtMTY1ICAvLyBFbGJvdzFcbiAgICAsICAgLTM1LCAtMjA3ICAvLyBIYW5kMVxuICAgICwgICAgIDAsIC0xNzIgIC8vIEVsYm93MlxuICAgICwgICAtMTQsIC0yMDkgIC8vIEhhbmQyXG4gICAgLCAgICAgNywgLTEwMCAgLy8gQlxuICAgICwgICAgMjAsIC04MCAgIC8vIEtuZWUxXG4gICAgLCAgICAyNiwgLTQ1ICAgLy8gRm9vdDFTdGFydFxuICAgICwgICAgMzYsIC03MCAgIC8vIEZvb3QxRW5kXG4gICAgLCAgICAzMSwgLTEyMSAgLy8gS25lZTJcbiAgICAsICAgIDM0LCAtODYgICAvLyBGb290MlN0YXJ0XG4gICAgLCAgICA0NiwgLTEwMSAgLy8gRm9vdDJFbmRcbl0sIFsgIC8vIGZyYW1lIDFcbiAgICAgICAgICA1LCAtMTEzICAvLyBBXG4gICAgLCAgICAgOSwgLTEzMCAgLy8gSGVhZFN0YXJ0XG4gICAgLCAgICAxNCwgLTE1NyAgLy8gSGVhZEVuZFxuICAgICwgICAtMjEsIC0xMzAgIC8vIEVsYm93MVxuICAgICwgICAgLTcsIC0xNzAgIC8vIEhhbmQxXG4gICAgLCAgICAzNSwgLTEyNCAgLy8gRWxib3cyXG4gICAgLCAgICA0MCwgLTE1OSAgLy8gSGFuZDJcbiAgICAsICAgIC00LCAtNjcgICAvLyBCXG4gICAgLCAgICAxMywgLTM4ICAgLy8gS25lZTFcbiAgICAsICAgIDIwLCAwICAgICAvLyBGb290MVN0YXJ0XG4gICAgLCAgICAzMywgLTE5ICAgLy8gRm9vdDFFbmRcbiAgICAsICAgIDM0LCAtNTUgICAvLyBLbmVlMlxuICAgICwgICAgMzAsIC0yMiAgIC8vIEZvb3QyU3RhcnRcbiAgICAsICAgIDQ2LCAtMzkgICAvLyBGb290MkVuZFxuXV1cbiIsIm1vZHVsZS5leHBvcnRzID0gWyAvLyAyIGZyYW1lcyBnZW5lcmF0ZWQgZnJvbSBqdW1wLnN2Z1xuWyAgLy8gZnJhbWUgMFxuICAgICAgICAgIDksIC0xMjEgIC8vIEFcbiAgICAsICAgIDEzLCAtMTM3ICAvLyBIZWFkU3RhcnRcbiAgICAsICAgICA2LCAtMTU5ICAvLyBIZWFkRW5kXG4gICAgLCAgICA0MSwgLTExOSAgLy8gRWxib3cxXG4gICAgLCAgICA0MiwgLTE1NSAgLy8gSGFuZDFcbiAgICAsICAgIDM2LCAtMTM4ICAvLyBFbGJvdzJcbiAgICAsICAgIDI0LCAtMTcyICAvLyBIYW5kMlxuICAgICwgICAgLTksIC03NSAgIC8vIEJcbiAgICAsICAgLTEwLCAtNDIgICAvLyBLbmVlMVxuICAgICwgICAtMjcsIC0xOCAgIC8vIEZvb3QxU3RhcnRcbiAgICAsICAgLTE1LCAwICAgICAvLyBGb290MUVuZFxuICAgICwgICAgMzMsIC05MCAgIC8vIEtuZWUyXG4gICAgLCAgICAgNywgLTY1ICAgLy8gRm9vdDJTdGFydFxuICAgICwgICAgLTEsIC00NCAgIC8vIEZvb3QyRW5kXG5dLCBbICAvLyBmcmFtZSAxXG4gICAgICAgICAgNCwgLTE4NiAgLy8gQVxuICAgICwgICAgIDksIC0yMDUgIC8vIEhlYWRTdGFydFxuICAgICwgICAgMTcsIC0yMjcgIC8vIEhlYWRFbmRcbiAgICAsICAgIDM0LCAtMjA3ICAvLyBFbGJvdzFcbiAgICAsICAgIDE4LCAtMjM2ICAvLyBIYW5kMVxuICAgICwgICAgMzksIC0yMDAgIC8vIEVsYm93MlxuICAgICwgICAgMjcsIC0yMzkgIC8vIEhhbmQyXG4gICAgLCAgICAtMywgLTE0MyAgLy8gQlxuICAgICwgICAgLTYsIC0xMTEgIC8vIEtuZWUxXG4gICAgLCAgIC0yOCwgLTg2ICAgLy8gRm9vdDFTdGFydFxuICAgICwgICAtMjcsIC02NSAgIC8vIEZvb3QxRW5kXG4gICAgLCAgICAzMCwgLTE2MCAgLy8gS25lZTJcbiAgICAsICAgIDE0LCAtMTIxICAvLyBGb290MlN0YXJ0XG4gICAgLCAgICAzMSwgLTEwMCAgLy8gRm9vdDJFbmRcbl1dXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFsgLy8gNiBmcmFtZXMgZ2VuZXJhdGVkIGZyb20gcnVuLnN2Z1xuWyAgLy8gZnJhbWUgMFxuICAgICAgICAgMTMsIC0xMzYgIC8vIEFcbiAgICAsICAgIDE5LCAtMTQ5ICAvLyBIZWFkU3RhcnRcbiAgICAsICAgIDIzLCAtMTcyICAvLyBIZWFkRW5kXG4gICAgLCAgIC0xOSwgLTE0MiAgLy8gRWxib3cxXG4gICAgLCAgIC00NywgLTExNSAgLy8gSGFuZDFcbiAgICAsICAgIDE5LCAtMTAwICAvLyBFbGJvdzJcbiAgICAsICAgIDQxLCAtMTA5ICAvLyBIYW5kMlxuICAgICwgICAtMTMsIC04OSAgIC8vIEJcbiAgICAsICAgIDE1LCAtNDggICAvLyBLbmVlMVxuICAgICwgICAgNDMsIC0zICAgIC8vIEZvb3QxU3RhcnRcbiAgICAsICAgIDU4LCAtMTggICAvLyBGb290MUVuZFxuICAgICwgICAtMzMsIC00OCAgIC8vIEtuZWUyXG4gICAgLCAgIC02MCwgLTgwICAgLy8gRm9vdDJTdGFydFxuICAgICwgICAtNzYsIC02NCAgIC8vIEZvb3QyRW5kXG5dLCBbICAvLyBmcmFtZSAxXG4gICAgICAgICAxMiwgLTEyMyAgLy8gQVxuICAgICwgICAgMTUsIC0xMzUgIC8vIEhlYWRTdGFydFxuICAgICwgICAgMjEsIC0xNTggIC8vIEhlYWRFbmRcbiAgICAsICAgLTI1LCAtMTA3ICAvLyBFbGJvdzFcbiAgICAsICAgLTQ1LCAtNzIgICAvLyBIYW5kMVxuICAgICwgICAgMjEsIC04MSAgIC8vIEVsYm93MlxuICAgICwgICAgNDYsIC04OCAgIC8vIEhhbmQyXG4gICAgLCAgIC0xMSwgLTY2ICAgLy8gQlxuICAgICwgICAgMjksIC00MCAgIC8vIEtuZWUxXG4gICAgLCAgICAxMCwgLTQgICAgLy8gRm9vdDFTdGFydFxuICAgICwgICAgMzIsIC0zICAgIC8vIEZvb3QxRW5kXG4gICAgLCAgIC0xMywgLTI2ICAgLy8gS25lZTJcbiAgICAsICAgLTQ1LCAtNDQgICAvLyBGb290MlN0YXJ0XG4gICAgLCAgIC02NCwgLTM3ICAgLy8gRm9vdDJFbmRcbl0sIFsgIC8vIGZyYW1lIDJcbiAgICAgICAgIDEyLCAtMTI3ICAvLyBBXG4gICAgLCAgICAxNywgLTEzOSAgLy8gSGVhZFN0YXJ0XG4gICAgLCAgICAyMywgLTE2MiAgLy8gSGVhZEVuZFxuICAgICwgICAtMTIsIC05OCAgIC8vIEVsYm93MVxuICAgICwgICAtMjEsIC01NiAgIC8vIEhhbmQxXG4gICAgLCAgICAgMywgLTk3ICAgLy8gRWxib3cyXG4gICAgLCAgICAyNSwgLTcxICAgLy8gSGFuZDJcbiAgICAsICAgLTExLCAtNzQgICAvLyBCXG4gICAgLCAgICAgMSwgLTM5ICAgLy8gS25lZTFcbiAgICAsICAgLTE0LCAtMiAgICAvLyBGb290MVN0YXJ0XG4gICAgLCAgICAgNSwgLTMgICAgLy8gRm9vdDFFbmRcbiAgICAsICAgIDEwLCAtNDUgICAvLyBLbmVlMlxuICAgICwgICAtMjAsIC0zNSAgIC8vIEZvb3QyU3RhcnRcbiAgICAsICAgLTMxLCAtMTggICAvLyBGb290MkVuZFxuXSwgWyAgLy8gZnJhbWUgM1xuICAgICAgICAgMTUsIC0xMzcgIC8vIEFcbiAgICAsICAgIDIwLCAtMTUxICAvLyBIZWFkU3RhcnRcbiAgICAsICAgIDI0LCAtMTczICAvLyBIZWFkRW5kXG4gICAgLCAgICAgMSwgLTEwMyAgLy8gRWxib3cxXG4gICAgLCAgICAyOCwgLTg0ICAgLy8gSGFuZDFcbiAgICAsICAgLTExLCAtMTEyICAvLyBFbGJvdzJcbiAgICAsICAgIC0zLCAtNzcgICAvLyBIYW5kMlxuICAgICwgICAtMTQsIC04NCAgIC8vIEJcbiAgICAsICAgLTIxLCAtNDQgICAvLyBLbmVlMVxuICAgICwgICAtNTAsIC0xNSAgIC8vIEZvb3QxU3RhcnRcbiAgICAsICAgLTMxLCAtMSAgICAvLyBGb290MUVuZFxuICAgICwgICAgMjQsIC02OCAgIC8vIEtuZWUyXG4gICAgLCAgICAgMSwgLTM3ICAgLy8gRm9vdDJTdGFydFxuICAgICwgICAgMTIsIC0xOCAgIC8vIEZvb3QyRW5kXG5dLCBbICAvLyBmcmFtZSA0XG4gICAgICAgICAxMywgLTE0NCAgLy8gQVxuICAgICwgICAgMjAsIC0xNTkgIC8vIEhlYWRTdGFydFxuICAgICwgICAgMjQsIC0xODEgIC8vIEhlYWRFbmRcbiAgICAsICAgICA1LCAtMTA1ICAvLyBFbGJvdzFcbiAgICAsICAgIDM4LCAtOTYgICAvLyBIYW5kMVxuICAgICwgICAtMTksIC0xMjMgIC8vIEVsYm93MlxuICAgICwgICAtMTQsIC04NiAgIC8vIEhhbmQyXG4gICAgLCAgIC0xMiwgLTk4ICAgLy8gQlxuICAgICwgICAtNDIsIC01NyAgIC8vIEtuZWUxXG4gICAgLCAgIC03OSwgLTIyICAgLy8gRm9vdDFTdGFydFxuICAgICwgICAtNzEsIDAgICAgIC8vIEZvb3QxRW5kXG4gICAgLCAgICAyNSwgLTc5ICAgLy8gS25lZTJcbiAgICAsICAgIDI0LCAtMzQgICAvLyBGb290MlN0YXJ0XG4gICAgLCAgICA0NCwgLTMwICAgLy8gRm9vdDJFbmRcbl0sIFsgIC8vIGZyYW1lIDVcbiAgICAgICAgIDE1LCAtMTQ1ICAvLyBBXG4gICAgLCAgICAyMSwgLTE1NSAgLy8gSGVhZFN0YXJ0XG4gICAgLCAgICAyOSwgLTE3OSAgLy8gSGVhZEVuZFxuICAgICwgICAgMTcsIC0xMDAgIC8vIEVsYm93MVxuICAgICwgICAgNTAsIC0xMDMgIC8vIEhhbmQxXG4gICAgLCAgIC0yMywgLTEzMSAgLy8gRWxib3cyXG4gICAgLCAgIC0zMywgLTkyICAgLy8gSGFuZDJcbiAgICAsICAgLTE0LCAtOTMgICAvLyBCXG4gICAgLCAgIC00MCwgLTUwICAgLy8gS25lZTFcbiAgICAsICAgLTkxLCAtNDggICAvLyBGb290MVN0YXJ0XG4gICAgLCAgIC05OCwgLTI0ICAgLy8gRm9vdDFFbmRcbiAgICAsICAgIDI5LCAtNzcgICAvLyBLbmVlMlxuICAgICwgICAgMzksIC0zMSAgIC8vIEZvb3QyU3RhcnRcbiAgICAsICAgIDYxLCAtNDAgICAvLyBGb290MkVuZFxuXV1cbiIsIm1vZHVsZS5leHBvcnRzID0gWyAvLyAzIGZyYW1lcyBnZW5lcmF0ZWQgZnJvbSBzdGFuZC5zdmdcblsgIC8vIGZyYW1lIDBcbiAgICAgICAgIDEyLCAtMTI2ICAvLyBBXG4gICAgLCAgICAxNywgLTEzOCAgLy8gSGVhZFN0YXJ0XG4gICAgLCAgICAyNCwgLTE2MSAgLy8gSGVhZEVuZFxuICAgICwgICAtMTEsIC05NCAgIC8vIEVsYm93MVxuICAgICwgICAtMTQsIC01NiAgIC8vIEhhbmQxXG4gICAgLCAgICAgMiwgLTkzICAgLy8gRWxib3cyXG4gICAgLCAgICAyNSwgLTYzICAgLy8gSGFuZDJcbiAgICAsICAgLTExLCAtNzAgICAvLyBCXG4gICAgLCAgICAgMiwgLTM3ICAgLy8gS25lZTFcbiAgICAsICAgLTEzLCAtMiAgICAvLyBGb290MVN0YXJ0XG4gICAgLCAgICAgOCwgLTIgICAgLy8gRm9vdDFFbmRcbiAgICAsICAgICA5LCAtMzggICAvLyBLbmVlMlxuICAgICwgICAgLTcsIC0xICAgIC8vIEZvb3QyU3RhcnRcbiAgICAsICAgIDEwLCAtMiAgICAvLyBGb290MkVuZFxuXSwgWyAgLy8gZnJhbWUgMVxuICAgICAgICAgMTAsIC0xMjcgIC8vIEFcbiAgICAsICAgIDE0LCAtMTQwICAvLyBIZWFkU3RhcnRcbiAgICAsICAgIDIwLCAtMTYxICAvLyBIZWFkRW5kXG4gICAgLCAgICAtOSwgLTkyICAgLy8gRWxib3cxXG4gICAgLCAgIC0xMCwgLTU3ICAgLy8gSGFuZDFcbiAgICAsICAgICA1LCAtOTMgICAvLyBFbGJvdzJcbiAgICAsICAgIDIxLCAtNjAgICAvLyBIYW5kMlxuICAgICwgICAgLTksIC03MiAgIC8vIEJcbiAgICAsICAgICAyLCAtMzUgICAvLyBLbmVlMVxuICAgICwgICAtMTQsIC0xICAgIC8vIEZvb3QxU3RhcnRcbiAgICAsICAgICAyLCAtMiAgICAvLyBGb290MUVuZFxuICAgICwgICAgIDgsIC0zNiAgIC8vIEtuZWUyXG4gICAgLCAgICAtNywgLTIgICAgLy8gRm9vdDJTdGFydFxuICAgICwgICAgMTEsIC0xICAgIC8vIEZvb3QyRW5kXG5dLCBbICAvLyBmcmFtZSAyXG4gICAgICAgICAxMiwgLTEyNiAgLy8gQVxuICAgICwgICAgMTUsIC0xNDEgIC8vIEhlYWRTdGFydFxuICAgICwgICAgMjQsIC0xNjEgIC8vIEhlYWRFbmRcbiAgICAsICAgLTEwLCAtOTAgICAvLyBFbGJvdzFcbiAgICAsICAgIC02LCAtNTUgICAvLyBIYW5kMVxuICAgICwgICAgIDMsIC04OSAgIC8vIEVsYm93MlxuICAgICwgICAgMTUsIC01OSAgIC8vIEhhbmQyXG4gICAgLCAgIC0xMSwgLTY4ICAgLy8gQlxuICAgICwgICAgIDMsIC0zNSAgIC8vIEtuZWUxXG4gICAgLCAgIC0xNSwgMCAgICAgLy8gRm9vdDFTdGFydFxuICAgICwgICAgIDEsIC0xICAgIC8vIEZvb3QxRW5kXG4gICAgLCAgICAgNywgLTM3ICAgLy8gS25lZTJcbiAgICAsICAgIC01LCAtMiAgICAvLyBGb290MlN0YXJ0XG4gICAgLCAgICAxMSwgLTIgICAgLy8gRm9vdDJFbmRcbl1dXG4iLCJcblxudmFyIFJORyA9IHtcblx0c2V0U2VlZDogZnVuY3Rpb24oc2VlZCkge1xuXHQgICAgc2VlZCA9IChzZWVkIDwgMSA/IDEvc2VlZCA6IHNlZWQpO1xuXG5cdCAgICB0aGlzLl9zZWVkID0gc2VlZDtcblx0ICAgIHRoaXMuX3MwID0gKHNlZWQgPj4+IDApICogdGhpcy5fZnJhYztcblxuXHQgICAgc2VlZCA9IChzZWVkKjY5MDY5ICsgMSkgPj4+IDA7XG5cdCAgICB0aGlzLl9zMSA9IHNlZWQgKiB0aGlzLl9mcmFjO1xuXG5cdCAgICBzZWVkID0gKHNlZWQqNjkwNjkgKyAxKSA+Pj4gMDtcblx0ICAgIHRoaXMuX3MyID0gc2VlZCAqIHRoaXMuX2ZyYWM7XG5cblx0ICAgIHRoaXMuX2MgPSAxO1xuXHQgICAgcmV0dXJuIHRoaXM7XG5cdH0sXG5cbiAgICBfczA6IDAsXG4gICAgX3MxOiAwLFxuICAgIF9zMjogMCxcbiAgICBfYzogMCxcbiAgICBfZnJhYzogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMCAvKiAyXi0zMiAqL1xufSxcblxuLyoqXG4gKiBAcmV0dXJucyB7ZmxvYXR9IFBzZXVkb3JhbmRvbSB2YWx1ZSBbMCwxKSwgdW5pZm9ybWx5IGRpc3RyaWJ1dGVkXG4gKi9cbnJuZD0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHQgPSAyMDkxNjM5ICogUk5HLl9zMCArIFJORy5fYyAqIFJORy5fZnJhYztcbiAgICBSTkcuX3MwID0gUk5HLl9zMTtcbiAgICBSTkcuX3MxID0gUk5HLl9zMjtcbiAgICBSTkcuX2MgPSB0IHwgMDtcbiAgICBSTkcuX3MyID0gdCAtIFJORy5fYztcbiAgICByZXR1cm4gUk5HLl9zMjtcbn1cblxuXG5STkcuc2V0U2VlZCg1KVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0cmFuZ2U6IGZ1bmN0aW9uKG1heEludCxpdGVyRnUpIHtcbiAgICBmb3IgKHZhciBpPTA7IGk8bWF4SW50OyBpKyspXG4gICAgICAgIGl0ZXJGdShpKVxuXHR9LFxuLy8gYnJlYWtpbmctcmFuZ2UgLSB3aWxsIHJldHVybiBub24tZmFsc2UgdmFsdWUgZnJvbSBpdGVyYXRvciBhbmQgYnJlYWsgdGhlIGxvb3Bcblx0YnJyYW5nZTogZnVuY3Rpb24obWF4SW50LGl0ZXJGdSkge1xuICAgIGZvciAodmFyIGk9MDsgaTxtYXhJbnQ7IGkrKykge1xuICAgICAgICB2YXIgcmVzID0gaXRlckZ1KGkpXG4gICAgICAgIGlmIChyZXMpIHJldHVybiByZXM7XG4gICAgfVxuXHR9LFxuLy8gcmV0dXJuIG5vbi1mYWxzZSB2YWx1ZSBmcm9tIGl0ZXJhdG9yIHdpbGwgYnJlYWsgdGhlIGxvb3Bcblx0ZWFjaDogZnVuY3Rpb24oY29sbGVjdGlvbiwgaXRlckZ1KSB7XG5cdC8vIGxvb3BpbmcgZnJvbSBlbmQgdG8gc3RhcnQgLSB0byBhbGxvdyBlYXN5IHJlbW92YWwgb2YgaXRlcmF0ZWQgZWxlbWVudCB3aXRob3V0IHNraXBwaW5nXG4gICAgZm9yICh2YXIgaT1jb2xsZWN0aW9uLmxlbmd0aC0xOyBpPj0wOyBpLS0pIHtcbiAgICAgICAgdmFyICQ9Y29sbGVjdGlvbltpXTtcbiAgICAgICAgaWYgKGl0ZXJGdSgkLGkpKSB7XG4gICAgICAgIFx0cmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXHR9LFxuXG5cdG1pbm1heDogZnVuY3Rpb24obW4sIG14LCB2KSB7IHJldHVybiBtaW4obXgsIG1heChtbiwgdikpfSxcblxuXHRkdVJhbmdlOiBmdW5jdGlvbih3LGgsIGZ1KSB7XG5cdFx0Zm9yICh2YXIgeT0wOyB5PGg7IHkrKylcblx0XHRcdGZvciAodmFyIHg9MDsgeDx3OyB4KyspXG5cdFx0XHRcdGZ1KHgseSk7XG5cdH0sXG59O1xuLy8gY3JlYXRlQ2FudmFzID0gZnVuY3Rpb24odyxoKSB7XG4vLyBcdCAgdmFyIGMgPSBEQy5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbi8vIFx0ICBjLndpZHRoID0gdyB8fCBXSURUSDtcbi8vIFx0ICBjLmhlaWdodCA9IGggfHwgSEVJR0hUO1xuLy8gXHQgIHJldHVybiBjO1xuLy8gXHR9LFxuLy9cbi8vIGF2ZyA9IGZ1bmN0aW9uKGEsYikgeyByZXR1cm4gKGErYikvMiB9LFxuLy9cbi8vIC8vIExBWUVSU1xuLy8gY2FudmFzZXMgPSBbXSxcbi8vIGNvbnRleHRzID0gW10sXG4vL1xuLy9cbi8vIEN0eCA9IGZ1bmN0aW9uKGNhbnZhcykge1xuLy8gXHRyZXR1cm4gY2FudmFzLmdldENvbnRleHQoJzJkJylcbi8vIH0sXG4vL1xuLy8gREMgPSBkb2N1bWVudDtcbi8vXG4vLyBEQy5nZXRFbGVtZW50QnlJZCgnb3ZlcmxheScpLnN0eWxlLndpZHRoID0gV0lEVEgrXCJweFwiO1xuLy8gREMuZ2V0RWxlbWVudEJ5SWQoJ292ZXJsYXknKS5zdHlsZS5sZWZ0ID0gKC1XSURUSD4+MSkrXCJweFwiO1xuLy9cbi8vIHZhciBjb250ID0gIERDLmdldEVsZW1lbnRCeUlkKCdjYW52YXNfY29udCcpO1xuLy8gcmFuZ2UoNiwgZnVuY3Rpb24oaSkge1xuLy8gICAgdmFyIGNhbnZhcyA9IChpPT01KSA/IGNyZWF0ZUNhbnZhcyhpbm5lcldpZHRoLCBpbm5lckhlaWdodCkgOiBjcmVhdGVDYW52YXMoKTtcbi8vICAgIGlmIChpPT01KSB7XG4vLyBcdCAgIGNhbnZhcy5zdHlsZS5sZWZ0ID0gJzBweCc7XG4vLyBcdCAgIGNhbnZhcy5zdHlsZS50b3AgPSAnMHB4Jztcbi8vIFx0ICAgY2FudmFzLnN0eWxlWydtYXJnaW4tbGVmdCddID0gJzBweCc7XG4vLyBcdCAgIGNhbnZhcy5zdHlsZVsnbWFyZ2luLXRvcCddID0gJzBweCc7XG4vLyAgICB9XG4vLyAgICBlbHNlIHtcbi8vIFx0ICAgY2FudmFzLnN0eWxlLmxlZnQgPSAoLVdJRFRIPj4xKSsncHgnO1xuLy8gICAgfVxuLy8gICAgY29udC5hcHBlbmRDaGlsZChjYW52YXMpO1xuLy8gICAgY2FudmFzZXMucHVzaChjYW52YXMpO1xuLy8gICAgY29udGV4dHMucHVzaChDdHgoY2FudmFzKSlcbi8vIH0pO1xuLy9cbi8vICAvLyBjdXJyZW50IGNhbnZhcyB0byBkcmF3IHRvIC0gbWF5IHRvZ2dsZSBhcm91bmQgZm9yIGRvdWJsZSBidWZmZXJpbmdcbi8vXG4vLyB2YXIgc2t5Q3R4ID0gY29udGV4dHNbMF0sXG4vLyBza3lTcHJpdGVzQ3R4ID0gY29udGV4dHNbMV0sXG4vLyBtb3VudGFpbkN0eCA9IGNvbnRleHRzWzJdLFxuLy8gc3ByaXRlc0N0eCA9IGNvbnRleHRzWzNdLFxuLy8gd2F0ZXJDdHggPSBjb250ZXh0c1s0XSxcbi8vIG92ZXJsYXlDdHggPSBjb250ZXh0c1s1XSxcbi8vIG92ZXJsYXlDYW52ID0gY2FudmFzZXNbNV0sXG4vL1xuLy9cbi8vIGFicyA9IE1hdGguYWJzLFxuLy8gbWluID0gTWF0aC5taW4sXG4vLyBtYXggPSBNYXRoLm1heCxcbi8vIHNpbj0gTWF0aC5zaW4sXG4vLyByb3VuZCA9IE1hdGgucm91bmQsXG4vLyBzcXJ0PU1hdGguc3FydCxcbi8vIHNxPWZ1bmN0aW9uKHgpe3JldHVybiB4Knh9LFxuLy8gVTggPSAyNTUsIC8vIG1heCB1bnNpZ25lZCA4Yml0XG4vLyBQSSA9IE1hdGguUEksXG4vLyBUUEkgPSAyKlBJLFxuLy9cbi8vXG4vLyAvLyByYW5kb20gaW4gcmFuZ2UgWzAsYSlcbi8vIHJuZGEgPSBmdW5jdGlvbihhKSB7IHJldHVybiBybmQoKSphfSxcbi8vIC8vIHJhbmRvbSBpbnRlZ2VyIGluIHJhbmdlIFswLGEtMV1cbi8vIGlybmRhID0gZnVuY3Rpb24oYSkgeyByZXR1cm4gcm5kYShhKXwwfSxcbi8vIC8vIHJhbmRvbSBpbiByYW5nZSBbYSxiKVxuLy8gcm5kYWIgPSBmdW5jdGlvbihhLGIpIHsgcmV0dXJuIGErcm5kYShiLWEpfSxcbi8vIC8vIHJhbmRvbSBpbnRlZ2VyIGluIHJhbmdlIFthLGItMV1cbi8vIGlybmRhYiA9IGZ1bmN0aW9uKGEsYikgeyByZXR1cm4gcm5kYWIoYSxiKXwwIH0sXG4vL1xuLy9cbi8vIC8vIHBvbHlmaWxsIFJlcXVlc3RBbmltRnJhbWVcbi8vIHN1ZmZpeCA9ICdlcXVlc3RBbmltYXRpb25GcmFtZScsXG4vLyBSUT0gd2luZG93WydyJytzdWZmaXhdIHx8IHdpbmRvd1snbW96Uicrc3VmZml4XSB8fCB3aW5kb3dbJ3dlYmtpdFInK3N1ZmZpeF07XG4vLyBpZiAoIVJRKSB7XG4vLyAgICAgdmFyIGxhc3RUaW1lID0gMDtcbi8vICAgICBSUSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4vLyAgICAgICAgIHZhciBjdXJyVGltZSA9IERhdGUubm93KCk7XG4vLyAgICAgICAgIHZhciB0aW1lVG9DYWxsID0gbWF4KDAsIDE2IC0gKGN1cnJUaW1lIC0gbGFzdFRpbWUpKTtcbi8vICAgICAgICAgdmFyIGlkID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7IH0sXG4vLyAgICAgICAgICAgICB0aW1lVG9DYWxsKTtcbi8vICAgICAgICAgbGFzdFRpbWUgPSBjdXJyVGltZSArIHRpbWVUb0NhbGw7XG4vLyAgICAgfVxuLy8gfVxuXG5pZiAoZmFsc2UpIHtcblx0d2luZG93Lm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvck1zZywgdXJsLCBsaW5lTnVtYmVyKSB7XG5cdFx0aWYoIC9BbmRyb2lkfHdlYk9TfGlQaG9uZXxpUGFkfGlQb2R8QmxhY2tCZXJyeXxJRU1vYmlsZXxPcGVyYSBNaW5pL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSApIHtcblx0XHRcdGFsZXJ0KFwiRXJyb3Igb2NjdXJlZDogXCIgKyBlcnJvck1zZytcIiAgYXQgbGluZTpcIitsaW5lTnVtYmVyKTtcblx0XHR9XG5cdFx0Y29uc29sZS53YXJuKFwiRXJyb3I6IFwiK2Vycm9yTXNnK1wiXFxuIFVSTDogXCIrIHVybCtcIlxcbiBMaW5lOiBcIitsaW5lTnVtYmVyKTtcblx0ICAgIHJldHVybiBmYWxzZTtcblx0fVxuXHR3aW5kb3cuc2F2ZVBuZyA9IGZ1bmN0aW9uKGMpIHtcblx0XHRkb2N1bWVudC5sb2NhdGlvbi5ocmVmID0gIGMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKS5yZXBsYWNlKFwiaW1hZ2UvcG5nXCIsIFwiaW1hZ2Uvb2N0ZXQtc3RyZWFtXCIpXG5cdH1cblx0d2luZG93Lmdsb2JhbERldGVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh3aW5kb3cuc3RhbmRhcmRfZ2xvYmFscykge1xuXHRcdFx0dmFyIF9rZXlzID0ge31cblx0XHRcdGZvciAodmFyIGk9MDsgaTxzdGFuZGFyZF9nbG9iYWxzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdF9rZXlzW3N0YW5kYXJkX2dsb2JhbHNbaV1dID0gMTtcblx0XHRcdH1cblx0XHRcdGZvciAodmFyIGsgaW4gd2luZG93KSB7XG5cdFx0XHRcdGlmICghX2tleXNba10pIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIkxlYWs6IFwiLGspO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0dmFyIF9rZXlzID0gW107XG5cdFx0XHRmb3IgKHZhciBrIGluIHdpbmRvdykge1xuXHRcdFx0XHRfa2V5cy5wdXNoKCdcIicraysnXCInKTtcblx0XHRcdH1cblx0XHRcdGNvbnNvbGUubG9nKFwic3RhbmRhcmRfZ2xvYmFscyA9IFtcIitfa2V5cy5qb2luKFwiLCBcIikrXCJdXCIpXG5cdFx0fVxuXHR9XG59XG5cbi8vIC8vIGdldCBpbWcgZGF0YSBmcm9tXG4vLyB2YXIgZ2V0UGl4ZWxzPSBmdW5jdGlvbihjdHgpIHtcbi8vICAgcmV0dXJuIGN0eC5nZXRJbWFnZURhdGEoMCwwLGN0eC5jYW52YXMud2lkdGgsY3R4LmNhbnZhcy5oZWlnaHQpO1xuLy8gfSxcbi8vXG4vL1xuLy8gcmVuZGVyMnBpeGVscz1mdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCByZW5kZXJGdW5jdGlvbikge1xuLy8gXHR2YXIgY2FudmFzID0gY3JlYXRlQ2FudmFzKHdpZHRoLCBoZWlnaHQpLFxuLy8gXHRcdGN0eD1DdHgoY2FudmFzKSxcbi8vIFx0XHRpbWdEYXRhPWdldFBpeGVscyhjdHgpLFxuLy8gXHQgICAgZCA9IGltZ0RhdGEuZGF0YTtcbi8vIFx0cmVuZGVyRnVuY3Rpb24oZCxjdHgsY2FudmFzKTtcbi8vICAgICBjdHgucHV0SW1hZ2VEYXRhKGltZ0RhdGEsMCwwKTtcbi8vIFx0cmV0dXJuIGNhbnZhcztcbi8vIH0sXG4vL1xuLy8gZHJhd0ltZyA9IGZ1bmN0aW9uKGN0eCwgaW1nLCB4LHkpIHtcbi8vIFx0Y3R4LmRyYXdJbWFnZShpbWcsIHgseSwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0KTtcbi8vIH0sXG4vL1xuLy9cbi8vXG4vLyBpbml0UXVldWUgPSBbXSxcbi8vIGluaXRGdSA9IGZ1bmN0aW9uKHRleHQsIHBnLCBmdSkge1xuLy8gXHRpbml0UXVldWUucHVzaChbdGV4dCxwZyxmdV0pXG4vLyB9XG4iXX0=
