(function() {

// private variables:
  var targetX=0,    // where the camera should move to
    targetY=0,

    curX =0,  // where the camera currently is - float
    curY = 0;


// globals:
  module.exports =  {
    X: 0, // where the camera currently is - integer pixels  (suitable for canvas translate)
    Y: 0,
    scale: 2,
    update: function() {
      // move the camera slightly towards the target, called from the raf function
      curX = curX*.9 + targetX*.1;
      curY = curY*.9 + targetY*.1;
      this.X = Math.round(curX);
      this.Y = Math.round(curY);
    },

    setTarget: function(x,y) {
      targetX = x;
      targetY = y;
    }
  }
})();
