var camera = require('./camera');
var KEYS = require('./input');

(function() {

// private:
  var x=0, y=0,
    vx=0,vy=0;


// public
module.exports = {


  update: function(cellWidth) {
    var step = cellWidth/60;

    if (KEYS[40]) {
      vy += step;
    }
    else if (KEYS[38]) {
      vy -= step;
    }
    else {
      vy *= .2;
    }
    if (KEYS[39]) {
      vx += step;
    }
    else if (KEYS[37]) {
      vx -= step;
    }
    else {
      vx *= .2;
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
  }
}
})();
