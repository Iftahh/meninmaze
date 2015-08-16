var TOP_BRICK_COLOR = "#e86", // top brick color 1
    TOP_BRICK_COLOR_2 = "#eda",
    FRONT_BRICK_COLOR="#d74", // front brick color
    FRONT_BRICK_COLOR_2="#dc8",
    RIGHT_BRICK_COLOR="#b52", // right brick color
    RIGHT_BRICK_COLOR_2="#ba6"


    // render a brick texture at (0,0,width,height)
    var brick=function (ctx, width, height, c1, c2, brickWidth, brickHeight) {
        ctx.fillStyle = c1
        ctx.fillRect(0,0,width,height)
        ctx.strokeStyle = c2;
        ctx.lineWidth = brickHeight/5;
        var row=0,
            y0=0,
            y1=brickHeight;
        ctx.beginPath();
        while(y1<=height) {
            row++;
            ctx.moveTo(0, y1)
            ctx.lineTo(width,y1)
            x0 = row & 1 ? brickWidth: brickWidth/2;
            while(x0<width) {
                ctx.moveTo(x0,y0)
                ctx.lineTo(x0,y1)
                x0 += brickWidth
            }
            y0 = y1;
            y1 += brickHeight;
        }
        ctx.stroke()
    }


var brickDraw=function($) {
    brick($.dim1, $.dim2, $.col1, $.col2, $.brickWidth, $.brickHeight);
    drawBorders($)
}

/*var textureDraw=function($) {
    $.texture.draw(0,0, $.dim1, $.dim2)
    drawBorders($)
}*/





// using globals - for values that are usually the same
// D = depth (ie. width of y-axis)
// Y = location of y-axis
// B - borders
// BC - border color
// BW, BH - brick width, brick height
// DR - draw function or array of 3 draw functions
var generateCube=function(x,z,width,height) {
    BH = BH || BW *.3;
    var cube = {
        x:x, // world x
        y:Y,
        z:z,

        width:width,
        height:height,
        d:D,
        sw: width+D/2,      // screen width
        sh: height+D/2,       // screen height
        uncachedDraw: drawCube,
        draw: drawSprite
    }
    toScreenSpace(cube)

    if (width>0 && height>0) {
        cube.front = {
            col1: FRONT_BRICK_COLOR,
            col2: FRONT_BRICK_COLOR_2,

            texture: PatternFront,
            dim1: width,
            dim2: height,
            brickWidth:BW, // brick width
            brickHeight:BH,
            bc:BC, // border color
            borders: B,
            //preDraw: frontDraw,
            draw: DR[0] || DR   // DR can be array of 3 functions, or a function
        }
    }

    if (D>0 && height>0) {
        cube.right = {
            col1: RIGHT_BRICK_COLOR,
            col2: RIGHT_BRICK_COLOR_2,
            texture: PatternRight,
            dim1: D,
            dim2: height,
            brickWidth:BW, // brick width
            brickHeight:BH,
            bc:BC, // border color
            borders: B >> 4,
            //preDraw: rightDraw,
            draw: DR[1] || DR
        }
    }

    if (width>0 && D>0) {
        cube.top = {
            col1: TOP_BRICK_COLOR,
            col2: TOP_BRICK_COLOR_2,
            texture: PatternTop,
            dim1: width,
            dim2: D,
            brickWidth:BW, // brick width
            brickHeight:BH,
            bc:BC, // border color
            borders: B>> 8,
            //preDraw: topDraw,
            draw: DR[2] || DR
        }
    }
    return cube;
}



// draw the cube at location (sx,sy)
var drawCube = function(cube, sx,sy) {
    sx = sx||0; sy=sy||0;
    var d_2 = cube.d/2;
    if (cube.front) {
        C.setTransform(1, 0,0,1, sx, sy+ d_2);
        cube.front.draw(cube.front);
    }
    if (cube.top) {
        C.setTransform(1, 0,-.5,.5, sx+0.4 +d_2, sy);
        cube.top.draw(cube.top);

        // special hack... draw flowers
//        if (cube.top.draw == textureDraw) {
//            // draw some random flowers
//            C.font = '14pt sans-serif';
//            //C.setTransform(1, 0,0,1, 0, 0);
//            C.beginPath()
//            C.fillStyle = "#df6060"
//            C.strokeStyle = "#aa5050"
//            C.shadowBlur= 10;
//            C.shadowColor ="#ad6060"
//            range(irnd(0,cube.width/30), function(i) {
//
//                var text = "❀❃❁"[irnd(0,3)];
//                C.fillText(text, irnd(5, cube.width-5), irnd(5, cube.d-5));
//            })
//            C.fill();
//            C.stroke();
//        }
    }
    if (cube.right) {
        C.setTransform(.5, -.5,0,1, sx+cube.width, sy+d_2);
        cube.right.draw(cube.right);
    }

    // draw left facing cubes:
//    else {  p = -.5
//        // left
//        trns(p, p,0,1,x,y)
//        C.drawImage(dirt2, 0,0, d,height);
//
//        // top - for left facing cube
//        trns(1, 0,-p, -p,x-0.5 +p*d,y+p*d)
//        C.drawImage(grass, 0,0,width,d);
//    }
}


//  Borders
//       __________
//      /    B    /|
//     /C       A/ |      0xFFF <-- Front           all:  0xFFF
//    /    9    /7 |        ^^                      no top, no bottom:    0x0AA
//   +---------+   |6       | \
//   |    2    |8  |       /   \
//   3         1  /       Top   Right
//   |         | /5
//   +--- 0 ---+/

var drawBorders=function($) {
    var b = $.borders, width=$.dim1, height=$.dim2;
    if (b & 15) {
        C.strokeStyle = $.bc;
        C.beginPath();
        if (b&1) {
            C.moveTo(0,0)
            C.lineTo(width,0)
        }
        if (b&2) {
            C.moveTo(width,0)
            C.lineTo(width,height)
        }
        if (b&4){
            C.moveTo(width,height)
            C.lineTo(0,height)
        }
        if (b&8){
            C.moveTo(0,height)
            C.lineTo(0,0)
        }
        C.stroke()
    }
}

// TODO: automatic border cancelation:
//    ________
//    |       |_
//    |        _|   <-- left border of small cube is canceled because contained in right border of big cube
//    |_______|
