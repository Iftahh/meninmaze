
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


  maze.BFS = BFS;
  maze.places = findPlaces();
  return maze;
}

module.exports = generateMaze;
