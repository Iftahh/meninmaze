

function generateMaze(MAZE_X, MAZE_Y, maze, bulbs_dict) {

  // var bulbs_dict = {}
  // for (var i=0; i<bulbs.length; i++) {
  //   bulbs_dict[bulbs[i]] = 1;
  // }
  // TODO: add keys and locks, eg http://www.squidi.net/three/entry.php?id=4

  function drawMaze(ctx, cellSize) {
      ctx.fillStyle = "#eef";
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

            if (bulbs_dict[ofs]) {
              bulbs_dict[ofs].draw(ctx, cellSize)
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

  // zeroDist = array of offsets of cells which will have min distance
  // target = offset to stop when reached
  // result = maze of distance from the
  maze.BFS = function(zeroDist, target) {
    // reset
    for (var y=0; y<MAZE_Y; y++) {
      for (var x=0; x<MAZE_X; x++) {
        var ofs = MAZE_X*y+x;
        if (maze[ofs]) {
          maze[ofs] = 1;
        }
      }
    }
    var ofs,
        stack = zeroDist.slice(),
        d,
        fu = function(ofs) {
          if (maze[ofs]==1) {
            maze[ofs]=d;
            if (ofs == target) {
              return;
            }
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


  maze.draw = drawMaze;
  maze.xyToOfs = function(x,y) {
    return y*MAZE_X+x;
  }
  maze.get = function(x,y) {
    return maze[y*MAZE_X+x];
  }
  return maze;
}

module.exports = generateMaze;
