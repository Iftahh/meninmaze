

function generateMaze(MAZE_X, MAZE_Y, maze) {


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

/*            if (maze.places.bottomDE[ofs]) {
               ctx.fillStyle = "#faa";
               ctx.fillRect(x*cellSize+small, y*cellSize+small, small,small);
               ctx.fillStyle = "#eef";
            }*/
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


  maze.draw = drawMaze;
  maze.get = function(x,y) {
    return maze[y*MAZE_X+x];
  }
  return maze;
}

module.exports = generateMaze;
