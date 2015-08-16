/*
 Particle Emitter
	Based on Parcycle: by Mr Speaker - www.mrspeaker.net
	which is based on the code from 71squared.com iPhone tutorials

  Modified:
    forcePoints to push and pull particles
    wind function
    render particle method
*/



/* Vector Helper */
var vector_create=function( x, y ){
    return {x:x || 0,y: y || 0,
    	scale: function(s) { this.x *= s; this.y *= s},
    	add: function(v) {this.x += v.x; this.y += v.y},
    	sub: function(v) {this.x -= v.x; this.y -= v.y}
//    	,len2: function() {return sq(this.x)+sq(this.y)}
    }
},

vector_multiply= function( vector, scaleFactor ){
    return vector_create(vector.x * scaleFactor,
            vector.y * scaleFactor);
},
vector_add = function( vector1, vector2 ){
    return vector_create(vector1.x + vector2.x,
            vector1.y + vector2.y);
},
vector_sub = function (vector1, vector2) {
    return vector_create(vector1.x - vector2.x,
            vector1.y - vector2.y);
},
//vector_len2= function(vector) {
//    return sq(vector.x) + sq(vector.y);
//}
rgba = function(arr, alphaOverride) {
	return "rgba("+[  minmax(0,U8, arr[ 0 ]|0),
                      minmax(0,U8, arr[ 1 ]|0),
                      minmax(0,U8, arr[ 2 ]|0),
                      minmax(0,1, alphaOverride!=undefined? alphaOverride : arr[ 3 ].toFixed(2))].join(',') + ")";
},

// Individual particle
Particle = function() {
	return {
		// really everything is overwritten - no need setting defaults
	    position: vector_create()
//	    direction: [0,0],
//	    size: 0,
//	    sizeSmall: 0,
//	    timeToLive: 0,
//	    color: [],
//	    drawColor: "",
//	    deltaColor: []
//	    deltaSize: 0,
//	    sharpness: 0,
	}
},


