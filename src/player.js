var camera = require('./camera');
var rng = require('./rng');
var StickMan = require('./stickman'),
  Shot = require('./shot'),

  gravity= 0.5, // reduce speed Y every tick
  maxSpeedX= 4,
  maxSpeedY= 8,
  jumpFromGround= 7.5, // boost up speed when jumping off ground
  jumpFromAir= 0.1, // smaller gravity when pressing up even in air
  chanceJumpWall= 0.3,  // chance to be able to jump from
  wallFriction= 0.7,

  WIDTH=15, HEIGHT=25,
  BLUE=1, RED=2;

module.exports = function Player() {
  // private
  var x=5, y=0,
    vx=0,vy=0,
    onGround= 1,
    onWall=0,
    reversed=0,
    reverseStack = [], // stack of intersections visited for reverse powerup
    reverseDirections = [], // directions of cells to step through to get to the next intersection

    stickman = new StickMan(70,70,170),
    run = stickman.animations.run,
    stand = stickman.animations.stand,
    notMoving = 0,
    lastFired= 0,
    shot=0,
    disabled=0,


    totalElapsed=0,
    curAnim=0,
    direction=0;

  function setAnim(anim) {
    if (anim != curAnim) {
      curAnim = anim;
      // console.log("Setting anim to "+anim.name);
      totalElapsed = 0;
    }
  }

  // public
  this.name = 'Player '+rng.int(100);
  this.bigShots=5;
  this.up = this.left = this.right = this.btnA = this.btnB = 0;
  this._protected=0;

  this.getX = function() {
    return x;  // client, camera, main has no need for private data of player,
              // but Shot does need the X of the players...
              // should have been Player using Shot info... oh well, will refactor later

  }

  this.getDirection = function() {
    return direction; // again ugly Shot using private data... will be fixed after contest
  }

  this.serialize= function() {
    return {
      x: x, y:y, vx:vx, vy:vy,
      anim:curAnim.name, dir:direction,
      reversed: reversed,
      btnA:this.btnA, btnB:this.btnB,
      bigShots: this.bigShots,
      shot: shot? shot.serialize() : 0,
      disabled: disabled,
      protected: this._protected,
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
    if (undefined !== p.btnA && !this.self) this.btnA = p.btnA;
    if (undefined !== p.btnB && !this.self) this.btnB = p.btnB;
    if (undefined !== p.anim) setAnim(stickman.animations[p.anim]);
    if (undefined !== p.dir) direction = p.dir;
    if (undefined !== p.reversed) reversed = p.reversed;
    if (undefined !== p.disabled) disabled = p.disabled;
    if (undefined !== p.protected) this._protected = p.protected;
    if (undefined !== p.shot) {
      if (p.shot == 0) {
        shot = 0;
      }
      else {
         if (!shot) {
          shot = new Shot(p.shot.x, p.shot.y, p.shot.direction, this);
        }
        shot.totalElapsed = p.shot.totalElapsed;
        shot.x1 = p.shot.x1;
      }
    }
    if (undefined !== p.up) up=p.up;
    if (undefined !== p.left) left=p.left;
    if (undefined !== p.right) right=p.right;
  };

  this.isCollide = function(left, top, width, height) {
    return !(left > x+WIDTH
       || left+width < x
       || top > y+HEIGHT
       || top+height < y)
  }

  this.setColor= function(col) {
    this.color = col;
    stickman = new StickMan(col==1?70:170, 70, col!=1?70:170);
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

  this.shotDown = function(size) {
    //console.log(this.self+" shot down by shot of size "+size)
    disabled = 2*size;
    this._protected = disabled+2;
    if (this.self) {
      navigator.vibrate(20*size);
    }
  };

  this.draw= function(ctx,dt) {
    ctx.save()

    // ctx.translate(x,y)
    // ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // ctx.translate(WIDTH/2, HEIGHT);
    ctx.translate(x+WIDTH/2, y+HEIGHT);
    if (disabled > 0) {
      ctx.translate((Math.random()*6|0)-3,(Math.random()*6|0)-3);
    }
    if (this.self) {
      ctx.fillStyle = '#ff0';
    }
    else {
      ctx.fillStyle = stickman.col3;
    }
    ctx.fillText(this.name, 0,-HEIGHT-5);



    if (reversed) {
      // draw shadowwy before update
      for (var i=1; i<3; i++) {
        ctx.save()
        ctx.globalAlpha=.7-i*.2;
        ctx.translate(-vx*i/2,-vy*i/2);
        ctx.scale(0.15, 0.15);
        if (direction) {
          ctx.scale(-1,1);
        }
        curAnim.render(ctx, stickman, totalElapsed, reversed);
        ctx.restore();
      }
    }

    ctx.scale(0.15, 0.15);
    if (direction) {
      ctx.scale(-1,1);
    }
    curAnim.render(ctx, stickman, totalElapsed, reversed);

    ctx.restore()

    if (shot) {
      shot.draw(ctx)
    }

  }

  this.reverseMovement = function(world,elapsed) {
    // update reverse movement
    var maze = world.maze,
      cellX = (x+WIDTH/2) / world.cellSize|0,
      cellY = (y+HEIGHT/2) / world.cellSize|0,
      ofs = maze.xyToOfs(cellX,cellY);
    if (!reversed) {
      reverseDirections = [];
      reversed = 1;
      if (this.self) {
        document.getElementById(65).style.transform = 'scale(-1,1)';
      }
    }

    // find offset of cell to move to:
    totalElapsed -= elapsed;

    if (ofs == reverseStack[reverseStack.length-1]) {
      //console.log("Reached ofs at top reverseStack of len ", reverseStack.length);
      reverseStack.pop();
      reverseDirections = [];
      if (reverseStack.length == 0) {
        vx=vy=0;
        //console.log("Reached end of reverse stack, stop reversing");
        reverseStack.push(ofs);
        //this.update(world, elapsed); // stop reversing
        return;
      }
    }

    // at this point we know the offset at the top of the reverse stack (previous intersection) isn't our location
    // so we have to move back to that intersection, check if we have directions ready

    if (!reverseDirections.length) {
      //console.log("No reverse directions, generating");
      // generate reverse directions to next intersection
      // from next intersection, to current location
      maze.BFS([reverseStack[reverseStack.length-1]], ofs);
      var ofs0 = ofs;
      while (ofs != reverseStack[reverseStack.length-1]) {
        var score = maze[ofs] - 1;
        if (maze[ofs+1] == score) {
          ofs = ofs+1;
          reverseDirections.push([1,0, ofs]);
        } else if (maze[ofs-1] == score) {
          ofs = ofs-1;
          reverseDirections.push([-1,0, ofs]);
        }
        else if (maze[ofs-maze.MAZE_X] == score) {
          ofs = ofs-maze.MAZE_X;
          reverseDirections.push([0,-1, ofs]);
        }
        else if (maze[ofs+maze.MAZE_X] == score) {
          ofs = ofs+maze.MAZE_X;
          reverseDirections.push([0,1, ofs]);
        }
        // else {
        //   // TODO remove
        //   console.log("can't find direction matching expected score!!! ",score);
        //   debugger;
        //   break;
        // }
        //console.log("Reverse directions ", reverseDirections);
      }
      ofs = ofs0;
    }

    // at this point we have directions that will lead us to the previous intersection
    var dirToMove = reverseDirections[0];
    if (dirToMove[2] == ofs) {
      // we are at the offset that the direction wants us to go
      // place player at the cell center, and go to the next step in the directions
      reverseDirections.shift();
      // if (reverseDirections.length == 0) {
      //   console.log("Reached end of directions but not reached the next intersection?!");
      //   debugger;
      // }
      dirToMove = reverseDirections[0];
    }

    // follow the step we got from the reverse direction
    direction = dirToMove[0] > 0; // look left or right - opposite of normal move - move right and look to the left
    vx = dirToMove[0]*1.2*maxSpeedX;
    vy = dirToMove[1]*1.2*maxSpeedX; // on purpose using maxSpeedX - speedY is too fast, but must remain fast enough to jump and climb
    if (dirToMove[0]) {
      setAnim(run);
      y = world.cellSize*(ofs/maze.MAZE_X|0);
    }
    if (dirToMove[1]) {
      setAnim(stickman.animations.fall);
      x = world.cellSize*(ofs%maze.MAZE_X + 0.5);
    }

    x += vx;
    y += vy;
  }

  this.normalMove = function(world,elapsed) {
    totalElapsed += elapsed;
    var step = world.cellSize/60;
    if (reversed) {
      if (this.self) {
        document.getElementById(65).style.transform = 'scale(1,1)';
      }
      reversed = 0;
    }

    // update speed
    /*if (KEYS[40]) {
      vy += step;
      vy = Math.min(vy, world.cellSize);
    }
    else*/ if (this.up) {
      if (onGround) {
        vy -= jumpFromGround;
      }
      else {
        vy -= jumpFromAir;
      }
      vy = Math.max(vy, -maxSpeedY);

    }
    vy += gravity;
    vy = Math.min(vy, maxSpeedY);

    var groundAnim = run;
    if (this.right) {
      vx += step;
      vx = Math.min(vx, maxSpeedX);
      direction = 0;
    }
    else if (this.left) {
      vx -= step;
      vx = Math.max(vx, -maxSpeedX);
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
      //if (this.self) {
        if (notMoving && this.btnA) {
          notMoving = 0.1; // don't allow zoom out while firing
          groundAnim = stickman.animations.fire;
          if (!lastFired) {
            lastFired = 1;
            //console.log("BOOM");
            if (!shot) {
              shot = new Shot(x,y, direction, this);
              // immediatly sync to server, don't wait for 33ms tick, to lessen delay to other players
              if (this.emitShotInfo) {
                this.emitShotInfo();
              }
            }
          }
          // else {
          //   lastFired += elapsed;
          //   console.log("already fired");
          //   if (lastFired > 2 && !shot) {
          //     shot = new Shot(x,y,direction, 4);
          //     lastFired = 0;
          //   }
          // }
        }
        else {
          shot = lastFired = 0;
        }
    //  }

      // walk, run, brakes, stand,  these should be set only if on ground and not sliding on wall
      setAnim(groundAnim);
    }
    else {
      shot = lastFired = 0;
    }

    // COLLISION DETECTION

    // find maze cell for collision check
    // initially checking Y collision, use smaller X
    var cellXLeft = Math.floor((x+vx+2) / world.cellSize), // using floor to handle negative
      cellXRight = (WIDTH-3+x+vx) / world.cellSize|0,
      cellYTop = Math.floor((y+vy) / world.cellSize),
      cellYBottom = (HEIGHT+y+vy) / world.cellSize|0;


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
    var cellXLeft = Math.floor((x+vx) / world.cellSize), // using floor to handle negative
      cellXRight = (WIDTH+x+vx) / world.cellSize|0,
      cellYTop = Math.floor((y+vy+2) / world.cellSize),
      cellYBottom = (HEIGHT-1+y+vy-2) / world.cellSize|0;

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
      vy *= wallFriction;
      onGround = Math.random() < chanceJumpWall;  // small chance to be "onGround" and be able to jump
      onWall = 1;
    }

    // TODO: on wall animation

    if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
      notMoving = 0;
    }
    else {
      notMoving += elapsed;
    }

    if (this.self) {
        if (notMoving > 3) {
          camera.scale = Math.max(camera.scale - 0.004, 0.5);
        }

      if (!notMoving || this.btnA) {
        camera.scale = Math.min(camera.scale + 0.1, 1.7);
        //console.log("scale "+camera.scale);
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

    // keep track of intersections for undo later
    if (world.intersections && this.self) {
      var cellX = x / world.cellSize|0,
        cellY = y / world.cellSize|0,
        ofs = world.maze.xyToOfs(cellX,cellY);
      if (world.intersections[ofs] && reverseStack[reverseStack.length-1] != ofs) {
        // console.log("Pushing "+cellX+","+cellY+"  ofs:"+ofs+" to reverse stack");
        reverseStack.push(ofs);
        // not likely the stack will increase to this size but I hate having arrays growing to infinity
        if (reverseStack.length > 500) {
          reverseStack.shift();
        }
      }
    }
  }

  this.update= function(world, elapsed) {
    if (this._protected > 0) {
      this._protected -= elapsed;
    }
    if (disabled > 0) {
      disabled -= elapsed;
      return;
    }
    if (this.btnB && reverseStack.length) {
      this.reverseMovement(world,elapsed);
    }
    else {
      this.normalMove(world,elapsed);
    }
    if (shot) {
      var remove = shot.update(world, elapsed);
      if (remove) {
        shot = 0;
      }
    }
  }

  return this;
}
