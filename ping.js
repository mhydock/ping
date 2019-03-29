// Got the equation for spirographs here, and used the applet to test the
// appearance of spirographs with given parameters:
// http://www.math.psu.edu/dlittle/java/parametricequations/spirograph/

//------------------------------------------------------------------------------
// Various constants
//------------------------------------------------------------------------------
var PADDLE_LOW_LIMIT = 0;
var PADDLE_HIGH_LIMIT = 8;

var PADDLE_BASE_DIST = 40;

var PADDLE_MISS		= "none";
var PADDLE_TOP		= "top";
var PADDLE_RIGHT	= "right";
var PADDLE_BOTTOM	= "bottom";
var PADDLE_LEFT		= "left";

var INIT_BALL_SPEED = 5;

var RAD_LOW_LIMIT = 10;
var RAD_HIGH_LIMIT = 100;
var POS_LOW_LIMIT = 10;
var POS_HIGH_LIMIT = 100;
//------------------------------------------------------------------------------


var fps = 50;
var p_lo = PADDLE_LOW_LIMIT;
var p_hi = PADDLE_HIGH_LIMIT;
var p_t = 0.0;
var moveSpeed = 0.02;
var score = 0;
var hiscore = 0;

//------------------------------------------------------------------------------
// Game objects.
//------------------------------------------------------------------------------
var paddle =
{
	ref: 0,
	x: 0, y: 0,
	w: 0, h: 0,
	dist: 0,
	theta: 0,
	scale: 1,
	vel: 0,
	dir: { h: 0, v: 0 }
};

var ball =
{
	ref: 0,
	x: 0, y: 0,
	r: 0,
	dist: 0,
	theta: 0,
	vel: 0,
	dir: { h: 0, v: 0 }
};

var spiro =
{
	rad1: 100,
	rad2: 16,
	pos : 16,
	res : 0.02,
};
//------------------------------------------------------------------------------


//------------------------------------------------------------------------------
// HTML Interface objects
//------------------------------------------------------------------------------
var container;
var c_w;
var c_h;

var spiral;
var pad_norm;
var ball_dir;
var score_lbl;
var hiscore_lbl;

var ghost_paddle;
var ghost_ball;
//------------------------------------------------------------------------------


//------------------------------------------------------------------------------
// Game state controls
//------------------------------------------------------------------------------
var l_down = false;
var r_down = false;

var spiralMode = true;
var ballReleased = false;

var loop;
//------------------------------------------------------------------------------

function roundToD(a,d)
{
	return Math.round(a*Math.pow(10,d))/Math.pow(10,d);
}

function distance(x,y)
{
	return Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
}

function calcTheta(x,y)
{
//	console.log(y/x);
	var theta = Math.atan(y/x);
//	console.log(theta);
	theta *= (180/Math.PI);
//	console.log(theta);
	theta += (x < 0)?180:((x > 0 && y < 0)?360:0);
//	console.log(theta);
	return theta;
}

function calcSpiroX(t)
{
	return (spiro.rad1+spiro.rad2)*Math.cos(t*Math.PI)+spiro.pos*Math.cos((spiro.rad1+spiro.rad2)*t*Math.PI/spiro.rad2);	// x(t)=(R+r)cos(t) + p*cos((R+r)t/r) 
}

function calcSpiroY(t)
{
	return (spiro.rad1+spiro.rad2)*Math.sin(t*Math.PI)+spiro.pos*Math.sin((spiro.rad1+spiro.rad2)*t*Math.PI/spiro.rad2);	// y(t)=(R+r)sin(t) + p*sin((R+r)t/r) 
}

function calculateX(t)
{
	return Math.cos(t*Math.PI) * (PADDLE_BASE_DIST*(t)+PADDLE_BASE_DIST);
}

function calculateY(t)
{
	return Math.sin(t*Math.PI) * (PADDLE_BASE_DIST*(t)+PADDLE_BASE_DIST);
}

function calculateVelocity(obj, oldx, oldy)
{
	obj.dir.h = obj.x-oldx;
	obj.dir.v = obj.y-oldy;
	obj.vel = Math.sqrt(Math.pow(obj.dir.h,2)+Math.pow(obj.dir.v,2));

//	console.log("prenormalized: "+obj.vel+" "+obj.dir.h+" "+obj.dir.v);

	obj.dir.h /= obj.vel;
	obj.dir.v /= obj.vel;

//	console.log("normalized: "+obj.vel+" "+obj.dir.h+" "+obj.dir.v);
}
	
