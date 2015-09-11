var client = require('./Client');

var colors = ["#fff", "#99f", "#f99"],
  shadows = ["#eee", "#77f", "#f77"],
  initSize;

module.exports = function Bulb(xy,cellSize) {
    this.color = 0; // white,  1=Blue  2=Red
    //this.delayToChange = 100; // 100ms to take over bulb

    var size = cellSize/3, x=xy.x, y=xy.y, ofs=xy.ofs;
    initSize = size;

    this.update= function(world, elapsed) {
      var player = world.player;
      if (player.isCollide(x, y, size, size)) {
        if (this.color != player.color) {
          this.color = player.color;
          client.updateBulb({ofs:ofs, color:this.color});
        }
      }
      else {
        size = initSize;
      }
    },

    this.draw= function(ctx, cellSize) {
      ctx.save();
      ctx.shadowBlur=size;
      ctx.shadowColor=shadows[this.color];
      ctx.fillStyle = colors[this.color];
      var margin = (cellSize-size)/2;
      ctx.fillRect(x+margin, y+margin, size, size);
      ctx.restore();
    }
}