ParticlePointEmitter = function(maxParticles, options) {
	var res = {
			// options will override these defaults, no need to set them
//	    particles: null,
//	    maxParticles: null,

	// Default Properties

//	    size: 30,          // initial size of particle
//	    sizeRandom: 12,

//	    speed: 6,         // initial speed of particle
//	    speedRandom: 2,

//	    angle: 0,        // initial direction of particle (degrees)
//	    angleRandom: 180,

//	    lifeSpan: 8,     // lifetime of particle + used as indication of frequently to emit particles
//	    lifeSpanRandom: 6,

//	    startColor: [ 220, 208, 88, 1 ],          // color at begining of lifetime
//	    startColorRandom: [ 52, 55, 58, 0 ],
//	    finishColor: [ 255, 45, 10, 0 ],		  // color at end of lifetime
//	    finishColorRandom: [ 40, 40, 40, 0 ],
		colorEdge: 0,						  // color at edge of particle "ball" - must be zero alpha,  false for same as color
//	    sharpness: 35,							  // how sharp (percent) will the particle "ball" be (0 - very fuzzy)
//	    sharpnessRandom: 12,

//	    forcePoints: 0, // pairs of weight and location.  positive weight attracts, negative weight pushes
	    wind: 0, // function returning value of wind - can change over time
	    area: 0.3, // used to calculate wind affect

	    updateParticle: function() {},
	    renderParticle: function(context, p) {
            var size = p.size,
				halfSize = size >> 1,
				x = p.position.x|0,
				y = p.position.y|0,
				radgrad = context.createRadialGradient( x, y, p.sizeSmall, x, y, halfSize);
			radgrad.addColorStop( 0, p.drawColor );
			radgrad.addColorStop( 1, p.drawColorEdge );
			context.fillStyle = radgrad;
		  	context.fillRect( x-halfSize, y-halfSize, size, size );
	    },


	    init: function(maxParticles, options) {
			this.setOptions({
		        maxParticles: maxParticles,
		        particles: [],
		        graveyard: [],
		        active: false,

		//        this.position = vector_create(300, 300);
		        positionRandom:  vector_create(0, 0),
		        gravity:  vector_create( 0.0, 0.3),

		        elapsedTime: 0, // used to count active time - only when duration > 0
		        duration: -1,   // autostop the emitter after this duration (-1 = infinity)
		        emissionRate:0,
		        emitCounter: 0,

		        lifeSpanRandom: 0,
		        angleRandom: 0,
		        sizeRandom: 0,
		        speedRandom: 0,
		        sharpnessRandom: 0,

				emitCounter: 0
			})
	        this.setOptions(options || {})
		},

	    setOptions: function(options) {
	        for (var k in options) {
	            this[k] = options[k];
	        }
	        if (!this.finishSize) {
	        	this.finishSize = this.size;
	        }
	        if (!this.emissionRate) {
	        	this.emissionRate = this.maxParticles / this.lifeSpan;
	        }
	        if (this.colorEdge) {
	        	this.colorEdge = rgba(this.colorEdge)
	        }
	    },


		addParticle: function(x,y){
			if(this.particles.length >= this.maxParticles) {
				return null;
			}

			// Take the next particle out of the particle pool we have created and initialize it

			var particle = this.graveyard.shift() || Particle();
			this.initParticle( particle,x || this.position.x, y || this.position.y);
	        this.particles.push(particle);
			return particle;
		},

		initParticle: function( particle, x, y ){

			particle.position.x = x + this.positionRandom.x * rndab(-1,1);
			particle.position.y = y + this.positionRandom.y * rndab(-1,1);

			var newAngle = (this.angle + this.angleRandom * rndab(-1,1) ) * ( PI / 180 ); // convert to radians
			var vector = vector_create(Math.cos( newAngle ), sin( newAngle ));
			var vectorSpeed = this.speed + this.speedRandom * rndab(-1,1);
			particle.direction = vector_multiply( vector, vectorSpeed );

			particle.size = this.size + this.sizeRandom * rndab(-1,1);
			particle.size = particle.size <= 1 ? 1 : particle.size|0;
			particle.finishSize = this.finishSize + this.sizeRandom * rndab(-1,1);

			particle.area = this.area;
			particle.timeToLive = this.lifeSpan + this.lifeSpanRandom * rndab(-1,1);

			particle.sharpness = this.sharpness + this.sharpnessRandom * rndab(-1,1);
			particle.sharpness = particle.sharpness > 100 ? 100 : particle.sharpness < 0 ? 0 : particle.sharpness;
			// internal circle gradient size - affects the sharpness of the radial gradient
			particle.sizeSmall = ( particle.size / 200 ) * particle.sharpness|0; //(size/2/100)

			if (this.startColor) {
				var start = [
					this.startColor[ 0 ],
					this.startColor[ 1 ],
					this.startColor[ 2 ],
					this.startColor[ 3 ]
				];
				if (this.startColorRandom) {
					var that = this;
					range(4, function(j) {start[j] += that.startColorRandom[ j ] * rndab(-1,1) })
				}

				if (this.finishColor) {
					var end = [
						this.finishColor[ 0 ] + this.finishColorRandom[ 0 ] * rndab(-1,1),
						this.finishColor[ 1 ] + this.finishColorRandom[ 1 ] * rndab(-1,1),
						this.finishColor[ 2 ] + this.finishColorRandom[ 2 ] * rndab(-1,1),
						this.finishColor[ 3 ] + this.finishColorRandom[ 3 ] * rndab(-1,1)
					];
					particle.deltaColor = [
					                       ( end[ 0 ] - start[ 0 ] ) / particle.timeToLive,
					                       ( end[ 1 ] - start[ 1 ] ) / particle.timeToLive,
					                       ( end[ 2 ] - start[ 2 ] ) / particle.timeToLive,
					                       ( end[ 3 ] - start[ 3 ] ) / particle.timeToLive];
				}


			    particle.color = start;
			    if (DBG && isNaN(particle.color[ 2 ]) ) {
			    	console.log("Error");
			    }
			}
        	particle.deltaSize = (particle.finishSize - particle.size) / particle.timeToLive;
		},

		update: function( delta ){
	        delta = delta/31;
			if( this.active && this.emissionRate > 0 ){
				var rate = 1 / this.emissionRate;
				this.emitCounter += delta;
				while( this.particles.length < this.maxParticles && this.emitCounter > rate ){
					this.addParticle();
					this.emitCounter -= rate;
				}
				if( this.duration != -1) {
					this.elapsedTime += delta;
					if (this.duration < this.elapsedTime ){
						this.stopParticleEmitter();
					}
				}
			}

	        var that = this;
	        each(this.particles, function(currentParticle, particleIndex) {

				// If the current particle is alive then update it
				if( currentParticle.timeToLive > 0 ){

					// Calculate the new direction based on gravity
	                if (that.gravity)
					    currentParticle.direction = vector_add( currentParticle.direction, that.gravity );

	                // wind speed - only horizontal
	                if (that.wind) {
	                	currentParticle.direction.x += windForce(that.wind(currentParticle),
	                											 currentParticle.direction.x,
	                											 currentParticle.area);
	                }

//	                if (that.forcePoints) {
//		                for (var i=0; i<that.forcePoints.length; i++) {
//		                    var fp = that.forcePoints[i];
//		                    var weight = fp[0];
//		                    var location = fp[1];
//		                    var dir = vector_sub(currentParticle.position, location);
//		//                    var dist = vector_len(dir);
//		//                    if (dist == 0) {
//		//                        continue;
//		//                    }
//		                    // todo: force may depend on dist (ie. farther is weaker or other)
//		                    var force = vector_multiply(dir, weight/**1/dist*/);
//		                    currentParticle.direction = vector_add( currentParticle.direction, force);
//		                }
//	                }
					currentParticle.position.add( currentParticle.direction );
					currentParticle.timeToLive -= delta;

					// allow extenrnal update - set timeTolive to zero if particle should die
					that.updateParticle(currentParticle, particleIndex);
				}

				if( currentParticle.timeToLive > 0 ){

					currentParticle.size += currentParticle.deltaSize * delta;
					currentParticle.sizeSmall =  ( currentParticle.size / 200 ) * currentParticle.sharpness |0; //(size/2/100)

					// Update colors based on delta
					if (currentParticle.deltaColor) {
						currentParticle.color[ 0 ] += ( currentParticle.deltaColor[ 0 ] * delta );
						currentParticle.color[ 1 ] += ( currentParticle.deltaColor[ 1 ] * delta );
						currentParticle.color[ 2 ] += ( currentParticle.deltaColor[ 2 ] * delta );
						currentParticle.color[ 3 ] += ( currentParticle.deltaColor[ 3 ] * delta );
					}
//	                if (isNaN(a) ) {
//	                    console.log("Error");
//	                }
					if (currentParticle.color) {
						currentParticle.drawColorEdge = that.colorEdge || rgba(currentParticle.color,0);
						currentParticle.drawColor = rgba(currentParticle.color);
					}
				} else {
					that.particles.splice(particleIndex,1);
					that.graveyard.push(currentParticle);
				}
	        });
		},

		stopParticleEmitter: function(){
			this.active = false;
			this.elapsedTime = 0;
			this.emitCounter = 0;
		},

		renderParticles: function( context ){
			var that = this;
	        each(this.particles, function(particle, particleIndex) {
	        	that.renderParticle(context, particle);
	            //context.arc(x,y, halfSize, Math.PI*2, false);
			});
		}
	}
	res.init(maxParticles, options);
	return res;
}

module.exports = {
  ParticlePointEmitter: ParticlePointEmitter,

}