function calculateLimits()
{
	if (spiralMode)
	{
		p_lo = PADDLE_LOW_LIMIT;
		p_hi = PADDLE_HIGH_LIMIT;
	}
	else
	{
		var x1 = calcSpiroX(p_lo);
		var y1 = calcSpiroY(p_lo);

		var x = roundToD(calcSpiroX(p_lo+spiro.res),4);
		var y = roundToD(calcSpiroY(p_lo+spiro.res),4);

//		console.log(x + " " + y);

		for (p_hi = p_lo+spiro.res; x != x1 || y != y1; p_hi += spiro.res)
		{
			x = roundToD(calcSpiroX(p_hi),4);
			y = roundToD(calcSpiroY(p_hi),4);
			
//			console.log(x1+" "+x+"   "+y1+" "+y+"   "+p_hi);
		}

		p_hi -= spiro.res
		p_hi = roundToD(p_hi,2);
		
//		console.log(x1+" "+x+"   "+y1+" "+y+"   ");
//		console.log(p_lo + " " + p_hi);
	}
}


//==============================================================================
// Spiral funcs
//==============================================================================
function randomizeSpirograph()
{
	spiro.rad1 = Math.random()*(RAD_HIGH_LIMIT-RAD_LOW_LIMIT)+RAD_LOW_LIMIT;
	spiro.rad2 = Math.random()*(RAD_HIGH_LIMIT-RAD_LOW_LIMIT)+RAD_LOW_LIMIT;
	spiro.pos = Math.random()*(POS_HIGH_LIMIT-POS_LOW_LIMIT)+POS_LOW_LIMIT;

	spiro.rad1 = Math.round(spiro.rad1);
	spiro.rad2 = Math.round(spiro.rad2);
	spiro.pos = Math.round(spiro.pos);

	console.log(spiro.rad1 + " " + spiro.rad2 + " " + spiro.pos);

	var t_scale = (p_t-p_lo)/(p_hi-p_lo);

	calculateLimits();

	p_t = t_scale*p_hi-p_lo;

	buildSpiral();
	calculatePos();
}

function buildSpiral()
{
	var x1 = 0;
	var y1 = 0;
	var x2 = (!spiralMode)?calcSpiroX(p_lo):calculateX(p_lo);
	var y2 = (!spiralMode)?calcSpiroY(p_lo):calculateY(p_lo);
	
	var x = roundToD(x2,4);
	var y = roundToD(y2,4);
	var points = "m " + x.toString() + "," + y.toString();

	for (var i = p_lo + spiro.res; i < p_hi; i += spiro.res)
	{
		x1 = x2;
		y1 = y2;

		x2 = (!spiralMode)?calcSpiroX(i):calculateX(i);
		y2 = (!spiralMode)?calcSpiroY(i):calculateY(i);

		x = roundToD(x2-x1,4);
		y = roundToD(y2-y1,4);
		
		points += " l " + x.toString() + "," + y.toString();
	}

	if (!spiralMode) points += " z";

	spiral.setAttribute("d",points);

//	console.log(points);
}
//==============================================================================


//==============================================================================
// Paddle funcs
//==============================================================================
function calculatePos()
{
	var oldx = paddle.x;
	var oldy = paddle.y;
	paddle.x = (!spiralMode)?calcSpiroX(p_t):calculateX(p_t);
	paddle.y = (!spiralMode)?calcSpiroY(p_t):calculateY(p_t);

	calculateVelocity(paddle,oldx,oldy);

	paddle.dist = distance(paddle.x,paddle.y);
	paddle.theta = calcTheta(paddle.x,paddle.y);
	paddle.scale = paddle.dist/(PADDLE_BASE_DIST*2);
//	paddle.scale = p_t*.5 + .5;
	
//	console.log(p_t+" "+x+" "+y);

	var transform = "translate(" + paddle.x.toString() + "," + paddle.y.toString() + ")";
		transform += " rotate(" + paddle.theta.toString() + ",0,0)";
		transform += " scale(" + paddle.scale.toString() + ")";
		
	paddle.ref.setAttribute("transform", transform);

//	console.log(paddle);
//	console.log(paddle.getAttribute("transform"));

	var paddle_norm_h = -paddle.x/paddle.dist;
	var paddle_norm_v = -paddle.y/paddle.dist;

	pad_norm.setAttribute("x1",paddle.x);
	pad_norm.setAttribute("y1",paddle.y);
	pad_norm.setAttribute("x2",paddle.x+(paddle_norm_h*30));
	pad_norm.setAttribute("y2",paddle.y+(paddle_norm_v*30));

	ghost_paddle.setAttribute("transform","translate(" + paddle.dist.toString() + ",0) scale(" + paddle.scale.toString() + ")");
}

