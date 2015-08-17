utils = require('./utils')


var KEYS={}
var updateFromKeys = function(e) {
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
    }
    if (codeToButtons[code])  //  remove this line to save space, but it breaks ctrl+R refresh, alt-left back, etc...
        e.preventDefault();
}

document.addEventListener('keydown', updateFromKeys)
document.addEventListener('keyup', updateFromKeys)

document.body.addEventListener('touchmove', function(event) {
    event.preventDefault();
}, false);

utils.each(document.querySelectorAll("#left span"), function(el) {
  utils.each(['mousedown','mouseup', 'touchstart','touchmove','touchend'], function(evName) {
    el.addEventListener(evName, function(event) {
      var type = event.type;
      console.log("event "+ type+ " "+event.target.id);
      var e = {type: (type == 'mouseup' || type=='touchend')? 0: 'keydown', keyCode: event.target.id };
      // fake a keydown/up event
      updateFromKeys(e);
    });
  });
});

module.exports = KEYS;
