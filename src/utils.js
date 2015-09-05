

var RNG = {
	setSeed: function(seed) {
	    seed = (seed < 1 ? 1/seed : seed);

	    this._seed = seed;
	    this._s0 = (seed >>> 0) * this._frac;

	    seed = (seed*69069 + 1) >>> 0;
	    this._s1 = seed * this._frac;

	    seed = (seed*69069 + 1) >>> 0;
	    this._s2 = seed * this._frac;

	    this._c = 1;
	    return this;
	},

    _s0: 0,
    _s1: 0,
    _s2: 0,
    _c: 0,
    _frac: 2.3283064365386963e-10 /* 2^-32 */
},

/**
 * @returns {float} Pseudorandom value [0,1), uniformly distributed
 */
rnd= function() {
    var t = 2091639 * RNG._s0 + RNG._c * RNG._frac;
    RNG._s0 = RNG._s1;
    RNG._s1 = RNG._s2;
    RNG._c = t | 0;
    RNG._s2 = t - RNG._c;
    return RNG._s2;
}


RNG.setSeed(5)

module.exports = {
	range: function(maxInt,iterFu) {
    for (var i=0; i<maxInt; i++)
        iterFu(i)
	},
// breaking-range - will return non-false value from iterator and break the loop
	brrange: function(maxInt,iterFu) {
    for (var i=0; i<maxInt; i++) {
        var res = iterFu(i)
        if (res) return res;
    }
	},
// return non-false value from iterator will break the loop
	each: function(collection, iterFu) {
	// looping from end to start - to allow easy removal of iterated element without skipping
    for (var i=collection.length-1; i>=0; i--) {
        var $=collection[i];
        if (iterFu($,i)) {
        	return;
        }
    }
	},

	minmax: function(mn, mx, v) { return min(mx, max(mn, v))},

	duRange: function(w,h, fu) {
		for (var y=0; y<h; y++)
			for (var x=0; x<w; x++)
				fu(x,y);
	},
};
// createCanvas = function(w,h) {
// 	  var c = DC.createElement('canvas');
// 	  c.width = w || WIDTH;
// 	  c.height = h || HEIGHT;
// 	  return c;
// 	},
//
// avg = function(a,b) { return (a+b)/2 },
//
// // LAYERS
// canvases = [],
// contexts = [],
//
//
// Ctx = function(canvas) {
// 	return canvas.getContext('2d')
// },
//
// DC = document;
//
// DC.getElementById('overlay').style.width = WIDTH+"px";
// DC.getElementById('overlay').style.left = (-WIDTH>>1)+"px";
//
// var cont =  DC.getElementById('canvas_cont');
// range(6, function(i) {
//    var canvas = (i==5) ? createCanvas(innerWidth, innerHeight) : createCanvas();
//    if (i==5) {
// 	   canvas.style.left = '0px';
// 	   canvas.style.top = '0px';
// 	   canvas.style['margin-left'] = '0px';
// 	   canvas.style['margin-top'] = '0px';
//    }
//    else {
// 	   canvas.style.left = (-WIDTH>>1)+'px';
//    }
//    cont.appendChild(canvas);
//    canvases.push(canvas);
//    contexts.push(Ctx(canvas))
// });
//
//  // current canvas to draw to - may toggle around for double buffering
//
// var skyCtx = contexts[0],
// skySpritesCtx = contexts[1],
// mountainCtx = contexts[2],
// spritesCtx = contexts[3],
// waterCtx = contexts[4],
// overlayCtx = contexts[5],
// overlayCanv = canvases[5],
//
//
// abs = Math.abs,
// min = Math.min,
// max = Math.max,
// sin= Math.sin,
// round = Math.round,
// sqrt=Math.sqrt,
// sq=function(x){return x*x},
// U8 = 255, // max unsigned 8bit
// PI = Math.PI,
// TPI = 2*PI,
//
//
// // random in range [0,a)
// rnda = function(a) { return rnd()*a},
// // random integer in range [0,a-1]
// irnda = function(a) { return rnda(a)|0},
// // random in range [a,b)
// rndab = function(a,b) { return a+rnda(b-a)},
// // random integer in range [a,b-1]
// irndab = function(a,b) { return rndab(a,b)|0 },
//
//
// // polyfill RequestAnimFrame
// suffix = 'equestAnimationFrame',
// RQ= window['r'+suffix] || window['mozR'+suffix] || window['webkitR'+suffix];
// if (!RQ) {
//     var lastTime = 0;
//     RQ = function(callback) {
//         var currTime = Date.now();
//         var timeToCall = max(0, 16 - (currTime - lastTime));
//         var id = window.setTimeout(function() { callback(currTime + timeToCall); },
//             timeToCall);
//         lastTime = currTime + timeToCall;
//     }
// }
/*
if (false) {
	window.onerror = function(errorMsg, url, lineNumber) {
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			alert("Error occured: " + errorMsg+"  at line:"+lineNumber);
		}
		console.warn("Error: "+errorMsg+"\n URL: "+ url+"\n Line: "+lineNumber);
	    return false;
	}
	window.savePng = function(c) {
		document.location.href =  c.toDataURL('image/png').replace("image/png", "image/octet-stream")
	}
	window.globalDetect = function() {
		if (window.standard_globals) {
			var _keys = {}
			for (var i=0; i<standard_globals.length; i++) {
				_keys[standard_globals[i]] = 1;
			}
			for (var k in window) {
				if (!_keys[k]) {
					console.log("Leak: ",k);
				}
			}
		}
		else {
			var _keys = [];
			for (var k in window) {
				_keys.push('"'+k+'"');
			}
			console.log("standard_globals = ["+_keys.join(", ")+"]")
		}
	}
}*/

// // get img data from
// var getPixels= function(ctx) {
//   return ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
// },
//
//
// render2pixels=function(width, height, renderFunction) {
// 	var canvas = createCanvas(width, height),
// 		ctx=Ctx(canvas),
// 		imgData=getPixels(ctx),
// 	    d = imgData.data;
// 	renderFunction(d,ctx,canvas);
//     ctx.putImageData(imgData,0,0);
// 	return canvas;
// },
//
// drawImg = function(ctx, img, x,y) {
// 	ctx.drawImage(img, x,y, img.width, img.height);
// },
//
//
//
// initQueue = [],
// initFu = function(text, pg, fu) {
// 	initQueue.push([text,pg,fu])
// }