function updatePaddle()
{
	paddle.vel = 0;
	paddle.dir.h = 0;
	paddle.dir.v = 0;

	if (l_down == true && p_t < p_hi)
	{
		p_t += moveSpeed;
		if (p_t >= p_hi) p_t = (!spiralMode)?p_t-p_hi+p_lo:p_hi;

		calculatePos();
	}
	else if (r_down == true && p_t > p_lo)
	{
		p_t -= moveSpeed;
		if (p_t <= p_lo) p_t = (!spiralMode)?p_hi-(p_lo-p_t):p_lo;

		calculatePos();
	}
}
//==============================================================================


//==============================================================================
// Ball funcs
//==============================================================================
function resetBall()
{
	ball.x = 0;
	ball.y = 0;
	ball.vel = 0;
	ball.dist = 0;
	ball.theta = 0;
	ball.dir.h = 0;
	ball.dir.v = 0;
	ballReleased = false;
}

function randomizeBallDir()
{
	ball.dir.h = 1//Math.random()*2-1;
	ball.dir.v = 0//Math.random()*2-1;

	var norm = distance(ball.dir.h,ball.dir.v);

	ball.dir.h /= norm;
	ball.dir.v /= norm;
	ball.vel = INIT_BALL_SPEED;

	ball.theta = calcTheta(ball.x,ball.y);

	console.log(ball.dir.h+" "+ball.dir.v+" "+ball.vel+" "+ball.theta);
}

function checkMissed()
{
	if (ball.x < -c_w/2 || ball.x > c_w/2 || ball.y < -c_h/2 || ball.y > c_h/2)
	{
		console.log("ball missed, resetting ball location");
		console.log(ball.x+" "+ball.y);
		resetBall();
	}
}

function bounce(dir,vel,side)
{		
	var old_h = dir.h;
	var old_v = dir.v;

	var norm_h;
	var norm_v;

	if (side == PADDLE_TOP)
	{
		norm_h = -paddle.y/paddle.dist;
		norm_v = paddle.x/paddle.dist;
	}
	else if (side == PADDLE_BOTTOM)
	{
		norm_h = paddle.y/paddle.dist;
		norm_v = -paddle.x/paddle.dist;
	}
	else if (side == PADDLE_LEFT)
	{
		norm_h = -paddle.x/paddle.dist;
		norm_v = -paddle.y/paddle.dist;
	}
	else if (side == PADDLE_RIGHT)
	{
		norm_h = paddle.x/paddle.dist;
		norm_v = paddle.y/paddle.dist;
	}
	
	dir.h = -2*(old_h*norm_h+old_v*norm_v)*norm_h+old_h;
	dir.v = -2*(old_h*norm_h+old_v*norm_v)*norm_v+old_v;
}

function didHitPaddle(x,y,r)
{
	if (y >= -(paddle.h/2*paddle.scale) && y <= (paddle.h/2*paddle.scale))
	{
		if (x+r >= paddle.dist-(paddle.w/2*paddle.scale) && x <= paddle.dist-(paddle.w/2*paddle.scale))
			return PADDLE_LEFT;
		if (x-r <= paddle.dist+(paddle.w/2*paddle.scale) && x >= paddle.dist+(paddle.w/2*paddle.scale))
			return PADDLE_RIGHT;
	}
	if (x >= paddle.dist-(paddle.w/2*paddle.scale) && x <= paddle.dist+(paddle.w/2*paddle.scale))
	{
		if (y+r <= (paddle.h/2*paddle.scale) && y >= (paddle.h/2*paddle.scale))
			return PADDLE_TOP;
		if (y-r >= -(paddle.h/2*paddle.scale) && y <= -(paddle.h/2*paddle.scale))
			return PADDLE_BOTTOM;
	}

	return PADDLE_MISS;
}

