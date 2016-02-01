var center,
pressedKeys = {},
abs_x,
abs_y,
max_y,
vx = 0,
vy = 0,
thrust = 2,
angle = 90,
screen_height,
screen_width,
new_obj_count = 0,
new_obj_limit = 1000,
new_puff_count = 0,
new_puff_limit = 10,
puff_max_age = new_puff_limit * 10,
next_cloud_x,
triangle,
indicator_group,
MAX_VX = 10,
INDICATOR_SPEED = 10,
COLORS=["#FFBF00","#E83F6F","#2274A5","#32936F","#581D68"],
CLOUDS=[
    [{"x":439,"y":203},{"x":437,"y":182},{"x":440,"y":162},{"x":450,"y":142},{"x":471,"y":135},{"x":491,"y":130},{"x":513,"y":125},{"x":533,"y":127},{"x":544,"y":146},{"x":549,"y":167},{"x":549,"y":188},{"x":549,"y":209},{"x":539,"y":227},{"x":519,"y":238},{"x":499,"y":238},{"x":477,"y":238}],
    [{"x":681,"y":134},{"x":700,"y":143},{"x":714,"y":158},{"x":722,"y":178},{"x":728,"y":198},{"x":719,"y":217},{"x":702,"y":231},{"x":683,"y":239},{"x":663,"y":243},{"x":640,"y":240},{"x":623,"y":228},{"x":610,"y":211},{"x":606,"y":191},{"x":606,"y":170},{"x":613,"y":149},{"x":629,"y":132}],
    [{"x":989,"y":145},{"x":1008,"y":152},{"x":1021,"y":168},{"x":1030,"y":186},{"x":1041,"y":204},{"x":1042,"y":224},{"x":1028,"y":239},{"x":1008,"y":247},{"x":988,"y":252},{"x":968,"y":253},{"x":947,"y":253},{"x":926,"y":250},{"x":908,"y":237},{"x":903,"y":213},{"x":905,"y":193},{"x":918,"y":176},{"x":937,"y":158}],
    [{"x":490,"y":234},{"x":472,"y":224},{"x":456,"y":211},{"x":442,"y":194},{"x":437,"y":173},{"x":440,"y":152},{"x":455,"y":135},{"x":475,"y":127},{"x":498,"y":126},{"x":518,"y":132},{"x":528,"y":156},{"x":530,"y":176},{"x":537,"y":198},{"x":537,"y":218}]
],
scales = [0.999, 0.998, 0.997, 0.996, 0.995],
scaleIndex = 0,
in_a_row = 0,
max_in_a_row = 0
total_popped = 0
;

function _longestRun() {
    return max_in_a_row;
}

function _scoreString() {
    return [
        max_in_a_row ? max_in_a_row  + "&nbsp(longest&nbsprun)" : "XXX",
        total_popped ? total_popped + "&nbsp(clouds)" : " XXX ",
        Math.floor(max_y) ? Math.floor(max_y) + "&nbsp(altitude)" : " XXX ",
    ].join(" * ")
    + " = <b>" + _score() + "</b>";
}

function _score() {
    var max_in_a_row_mult = max_in_a_row || 1;
    var total_popped_mult = total_popped || 1;
    return Math.floor(max_y) * max_in_a_row_mult * total_popped_mult;
}
// Returns a random number between min (inclusive) and max (exclusive)
function _rndIn(min, max) {
    return Math.floor(Math.random() * max) + min;
}

function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


function _hexToColor( hex ) {
    var color = hexToRgb( hex );
    return new Color(color.r/255,color.g/255,color.b/255);
}

function _initOrResize() {
    screen_height = $('body').height();
    screen_width = $('body').width();
    center = {};
    center["y"] = screen_height/2;
    center["x"] = screen_width/2;
    next_cloud_x = _rndIn(0,screen_width);
}

function _updateDebug() {
    var debugText = "";
    debugText += "<p>max_y: "+max_y+"</p>";
    debugText += "<p>new_obj_count: "+new_obj_count+"</p>";
    debugText += "<p>new_obj_limit: "+new_obj_limit+"</p>";
    $('.debug').html(debugText);
}

