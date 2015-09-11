var camera = require('./camera');
var rng = require('./rng');
var StickMan = require('./stickman'),

  WIDTH=15, HEIGHT=25,
  BLUE=1, RED=2;

module.exports = function Player() {
  // private
  var x=5, y=0,
    vx=0,vy=0,
    onGround= 1,
    onWall=0,
    reverseStack = [], // stack of intersections visited for reverse powerup
    reverseDirections = [], // directions of cells to step through to get to the next intersection

    stickman = new StickMan(70,70,170),
    run = stickman.animations.run,
    stand = stickman.animations.stand,

    totalElapsed=0,
    curAnim=0,
    direction=0;

  function setAnim(anim) {
    if (anim != curAnim) {
      curAnim = anim;
      //console.log("Setting anim to "+anim.name);
      totalElapsed = 0;
    }
  }

  // public
  this.name = 'Player '+rng.int(100);

  this.up = this.left = this.right = this.btnA = this.btnB = 0;

  this.serialize= function() {
    return {
      x: x, y:y, vx:vx, vy:vy,
      anim:curAnim.name, dir:direction,
      up: this.up, left: this.left, right: this.right
    }
  };
  this.setCamera = function() {
    camera.setTarget(x,y);
  };

  this.deserialize= function(p) {
    if (undefined !== p.x) x=p.x;
    if (undefined !== p.y) y=p.y;
    if (undefined !== p.vx) vx=p.vx;
    if (undefined !== p.vy) vy=p.vy;
    if (undefined !== p.anim) setAnim(stickman.animations[p.anim]);
    if (undefined !== p.dir) direction = p.dir;
    if (undefined !== p.up) up=p.up;
    if (undefined !== p.left) left=p.left;
    if (undefined !== p.right) right=p.right;
  };

  this.isCollide = function(left, top, width, height) {
    return (Math.abs(left - x) * 2 < (width + WIDTH)) &&
         (Math.abs(top - y) * 2 < (height + HEIGHT));
  }

  this.setColor= function(col) {
    this.color = col;
    stickman = new StickMan(col==1?70:170, 70, col!=1?70:170);
    if (this.textColor != 1) {
      this.textColor = stickman.col3;
    }
    if (this.emitPlayerInfo) {
      this.emitPlayerInfo();
    }
  };
  this.setColor(BLUE);

  this.setName= function(name) {
    if (name != this.name) {
      this.name = name;
      if (this.emitPlayerInfo) {
        this.emitPlayerInfo();
      }
    }
  };

  this.draw= function(ctx,dt) {
    ctx.save()
    // ctx.translate(x,y)
    // ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ctx.translate(WIDTH/2, HEIGHT);
    ctx.translate(x+WIDTH/2, y+HEIGHT);
    if (this.textColor == 1) {
      ctx.fillStyle = "#ff0";
    }
    else {
      ctx.fillStyle = this.textColor;
    }
    ctx.fillText(this.name, 0,-HEIGHT-5);
    ctx.scale(0.15,0.15);
    ctx.lineWidth = 15;
    ctx.lineJoin = 'bevel';
    if (direction) {
      ctx.scale(-1,1);
    }
    curAnim.render(ctx, stickman, totalElapsed);

    ctx.restore()
  }

  this.update= function(world, elapsed) {
    var step = world.cellSize/60;

    if (this.btnB && reverseStack.length) {
      // update reverse
      totalElapsed -= elapsed;
      return;
    }


    totalElapsed += elapsed;
    // update speed
    /*if (KEYS[40]) {
      vy += step;
      vy = Math.min(vy, world.cellSize);
    }
    else*/ if (this.up) {
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
    if (this.right) {
      vx += step;
      vx = Math.min(vx, world.maxSpeedX);
      direction = 0;
    }
    else if (this.left) {
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
      // walk, run, brakes, stand,  these should be set only if on ground and not sliding on wall
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

    var wallSlide = 0;
    if (vx > 0) {
      //moving right
      if (!world.maze.get(cellXRight, cellYTop) || !world.maze.get(cellXRight, cellYBottom)) {
          // collided right, move to closest to left edge of cell
        x = cellXRight * world.cellSize - WIDTH-1;
        vx = 0;
        wallSlide = this.right && vy > 0;
      }
    }
    else if (vx < 0) {
      if (!world.maze.get(cellXLeft, cellYTop) || !world.maze.get(cellXLeft, cellYBottom)) {
          // collided left, move to right edge of cell
        x = (cellXLeft+1)*world.cellSize+1;
        vx = 0;
        wallSlide = this.left && vy > 0;
      }
    }

    if (wallSlide) {
      vy *= world.wallFriction;
      onGround = Math.random() < world.chanceJumpWall;  // small chance to be "onGround" and be able to jump
      onWall = 1;
    }

    // TODO: on wall animation

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

    if (this.btnA) {
      camera.scale = Math.min(camera.scale + 0.05, 5);
      console.log("scale "+camera.scale);
    }

    // keep track of intersections for undo later
    if (world.intersections && world.player == this) {
      var cellX = Math.floor(x / world.cellSize),
        cellY = Math.floor(y / world.cellSize),
        ofs = world.maze.xyToOfs(cellX,cellY);
      if (world.intersections[ofs] && reverseStack[reverseStack.length-1] != ofs) {
        console.log("Pushing "+cellX+","+cellY+"  ofs:"+ofs+" to reverse stack");
        reverseStack.push(ofs);
        // not likely the stack will increase to this size but I hate having arrays growing to infinity
        if (reverseStack.length > 300) {
          reverseStack.shift();
        }
      }
    }
  }

  return this;
}
