var camera = require('./camera');
var KEYS = require('./input');
var stickman = require('./stickman');

(function() {

// private:
  var x=0, y=0,
    vx=0,vy=0,
    onGround= 1,
    onWall=0,
    WIDTH=15, HEIGHT=25,
    totalElapsed=0,
    curAnim,
    run = stickman.animations.run,
    direction=0,
    stand = stickman.animations.stand;


function setAnim(anim) {
  if (anim != curAnim) {
    curAnim = anim;
    console.log("Setting anim to "+anim.name);
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

    var groundAnim = run;
    if (KEYS[39]) { // RIGHT
      vx += step;
      vx = Math.min(vx, world.maxSpeedX);
      direction = 0;
    }
    else if (KEYS[37]) {  // LEFT
      vx -= step;
      vx = Math.max(vx, -world.maxSpeedX);
      direction = 1;
    }
    else {
      vx *= .2;
      if (Math.abs(vx) < 0.01) {
        vx = 0;
        groundAnim = stand;
      }
    }
    if (onGround && !onWall) {
      setAnim(groundAnim);
    }


    // COLLISION DETECTION

    // find maze cell for collision check
    // initially checking Y collision, use smaller X
    var cellXLeft = Math.floor((x+vx+2) / world.cellSize),
      cellXRight = Math.floor((WIDTH-3+x+vx) / world.cellSize),
      cellYTop = Math.floor((y+vy) / world.cellSize),
      cellYBottom = Math.floor((HEIGHT+y+vy) / world.cellSize);


    onWall=onGround = 0;
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
          onGround = Math.random() < world.chanceJumpWall;  // small chance to be "onGround" and be able to jump
          onWall = 1;
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
          onGround = Math.random() < world.chanceJumpWall;
          onWall = 1;
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
