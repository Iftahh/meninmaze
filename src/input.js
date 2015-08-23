utils = require('./utils')


var KEYS={}
var updateFromKeys = function(e, realEv) {
  var code= e.keyCode;
    KEYS[code]=  e.type == 'keydown';
    //console.log('code is ',code);
    // Player.left = KEYS[37];
    // Player.right = KEYS[39];
    // Player.up = KEYS[38];
    // Player.down = KEYS[40];
    // Player.jump = KEYS[32];
    var element = document.getElementById(code);
    if (element) {
      if (KEYS[code]) {
        element.classList.add('clicked');
      }
      else {
        element.classList.remove('clicked');
      }
      if (realEv && realEv.preventDefault) {
        realEv.preventDefault();
      }
      else {
        e.preventDefault();
      }
    }
}

document.addEventListener('keydown', updateFromKeys);
document.addEventListener('keyup', updateFromKeys);

// UGLY - using hard coded values from CSS
var p0 = 10 + 55+65+55,
  p1 = 10+55+65,
  p2 = 10+55;


utils.each(['mousedown','mouseup', 'touchstart','touchmove','touchend'], function(evName) {
  //document.getElementById("left")
  left.addEventListener(evName, function(event) {
      event.preventDefault();
      var type = event.type, x=event.clientX, y=event.clientY;
      if (type=='touchend') {
        updateFromKeys({type:0, keyCode: 40 }, event);
        updateFromKeys({type:0, keyCode: 39 }, event);
        updateFromKeys({type:0, keyCode: 38 }, event);
        updateFromKeys({type:0, keyCode: 37 }, event);
        return;
      }

      if (event.touches) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
      }
      var e = {type: (type == 'mouseup')? 0: 'keydown' };
      if (x < p2) {
        e.keyCode = 37;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 39 }, event);
      }
      else if (x<p0 && p1 <x) {
        e.keyCode = 39;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 37 }, event);
      }
      else {

      }
      var y = innerHeight - y;
      if (y < p2) {
        e.keyCode = 40;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 38 }, event);
      }
      else if (y < p0 && p1<y) {
        e.keyCode = 38;
        updateFromKeys(e, event);
        updateFromKeys({type:0, keyCode: 40 }, event);
      }

  }, false);
});

utils.each(document.querySelectorAll(".button"), function(el) {
  utils.each(['mousedown','mouseup', 'touchstart','touchmove','touchend'], function(evName) {
    el.addEventListener(evName, function(event) {
      var type = event.type;
      console.log("event "+ type+ " "+event.target.id);
      var e = {type: (type == 'mouseup' || type=='touchend')? 0: 'keydown', keyCode: event.target.id };
      // fake a keydown/up event
      updateFromKeys(e, event);
    });
  });
});

module.exports = KEYS;
