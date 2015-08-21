
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

StickMan.prototype.add = function(key, duration,  frames, flip, repeat) {
	this.animations[key] = new StickAnimation(duration,  frames, flip, repeat);
};


function StickAnimation(duration, frames, flip, repeat) {
  this.duration = duration;
	this.repeat = repeat;
	//this.frames = frames;
	// duplicate frames with flip arms and legs
	if (flip) {
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
	else {
		this.frames = frames;
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

// StickAnimation.prototype.getOffset = function(elapsed) {
// 	return this.width*elapsed/this.duration;
// }

// var lastFrame = -1;
StickAnimation.prototype.render = function(ctx, elapsed) {
	var anim = this;
	var duration = anim.duration;
	ctx.save();

	var frames = anim.frames;
	var frame;
	if (this.repeat || elapsed < duration) {
		var durationPerFrame = duration/frames.length;

		var frame1 = ((elapsed / durationPerFrame)|0)% frames.length;
		var frame2 = (frame1+1) % frames.length;

	  // if (frame1 != lastFrame) {
		// 	console.log("frame1 = "+frame1);
		// 	lastFrame = frame1;
		// }
		var partialElapsed = elapsed % durationPerFrame;

		frame = linearMix(frames[frame1], frames[frame2],
				partialElapsed/durationPerFrame);
	}
	else {
		// not repeat and past duration - stuck on final frame
		frame = frames[frames.length-1];
	}


	var moveTo = function(i) {
		ctx.moveTo(frame[2*i], frame[2*i+1]);
	}
	var lineTo = function(i) {
		ctx.lineTo(frame[2*i], frame[2*i+1]);
	}

//	ctx.lineCap = "round";

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

sm.add('run',
				0.6, // seconds for walk cycle
				require('./tools/run'), true, true)

sm.add('stand', 3.2, require('./tools/stand'), true, true);
sm.add('jump', 1.2, require('./tools/jump'), false, false);
sm.add('fall', 2.4, require('./tools/fall'), false, false);

module.exports = sm;
