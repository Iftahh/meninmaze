var camera = require('./camera');
var KEYS = require('./input');

(function() {

// private:
  var x=0, y=0,
    vx=0,vy=0,
    onGround= 1,
    WIDTH=15, HEIGHT=20;


// public
module.exports = {


  update: function(world) {
    var step = world.cellSize/60;

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

    if (KEYS[39]) {
      vx += step;
      vx = Math.min(vx, world.maxSpeedX);
    }
    else if (KEYS[37]) {
      vx -= step;
      vx = Math.max(vx, -world.maxSpeedX);
    }
    else {
      vx *= .2;
      if (Math.abs(vx) < 0.01) {
        vx = 0;
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
      }
    }
    else if (vx < 0) {
      if (!world.maze.get(cellXLeft, cellYTop) || !world.maze.get(cellXLeft, cellYBottom)) {
          // collided left, move to right edge of cell
        x = (cellXLeft+1)*world.cellSize+1;
        vx = 0;
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

  draw: function(ctx) {
    if (onGround) {
      ctx.fillStyle = "#ff0";
    }
    else {
      ctx.fillStyle = "#0f0";
    }
    ctx.fillRect(x, y, WIDTH, HEIGHT);
  }
}
})();