function checkCollision()
{
//	console.log("at start of func: "+ball.dir.h+" "+ball.dir.v);
	
	var temp_ball_theta = ball.theta-paddle.theta;
	console.log(ball.theta+" "+paddle.theta+" "+temp_ball_theta);
	
	var temp_ball_x = Math.cos(temp_ball_theta*Math.PI/180)*ball.dist;
	var temp_ball_y = Math.sin(temp_ball_theta*Math.PI/180)*ball.dist;

	console.log("temp x: "+temp_ball_x+"  temp y: "+temp_ball_y+"  dist: "+ball.dist);
	ghost_ball.setAttribute("transform","translate("+temp_ball_x.toString()+","+temp_ball_y.toString()+")");

	var hitSide = PADDLE_MISS;

	if ((hitSide = didHitPaddle(temp_ball_x,temp_ball_y,ball.r)) != PADDLE_MISS)
	{
		console.log("ball hit "+hitSide+" side of paddle");
		console.log("before: "+ball.dir.h+" "+ball.dir.v+" "+ball.vel);
		
		if (!((hitSide == PADDLE_TOP || hitSide == PADDLE_BOTTOM) && paddle.vel != 0))
			bounce(ball.dir,ball.vel,hitSide);
		else
		{
			ball.vel = paddle.vel;
			ball.dir.h = paddle.dir.h;
			ball.dir.v = paddle.dir.v;
		}
		
		console.log("after: "+ball.dir.h+" "+ball.dir.v+" "+ball.vel);

		if (hitSide == PADDLE_TOP || hitSide == PADDLE_BOTTOM) score += 500;
		if (hitSide == PADDLE_LEFT) score += 1000;
		if (hitSide == PADDLE_RIGHT) score += 200;
	}
}

function updateBall()
{
	ball.x += ball.vel*ball.dir.h;
	ball.y += ball.vel*ball.dir.v;
	ball.dist = distance(ball.x,ball.y);
	ball.theta = calcTheta(ball.x,ball.y);

	checkCollision();
	checkMissed();

	var transform = "translate(" + ball.x + "," + ball.y +")";

	ball.ref.setAttribute("transform",transform);

	ball_dir.setAttribute("x1",ball.x);
	ball_dir.setAttribute("y1",ball.y);
	ball_dir.setAttribute("x2",ball.x+(ball.dir.h*20));
	ball_dir.setAttribute("y2",ball.y+(ball.dir.v*20));

	score++;
	if (score > hiscore)
		hiscore = score;
}
//==============================================================================


function readKeys(event)
{
	console.log(event.keyCode);
	
	if (event.keyCode == 37)
	{
		if (event.type == "keydown") l_down = true;
		else l_down = false;
	}
	else if (event.keyCode == 39 )
	{
		if (event.type == "keydown") r_down = true;
		else r_down = false;
	}
	else if (event.keyCode == 32 && event.type == "keydown" && !ballReleased)
	{
		console.log("RELEASE THE KRAKEN!");
		ballReleased = true;
		randomizeBallDir();
	}
	else if (event.keyCode == 90 && event.type == "keydown" && !spiralMode)
	{
		console.log("RANDOMIZE!");
		randomizeSpirograph();
	}
	else if (event.keyCode == 83 && event.type == "keydown")
	{
		console.log("Toggling spirograph mode");
		spiralMode = !spiralMode;

		calculateLimits();

		buildSpiral();
		calculatePos();
	}
	else if (event.keyCode == 27)
	{
//		clearInterval(loop);
		resetBall();
		updateBall();
	}
	
}

function gameloop()
{
	updatePaddle();
	if (ballReleased) updateBall();

	score_lbl.text = "Score: "+score;
	hiscore_lbl.text = "Hiscore: " + hiscore;
}

function init()
{
	paddle.ref = document.getElementById("paddle");
	paddle.w = paddle.ref.getAttribute("width");
	paddle.h = paddle.ref.getAttribute("height");

	pad_norm = document.getElementById("pad_norm");

	ball.ref = document.getElementById("ball");
	ball.r = ball.ref.getAttribute("r");

	ball_dir = document.getElementById("ball_dir");

	container = document.getElementById("gameview");
	c_w = container.getAttribute("width");
	c_h = container.getAttribute("height");

//	console.log(c_w+" "+c_h);

	spiral = document.getElementById("spiral");

	buildSpiral();

	score_lbl = document.getElementById("score");
	hiscore_lbl = document.getElementById("hiscore");

	ghost_paddle = document.getElementById("ghost_paddle");
	ghost_ball = document.getElementById("ghost_ball");

	calculatePos();
	paddle.vel = 0;

	loop = setInterval(gameloop, 1000/fps);
}

document.addEventListener("DOMContentLoaded",init);
document.addEventListener("keydown",readKeys);
document.addEventListener("keyup",readKeys);
