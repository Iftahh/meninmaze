
function isEmpty(obj) {
  for(var i in obj) { return false; }
  return true;
}
function room(x,y) {
  return x+","+y;
}
function rndInt(mx) {
  return Math.random() * mx | 0;
}


function generateMaze(MAZE_X, MAZE_Y) {
  var unvisitedCells = {},
    mazeData = [],
    WALL = 0,
    AIR = 1,
    x,y,t,
      stack=[],
      nx,ny,neighborsDup,dir,
      popcell,
       // pairs of (dx,dy)
       // duplicate horizontal to give more chance for horizontal pathes
      neighbors = [0,1, 0,-1, 1,0,1,0,1,0,   -1,0,-1,0,-1,0];

// mazeData is 4 times bigger than MAXE_X x MAZE_Y - so do twice each row, and add two cells for each X

  for (y=0; y<MAZE_Y; y++) {
    for (t=0; t<2; t++) {
      for (x=0; x<MAZE_X; x++) {
        unvisitedCells[room(x,y)] = 1;
        mazeData.push(WALL);
        mazeData.push(WALL);
      }
    }
  }

  x = rndInt(MAZE_X);
  y=rndInt(MAZE_Y);

  while (1) {
    // visit x,y (unless we've been here before and this is a backtrack)
    if (unvisitedCells[room(x,y)]) {
      delete unvisitedCells[room(x,y)];
      mazeData[MAZE_X*y*4+x*2] = AIR;
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
      mazeData[MAZE_X*2*(2*y+dir[1])+2*x+dir[0]] = AIR;

      // save this location in case we reach a dead end later and need to backtrack
      stack.push(room(x,y));

      // move to new location
      x = nx;
      y = ny;
      break;
    }
  }

  return mazeData;
}

//module.exports = generateMaze;

var MAZE_X=24,
    MAZE_Y=20,
    maze = generateMaze(MAZE_X, MAZE_Y),

    W = 600,
    H = 400,

    ctx = document.getElementById('canvas').getContext("2d");


function drawMaze() {

    ctx.fillStyle = "#000";
    var w = MAZE_X*2;
    var h = MAZE_Y*2;
    var cellWidth = Math.min((W-20)/w, (H-20)/h);
    ctx.fillRect(0,0, W, H);

    ctx.fillStyle = "#ffa";
    for (var y=0; y<h; y++) {
      for (var x=0; x<w; x++) {
        if (maze[w*y+x]) {
          ctx.fillRect(10+x*cellWidth, 10+y*cellWidth, cellWidth, cellWidth);
        }
      }
    }
}
drawMaze();