window.onload = function() {

    _initOrResize();
    var canvasElem = $('#myCanvas').get(0);
    canvasElem.setAttribute('height', $('body').height());
    canvasElem.setAttribute('width', $('body').width());

    paper.install(window);
    paper.setup('myCanvas');

    var paths = [],
        start,
        isMouseDown = false
        ;

    var increasingScales = [];
    for (var i = 0; i < scales.length; i++) {
        increasingScales.push(scales[scales.length-1-i]);
    }
    for (var i = 0; i < increasingScales.length; i++) {
        scales.push(increasingScales[i]);
    }
    var reverseScales = [];
    for (var i = 0; i < scales.length; i++) {
        reverseScales.push(1/scales[scales.length-1-i]);
    }
    for (var i = 0; i < reverseScales.length; i++) {
        scales.push(reverseScales[i]);
    }

    var tool2 = new Tool();
    tool2.minDistance = 20;

    tool2.onMouseDown = function (event) {
        isMouseDown = true;
        path = new Path();
        path.strokeColor = 'black';
        path.add(event.point);
        paths.push(path);
        start = event.point;
        points = [];
    }

    var points = [];
    tool2.onMouseDrag = function(event) {
        if (event.point.getDistance(start) < 19) {
            paths[paths.length-1].arcTo(start);
            console.log(points.toString());
        } else {
            paths[paths.length-1].arcTo(event.point);
            points.push(JSON.stringify({"x":event.point.x,"y":event.point.y}));
        }
    }

    tool2.onMouseUp = function (event) {
        isMouseDown = false;
    }

    view.onFrame = function(event) {
        // On each frame, rotate the path by 3 degrees:
        scaleIndex = (scaleIndex + 1) % scales.length;
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (path && !isMouseDown) {
                path.rotate(3);
                path.scale(scales[scaleIndex]);
            }
        }

        if (pressedKeys["right"]) {
            triangle.turn(5);
        }
        if (pressedKeys["left"]) {
            triangle.turn(-5);
        }
        _updateTriangle();
        //_updateDebug();

        if (abs_y < 0 || vy < -2) {
            view.onFrame = null;
            var bestScore = localStorage.bestScore || 0;
            if (bestScore < _score()) {
                localStorage.bestScore = _score();
                localStorage.bestScoreString = _scoreString();
            }
            in_a_row = 0;
            abs_y = 0;
            $(".finalScore").removeClass("hidden");
            $(".finalScore .scoreString").html(_scoreString());
            $(".finalScore .runString").html(_longestRun());
            $(".finalScore .bestScoreString").html(localStorage.bestScoreString);
        }
        $(".score").html(_scoreString());
    }

    triangle = initTriangle();
    tool2.onKeyDown = function(event) {
        pressedKeys[event.key] = true;
    }

    tool2.onKeyUp = function(event) {
        pressedKeys[event.key] = false;
    }

    indicator = _initIndicator();
}

function _initIndicator() {
    var triangle = new Path();
    triangle.add(new Point(next_cloud_x,0),new Point(next_cloud_x+10,35),new Point(next_cloud_x-10,35));
    triangle.closePath();
    triangle.fillColor = "#87CFD6";
    var coverSquare = new Path();
    coverSquare.add(new Point(next_cloud_x+10,35),new Point(next_cloud_x+10,70),new Point(next_cloud_x-10,70),new Point(next_cloud_x-10,35));
    coverSquare.closePath();
    coverSquare.fillColor = "#ffffff";
    coverSquare.onFrame = function() {
        this.position.y = 45 * ( (new_obj_limit - new_obj_count) / new_obj_limit ) + 18;
    }
    var group = new Group(triangle, coverSquare);
    group.onFrame = function() {
        INDICATOR_SPEED = Math.abs(this.position.x - next_cloud_x) / 4;
        if (next_cloud_x > this.position.x) {
            this.position.x += INDICATOR_SPEED;
        } else {
            this.position.x -= INDICATOR_SPEED;
        }
        if (Math.abs(next_cloud_x - this.position.x) < INDICATOR_SPEED+1) {
            this.position.x = next_cloud_x;
        }
    }
    return group;
}

function _updateTriangle() {
    var translation = new Point(vx, 0);
    triangle.obj.translate(translation);
    triangle.obj.position.x = (triangle.obj.position.x + screen_width) % screen_width;
    abs_x = (abs_x + vx + screen_width) % screen_width;
    abs_y = abs_y + vy;
    if (abs_y > max_y) {
        new_obj_count += abs_y - max_y;
        max_y = abs_y;
        if (new_obj_count > new_obj_limit) {
            new_obj_limit = Math.max(1000, abs_y / 100);
            var cloud_nerf_limit = 100000;
            var cloud_max = 70*((cloud_nerf_limit-abs_y)/cloud_nerf_limit);
            var cloud_min = 30;
            var cloud_size = Math.max(30,cloud_max);
            initCloud(next_cloud_x,-cloud_size,cloud_size);
            next_cloud_x = _rndIn(0,screen_width);
            new_obj_count = 0;
        }
    }
    new_puff_count += 1;
    if (new_puff_count > new_puff_limit) {
        initPuff();
        new_puff_count = 0;
    }
    vy += Math.sin(toRadians(angle)) * thrust / 5;
    vx = Math.max(Math.min(vx - (Math.cos(toRadians(angle)) * thrust * 2), MAX_VX),-MAX_VX);
    thrust = Math.max(thrust - 0.05, 0.04);
    vy -= 0.013;
}

