var codeToButtons = {
  40: document.getElementById('bb'),
  37: document.getElementById('lb'),
  39: document.getElementById('rb'),
  38: document.getElementById('tb')
} ;

var KEYS={}
var updateFromKeys = function(e) {
  var code= e.keyCode;
    KEYS[code]=  e.type == "keydown";
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
    if (e.keyCode == 32 || e.keyCode >=37 && e.keyCoe <= 40)
        e.preventDefault();
}

document.addEventListener('keydown', updateFromKeys)
document.addEventListener('keyup', updateFromKeys)

document.body.addEventListener('touchmove', function(event) {
    event.preventDefault();
}, false);
