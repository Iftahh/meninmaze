var codeToButtons = {
  40: document.getElementById('bb'),
  37: document.getElementById('lb'),
  39: document.getElementById('rb'),
  38: document.getElementById('tb'),
  83: document.getElementById('hitb'),
  65: document.getElementById('blockb'), // TODO: short ids to save space
} ;

var KEYS={}
var updateFromKeys = function(e) {
  var code= e.keyCode;
    KEYS[code]=  e.type == "keydown";
    console.log('code is ',code);
    // Player.left = KEYS[37];
    // Player.right = KEYS[39];
    // Player.up = KEYS[38];
    // Player.down = KEYS[40];
    // Player.jump = KEYS[32];
    if (codeToButtons[code]) {
      if (KEYS[code]) {
        codeToButtons[code].classList.add('clicked');
      }
      else {
        codeToButtons[code].classList.remove('clicked');
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

module.exports = KEYS;