function _updateObject(object) {
    var translation = new Point(0, vy);
    object.translate(translation);
}

function _fadeObject(object,age) {
    if (object.strokeColor) {
        object.strokeColor.alpha /= 1.05;
    }
    if (object.fillColor) {
        object.fillColor.alpha /= 1.02;
    }
    object.age = object.age ? object.age + 1 : 1;
    if (object.age > age) {
        console.log("remove");
        object.remove();
    }
}

function _fadeAndScaleObject(object,age) {
    object.scale(1.03);
    _fadeObject(object,age);
}

function _spinScale(object) {
    object.rotate(1);
    object.scale(scales[scaleIndex]);
}

function initTriangle() {
    // Create a triangle shaped path 
    var triangle = new Path();
    triangle.add(new Point(center.x,center.y),new Point(center.x+10,center.y+22),new Point(center.x-10,center.y+22));
    triangle.closePath();
    triangle.strokeColor = '#000';
    triangle.fillColor = '#fff';
    abs_x = triangle.position.x;
    abs_y = 0;
    max_y = abs_y;
    triangle.sendToBack();
    return {
        "obj": triangle,
        "turn": function(deg) {
            this.obj.rotate(deg);
            angle = (angle + deg + 360) % 360;
        }
    }
}

function initCloud(x,y,size) {
    //var cloud = new Path.Circle(new Point(x, y), size);
    var cloud = new Path();
    var cloud_points = CLOUDS[_rndIn(0,CLOUDS.length)];
    var start_point;
    for (var i = 0; i < cloud_points.length; i++) {
        var point = cloud_points[i];
        if (!i) {
            start_point = point;
            cloud.add(point.x,point.y);
        } else {
            if (_rndIn(0,100) < 99) {
                cloud.arcTo(new Point(point.x,point.y));
            }
        }
    }
    cloud.arcTo(new Point(start_point.x,start_point.y));
    cloud.closePath();
    cloud.position.x = x;
    cloud.position.y = -120;
    cloud.strokeColor = '#000';
    cloud.fillColor = '#fff';
    cloud.onFrame = function(event) {
        _updateObject(this);
        _spinScale(this);
        if (!this.hit && this.intersects(triangle.obj)) {
            this.hit=true;
            _initBurst();
            in_a_row++;
            max_in_a_row = Math.max(max_in_a_row,in_a_row);
            total_popped += 1;
            thrust += 1;
            var color = COLORS[in_a_row%COLORS.length];
            this.strokeColor = _hexToColor(color);
            var iar = $("<div/>",{
                class:'in_a_row',
                text:in_a_row
            });
            iar.css("color",color);
            $('.in_a_row_box').append(iar);
            setTimeout(function(){
                iar.addClass('fading');
            },1000);
            setTimeout(function(){
                iar.remove();
            },2000);
        }
        if (this.hit) {
            if (this.strokeColor.alpha == 1) {
                this,strokeColor=_hexToColor(COLORS[_rndIn(0,COLORS.length)]);
            }
            _fadeAndScaleObject(this,puff_max_age);
        }
        if (!this.hit && this.position.y > triangle.obj.position.y + new_obj_limit - 200) {
            in_a_row = 0;
            this.remove();
        }
    }
    return cloud;
}

function initPuff() {
    var puff = new Path.Circle(new Point(triangle.obj.position.x, triangle.obj.position.y), 4);
    puff.strokeColor = '#000000';
    puff.onFrame = function(event) {
        _updateObject(this);
        _fadeAndScaleObject(this,puff_max_age);
    }
    puff.sendToBack();
    return puff;
}

function _initBurst() {
    for (var i = 0; i < 10; i++) {
        var dx = _rndIn(-5,6);
        var dy = _rndIn(-5,6);
        var ptc = new Path.Circle(new Point(triangle.obj.position.x+dx, triangle.obj.position.y+dy), _rndIn(2,3));
        ptc.fillColor=_hexToColor(COLORS[_rndIn(0,COLORS.length)]);
        ptc.dx = dx;
        ptc.dy = dy;
        ptc.onFrame = function(event) {
            var translation = new Point(vx+this.dx, this.dy);
            this.translate(translation);
            _fadeObject(this,80);
        }
    }
}
