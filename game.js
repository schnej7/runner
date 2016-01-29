window.onload = function() {
    paper.install(window);
    paper.setup('myCanvas');

    var paths = [],
        start,
        isMouseDown = false,
        scales = [0.99, 0.98, 0.97, 0.96, 0.95],
        scaleIndex = 0
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
    }

    tool2.onMouseDrag = function(event) {
        if (event.point.getDistance(start) < 19) {
            paths[paths.length-1].arcTo(start);
        } else {
            paths[paths.length-1].arcTo(event.point);
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
    }
}
