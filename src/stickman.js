
/*******************************************************************************
.*........HeadEnd.
.*..........|.
.*.......HeadStart.
.*..........|.
.*......E---A---Elbow---Hand.
.*......|...|.
.*......H...|.
.*..........B.
.*........./.\.
.*........K.Knee.
.*........|...|.
.*........F..FootStart-FootEnd
 *
 *
 * Stickfigure data:  array of x,y pairs in this order:
 *
 * [A,															index:  0,1
 * Head,Head-End, 												  2,3,   4,5
 * Elbow1,Hand1,													  6,7,   8,9
 * Elbow2,Hand2,													  10,11, 12,13
 * B,																				14,15
 * Knee1,FootStart,FootEnd,								  16,17, 18,19, 20,21
 * Knee2,Foot2Start, Foot2End]						  22,23, 24,25, 26,27
 ******************************************************************************/

function StickMan() {
	this.animations = {};
}

StickMan.prototype.add = function(key, duration, width, frames) {
	this.animations[key] = new StickAnimation(duration, width, frames);
};


function StickAnimation(duration, width, frames) {
  this.duration = duration;
	this.width = width;
	this.frames = frames.slice();
	for (var i=0; i<frames.length; i++) {
		var frame = frames[i];
		var newFrame = frame.slice();
		for (var k=6; k<10; k++) {
			newFrame[k] = frame[k+4]; // switch hands
			newFrame[k+4] = frame[k];
			newFrame[k+10] = frame[k+16];
			newFrame[k+16] = frame[k+10];
		}
		newFrame[20] = frame[26];
		newFrame[21] = frame[27];
		newFrame[26] = frame[20];
		newFrame[27] = frame[21];
		this.frames.push(newFrame)
	}
}


function linearMix(frame1, frame2, fraction) {
	var result = [];
	var frac1 = 1-fraction;
	for (var i=0; i<frame1.length; i++) {
		result.push(frame1[i]*frac1 +  frame2[i]*fraction);
	}
	return result;
}

StickAnimation.prototype.getOffset = function(elapsed) {
	return this.width*elapsed/this.duration;
}

StickAnimation.prototype.render = function(ctx, elapsed) {
	var anim = this;
	var duration = anim.duration;
	var width = anim.width;
	ctx.save();
	//ctx.translate(-anim[0], -anim[1]);

	var frames = anim.frames;
	var durationPerFrame = duration/frames.length;
	var widthPerFrame = width/frames.length;

	var frame1 = ((elapsed / durationPerFrame)|0)% frames.length;
	var frame2 = (frame1+1) % frames.length;

	var partialElapsed = elapsed % durationPerFrame;

	var frame = linearMix(frames[frame1], frames[frame2],
			partialElapsed/durationPerFrame);


	var moveTo = function(i) {
		ctx.moveTo(frame[2*i], frame[2*i+1]);
	}
	var lineTo = function(i) {
		ctx.lineTo(frame[2*i], frame[2*i+1]);
	}

	ctx.lineWidth = 2;
	ctx.lineCap = "round";

	ctx.strokeStyle = "#222299";
  ctx.beginPath();
	moveTo(0);  // A
	lineTo(5);  // Elbow 2
	lineTo(6);  // hand 2

	moveTo(7); // B
	lineTo(11); // Knee2
	lineTo(12); // Foot2 start
	lineTo(13); // Foot2 end
	ctx.stroke();

	ctx.strokeStyle = "#4444bb";
	ctx.beginPath();
	moveTo(0); // A
	lineTo(1); // HeadStart
	var centerHead = [(frame[2]+frame[4])/2, (frame[3]+frame[5])/2];
	var frame0 = frames[0];
	var radiusHead = Math.hypot(frame0[2]-frame0[4], frame0[3]-frame0[5])/2;
	ctx.arc(centerHead[0], centerHead[1], radiusHead, 0.5*Math.PI,  2.5* Math.PI, false);
//	ctx.lineTo(frame[4], frame[5]);
  moveTo(0);
  lineTo(7); // B
	ctx.stroke();

	ctx.strokeStyle = "#6666dd";
  ctx.beginPath();
	moveTo(0);  // A
	lineTo(3);  // Elbow
	lineTo(4);  // Hand

	moveTo(7); // B
	lineTo(8); // Knee1
	lineTo(9); // Foot1 start
	lineTo(10); // Foot1 end

	ctx.stroke();
	ctx.restore();


};



