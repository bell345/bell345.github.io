var cd;
$(function () {
Require(
    ["assets/js/tblib/base.js",
     "assets/js/tblib/util.js",
     "assets/js/tblib/loader.js",
     "assets/js/tblib/math.js"], function () {

    loader.start();
    $(document).on("pageload", function () {
        function CircleDemonstration() {
            this.settings = {
                circle: {
                    radius: "20% h",
                    strokeWidth: 5,
                    strokeColour: "#000",
                    padding: new DirectionQuantity(0, 50),
                    previewWidth: 3,
                    previewOpacity: 0.1
                },
                scale: {
                    step: 1/8,
                    width: 2,
                    length: 10
                },
                graph: {
                    strokeColour: "#000",
                    strokeWidth: 3,
                    padding: new DirectionQuantity(0, 20),
                    yFactor: 20,
                    opacity: 0.2,
                    step: dtr(2)
                },
                animation: {
                    angleChange: dtr(30) // per second
                },
                sinColour: new Colour("#09f"),
                cosColour: new Colour("#fd0"),
                tanColour: new Colour("#00f")
            };
            this.state = {
                paused: false,
                showSin: true,
                showCos: true,
                showTan: true,
                currentAngle: dtr(90),
                prevTime: -1
            };
            this.triggerNextUpdate = true;
            // 20, "20", "20%", "20%h"
            this.parseHomogenousValue = function (value, useHeight) {
                if (value instanceof DirectionQuantity)
                    return new DirectionQuantity(
                        this.parseHomogenousValue(value.top),
                        this.parseHomogenousValue(value.right),
                        this.parseHomogenousValue(value.bottom),
                        this.parseHomogenousValue(value.left)
                    );
                else if (value instanceof Vector2D)
                    return new Vector2D(
                        this.parseHomogenousValue(value.x),
                        this.parseHomogenousValue(value.y)
                    );

                value = value.toString();
                if (value.search("%") == -1) return parseFloat(value);
                if (value.search("h") != -1) useHeight = true;

                value = value.replace(/[^0-9\.e]/g, "");
                if (useHeight) return this.canvas.height * (parseFloat(value)/100);
                else return this.canvas.width * (parseFloat(value)/100);
            };

            this.init = function (canvas) {
                this.canvas = canvas;
                this.$ = this.canvas.getContext('2d');
                this.helper = new CvsHelper(this.$);
                this.prevTime = new Date().getTime();
                this.loop();
            };
            this.getGraphCoordinates = function (x, y) {
                var phm = function (d) { return function (v, h) {
                    return d.parseHomogenousValue(v, h);
                }; }(this);
                var set = this.settings;

                var cPad = phm(set.circle.padding);
                var sPad = phm(set.graph.padding);
                var circleRad = phm(set.circle.radius);

                x /= 2*Math.PI; // place it in the domain of [0deg, 360deg]
                if (Math.abs(x - 1) > Number.EPSILON) x %= 1; // confine it to the graph
                var startX = cPad.left + circleRad*2 + cPad.right + sPad.left;
                var endX = this.canvas.width - sPad.right;
                x = (endX - startX)*x + startX; // place it on the graph

                var middleY = 0.5*this.canvas.height;
                y *= -circleRad; // reverse the direction for the canvas, graph to radius
                y += middleY; // place in middle

                return new Vector2D(x, y);
            };
            this.hasChanged = function () {
                return (
                    this.triggerNextUpdate ||
                    this.canvas.width != window.innerWidth ||
                    this.canvas.height != window.innerHeight ||
                    !this.state.paused
                );
            };

            this.loop = function () {
                requestAnimationFrame(
                    function (demo) {
                        return function () {
                            demo.loop();
                        }
                    }(this)
                );
                if (this.canvas.width != window.innerWidth) this.canvas.width = window.innerWidth;
                if (this.canvas.height != window.innerHeight) this.canvas.height = window.innerHeight;
                if (this.hasChanged()) {
                    this.$.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.draw();
                }
                this.animate();
            };

            this.drawCircle = function () {
                var set = this.settings;
                var state = this.state;
                var angle = state.currentAngle;
                var pad = this.parseHomogenousValue(set.circle.padding);
                var radius = this.parseHomogenousValue(set.circle.radius);
                var centre = new Vector2D(
                    pad.left + radius,
                    0.5 * this.canvas.height
                );

                var intersection = circlePoint(-rtd(this.state.currentAngle), radius, centre.x, centre.y);
                var sinPoint = new Vector2D(centre.x, intersection.y);
                var cosPoint = new Vector2D(intersection.x, centre.y);
                var tanPoint = new Vector2D(centre.x + radius, centre.y);
                tanPoint.y += Math.tan(this.state.currentAngle) * -radius;
                var sinFill = set.sinColour.copy(), cosFill = set.cosColour.copy(), tanFill = set.tanColour.copy();
                sinFill.a = cosFill.a = tanFill.a = set.circle.previewOpacity;

                if (state.showSin) this.helper.polygon(
                    [centre, intersection, sinPoint], sinFill
                );
                if (state.showCos) this.helper.polygon(
                    [centre, intersection, cosPoint], cosFill
                );
                if (state.showTan) this.helper.polygon(
                    [centre, new Vector2D(centre.x + radius, centre.y), tanPoint], tanFill
                );
                if (state.showSin) this.helper.linePlot(
                    [centre, sinPoint],
                    set.circle.previewWidth, set.sinColour
                );
                if (state.showCos) this.helper.linePlot(
                    [centre, cosPoint],
                    set.circle.previewWidth, set.cosColour
                );
                if (state.showTan) this.helper.linePlot(
                    [new Vector2D(centre.x + radius, centre.y), tanPoint],
                    set.circle.previewWidth, set.tanColour
                );
                this.helper.linePlot(
                    [centre, intersection], 3, "#555"
                );

                this.helper.circle(
                    centre, radius,
                    null, // fill style
                    set.circle.strokeWidth,
                    set.circle.strokeColour
                );

                var step = set.scale.step * 2*Math.PI;
                var halfLength = set.scale.length/2;
                for (var i=0;i<2*Math.PI;i+=step) {
                    this.helper.linePlot([
                        circlePoint(-rtd(i), radius + halfLength, centre.x, centre.y),
                        circlePoint(-rtd(i), radius - halfLength, centre.x, centre.y)
                        ], set.scale.width, set.circle.strokeColour
                    );
                }
            };

            this.plotFunction = function (func, style, width) {
                var set = this.settings;
                var state = this.state;

                var step = set.graph.step;
                style = new Colour(style);
                var fillStyle = style.copy();
                fillStyle.a = set.graph.opacity;
                var fillArray = [];
                var addToFillArray = function (helper) { return function (value) {
                    fillArray.push(helper.bound(value));
                }; }(this.helper);

                for (var i=step;i<=state.currentAngle;i+=step) {
                    var prevValue = this.getGraphCoordinates(i-step, func(i-step));
                    var currValue = this.getGraphCoordinates(i, func(i));
                    addToFillArray(prevValue);
                    this.helper.linePlot(
                        [prevValue, currValue], width, style
                    );
                }

                var lastValue = Math.floor(state.currentAngle / step) * step;
                var lastPoint = this.getGraphCoordinates(lastValue, func(lastValue));
                var currPoint = this.getGraphCoordinates(state.currentAngle, func(state.currentAngle));
                addToFillArray(lastPoint);
                addToFillArray(currPoint);
                this.helper.linePlot(
                    [lastPoint, currPoint], width, style
                );

                addToFillArray(this.getGraphCoordinates(state.currentAngle, 0));
                addToFillArray(this.getGraphCoordinates(0, 0));

                this.helper.polygon(fillArray, fillStyle);
            }

            this.drawGraph = function () {
                var phm = function (d) { return function (v, h) {
                    return d.parseHomogenousValue(v, h);
                }; }(this);
                var set = this.settings;
                var state = this.state;

                var cPad = phm(set.circle.padding);
                var sPad = phm(set.graph.padding);
                var circleRad = phm(set.circle.radius);

                var start = new Vector2D(
                    cPad.left + circleRad*2 + cPad.right + sPad.left,
                    0.5 * this.canvas.height
                );
                var end = new Vector2D(this.canvas.width - sPad.right, start.y);

                if (state.showSin) this.plotFunction(Math.sin, set.sinColour, set.graph.strokeWidth);
                if (state.showCos) this.plotFunction(Math.cos, set.cosColour, set.graph.strokeWidth);
                if (state.showTan) this.plotFunction(Math.tan, set.tanColour, set.graph.strokeWidth);

                this.helper.linePlot(
                    [start, end],
                    set.graph.strokeWidth, set.graph.strokeColour
                );
                this.helper.linePlot(
                    [this.getGraphCoordinates(0, -1), this.getGraphCoordinates(0, 1)],
                    set.graph.strokeWidth, set.graph.strokeColour
                );

                var step = set.scale.step * 2*Math.PI;
                var halfLength = set.scale.length/2;
                for (var i=0;i<2*Math.PI;i+=step) {
                    var point = this.getGraphCoordinates(i, 0);
                    var top = point.copy();
                    top.y += halfLength;
                    var bottom = point.copy();
                    bottom.y -= halfLength;
                    this.helper.linePlot(
                        [top, bottom], set.scale.width, set.graph.strokeColour
                    );
                }
            }

            this.draw = function () {
                this.drawCircle();
                this.drawGraph();
            };

            this.animate = function () {
                var currTime = new Date().getTime();
                var delta = (currTime - this.state.prevTime) / 1000;
                this.state.prevTime = currTime;

                if (!this.state.paused) {
                    var set = this.settings.animation;

                    this.state.currentAngle += set.angleChange * delta;
                    this.state.currentAngle %= 2*Math.PI;
                }
            };
        }
        cd = new CircleDemonstration();
        cd.init(gebi("canvas"));
    });
});
});
