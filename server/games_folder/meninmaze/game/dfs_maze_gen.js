
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


  // TODO: Floyd Marshal for all pairs
  //       https://mgechev.github.io/javascript-algorithms/graphs_shortest-path_floyd-warshall.js.html
  // zeroDist = array of offsets of cells which will have min distance
  // result = maze of distance from the
  // BFS is used to find far away places (eg. to place bulbs and players far apart)
  function BFS(zeroDist) {
    // reset
    for (var y=0; y<MAZE_Y; y++) {
      for (var x=0; x<MAZE_X; x++) {
        var ofs = MAZE_X*y+x;
        if (maze[ofs]) {
          maze[ofs] = 1;
        }
      }
    }
    for (var i=0; i<zeroDist.length; i++) {
      maze[zeroDist[i]] = 10;
    }
    var ofs,
        stack = zeroDist.slice(),
        d,
        fu = function(ofs) {
          if (maze[ofs]==1) {
            maze[ofs]=d;
            stack.push(ofs)
          }
        };

    while (stack.length) {
      ofs = stack.shift();
      d = maze[ofs]+1;
      fu(ofs+1);
      fu(ofs-1);
      fu(ofs+MAZE_X);
      fu(ofs-MAZE_X);
    }
  }

  // GENERATE MAZE:
// maze is 4 times bigger than MAZE_X x MAZE_Y - so do twice each row, and add two cells for each X

  for (y=0; y<MAZE_Y; y++) {
    for (t=0; t<2; t++) {
      for (x=0; x<MAZE_X; x++) {
        unvisitedCells[room(x,y)] = 1;
        maze.push(WALL);
        maze.push(WALL);
      }
    }
  }

  var x0 = rndInt(MAZE_X);
    y0=rndInt(MAZE_Y);
  x=x0;
  y=y0;

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

  BFS([MAZE_X*y0+x0]);

  //maze.cycles = []; // TODO remove
  // add a few cycles
  for (var cycles=0; cycles<5; cycles++) {
    var ofs = rndInt(maze.length);
    while(1) {
      var x = ofs%MAZE_X;
      if (x > 1 && x < MAZE_X-1 &&
        !maze[ofs] && maze[ofs+1] && maze[ofs-1] && !maze[ofs-MAZE_X] && !maze[ofs+MAZE_X]) {
        // found a vertical wall, check if the locations on the sides are far away to travel
        // - if so a good place to insert a cycle
        if (Math.abs(maze[ofs+1] - maze[ofs-1]) > 20) {
          // found a good place to add a cycle
          maze[ofs] = AIR;
          BFS([ofs]);
        //  maze.cycles.push(ofs);
          break;
        }
      }
      // not found try next offset
      ofs = (ofs+1)%maze.length;
    }
  }


  function findPlaces() {
    // maybe instead of maps use array and binary search in case need to check contains?
    //  http://oli.me.uk/2013/06/08/searching-javascript-arrays-with-a-binary-search/
    var places = {
      horizDE: [],  // DE = dead end
      // topDE: [],
      bottomDE: [],
      // hallway: [],
      // chute: [],
    };

    var ofs =0;
    for (var y=0; y<MAZE_Y; y++ ) {
      for (var x=0; x<MAZE_X; x++ ) {
        if (maze[ofs]) {
          if (maze[ofs+1] && maze[ofs-1]) { // both left and right
            // if (maze[ofs+2] && maze[ofs-2] && !maze[ofs+MAZE_X])
              // places.hallway.push(ofs);
          }
          else if (maze[ofs+1] || maze[ofs-1]) {  // only left or only right
            // check not corner
            if (!maze[ofs+MAZE_X] && !maze[ofs-MAZE_X])
              places.horizDE.push(ofs);
          }
          else if (maze[ofs+MAZE_X] && maze[ofs-MAZE_X]) {
            // places.chute.push(ofs); // both up and down
          }
          else if (maze[ofs-MAZE_X]) {
            places.bottomDE.push(ofs);
          }
          // else if (maze[ofs+MAZE_X]) {
          //   places.topDE.push(ofs);
          // }
        }
        ofs++
      }
    }
    return places;
  }


  // TODO: add keys and locks, eg http://www.squidi.net/three/entry.php?id=4


  maze.BFS = BFS;
  maze.places = findPlaces();
  log("Finished generating maze");
  return maze;
}

module.exports = generateMaze;