var sm = new StickMan();

sm.add('walk', 2.4, 180, // 2.4 seconds 180px horizontal animation
[ // 7 frames generated from walk.svg
[  // frame 0
          4, -102  // A
    ,     3, -114  // HeadStart
    ,     5, -128  // HeadEnd
    ,    -9, -83   // Elbow1
    ,     9, -65   // Hand1
    ,    -7, -82   // Elbow2
    ,    12, -70   // Hand2
    ,    -3, -68   // B
    ,     1, -35   // Knee1
    ,    -4, -2    // Foot1Start
    ,    10, -2    // Foot1End
    ,     8, -37   // Knee2
    ,   -18, -18   // Foot2Start
    ,    -9, -7    // Foot2End
], [  // frame 1
          4, -102  // A
    ,     2, -111  // HeadStart
    ,     3, -125  // HeadEnd
    ,    -3, -80   // Elbow1
    ,    20, -68   // Hand1
    ,   -10, -82   // Elbow2
    ,     0, -61   // Hand2
    ,    -3, -64   // B
    ,    -8, -35   // Knee1
    ,   -17, -6    // Foot1Start
    ,    -3, 0     // Foot1End
    ,     9, -38   // Knee2
    ,   -10, -13   // Foot2Start
    ,     4, -5    // Foot2End
], [  // frame 2
          5, -100  // A
    ,     6, -109  // HeadStart
    ,     4, -123  // HeadEnd
    ,    11, -78   // Elbow1
    ,    31, -69   // Hand1
    ,   -14, -84   // Elbow2
    ,   -13, -62   // Hand2
    ,    -4, -64   // B
    ,    -9, -35   // Knee1
    ,   -27, -10   // Foot1Start
    ,   -15, 0     // Foot1End
    ,     9, -36   // Knee2
    ,     6, -6    // Foot2Start
    ,    21, -8    // Foot2End
], [  // frame 3
          3, -98   // A
    ,     3, -108  // HeadStart
    ,     2, -122  // HeadEnd
    ,    13, -78   // Elbow1
    ,    37, -77   // Hand1
    ,   -17, -86   // Elbow2
    ,   -21, -65   // Hand2
    ,    -3, -62   // B
    ,    -7, -33   // Knee1
    ,   -32, -13   // Foot1Start
    ,   -23, 0     // Foot1End
    ,    12, -38   // Knee2
    ,    21, -7    // Foot2Start
    ,    37, -15   // Foot2End
], [  // frame 4
          4, -98   // A
    ,     4, -107  // HeadStart
    ,     3, -122  // HeadEnd
    ,    22, -80   // Elbow1
    ,    46, -88   // Hand1
    ,   -20, -93   // Elbow2
    ,   -33, -71   // Hand2
    ,    -3, -61   // B
    ,   -13, -36   // Knee1
    ,   -37, -15   // Foot1Start
    ,   -30, -1    // Foot1End
    ,    14, -36   // Knee2
    ,    31, -6    // Foot2Start
    ,    44, -16   // Foot2End
], [  // frame 5
          3, -99   // A
    ,     3, -109  // HeadStart
    ,     3, -123  // HeadEnd
    ,    15, -78   // Elbow1
    ,    39, -77   // Hand1
    ,   -17, -86   // Elbow2
    ,   -20, -64   // Hand2
    ,    -3, -63   // B
    ,   -16, -37   // Knee1
    ,   -42, -25   // Foot1Start
    ,   -45, -7    // Foot1End
    ,    14, -37   // Knee2
    ,    23, -3    // Foot2Start
    ,    35, -14   // Foot2End
], [  // frame 6
          3, -99   // A
    ,     2, -110  // HeadStart
    ,     5, -122  // HeadEnd
    ,    12, -77   // Elbow1
    ,    34, -71   // Hand1
    ,   -14, -85   // Elbow2
    ,   -13, -62   // Hand2
    ,    -2, -62   // B
    ,    -9, -35   // Knee1
    ,   -34, -16   // Foot1Start
    ,   -25, -6    // Foot1End
    ,    10, -36   // Knee2
    ,    14, -2    // Foot2Start
    ,    28, -8    // Foot2End
]]
)

module.exports = sm;
