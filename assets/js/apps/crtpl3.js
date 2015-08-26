$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js",
    "assets/js/tblib/math.js"
], function () {
    loader.start();

    function PlaneNode() {
        this.id = generateUUID();
        this.draw = function (plane) {};
    }

    function FunctionNode(func, style, start, end) {
        PlaneNode.call(this);
        this.func = func;
        this.style = new Colour(style);
        this.start = isNull(start) ? null : start; // null = edge of screen for cartesian funcs
        this.end = isNull(end) ? null : end;
        this.resolution = 50; // inverse of parameter step
        this.width = 2;
        this.draw = function (plane) {
            var threshold = plane.settings.functions.threshold;
            var scaleSet = plane.settings.scale;
            var start, end, step, coord, loc;
            var plot = [];

            switch (this.func.type) {
                case MathFunction.Types.Cartesian:
                    var factor = plane.getFactor();
                    var scaleX = plane.computeScale(factor.x, scaleSet.minInterval, scaleSet.maxInterval);

                    if (this.start == null) {
                        start = this.getCoordinateFromLocation(new Vector2D(0 - (factor.x * scaleX), 0)).x;
                        start = Math.ceil(start/scaleX)*scaleX;
                    } else start = this.start;
                    if (this.end == null) {
                        end = this.getCoordinateFromLocation(new Vector2D(plane.canvas.width + (factor.x * scaleX), 0)).x;
                        end = Math.ceil(end/scaleX)*scaleX;
                    } else end = this.end;

                    step = scaleX/this.resolution;

                    for (var x=start;x<=end;x+=step) {
                        coord = new Vector2D(x, func.eval(x));
                        loc = plane.getLocationOfCoordinate(coord);
                        if (loc.clamp(set.threshold.negate(), set.threshold).equals(loc)) // significant to plane
                            plot.push(loc);
                    }
                    break;
                case MathFunction.Types.Polar:
                case MathFunction.Types.Parametric:
                    start = this.start;
                    end = this.end;
                    step = Math.PI/this.resolution;
                    for (var t=start;t<=end;t+=step) {
                        coord = null;
                        if (func.type == MathFunction.Types.Polar)
                            coord = Vector2D.fromPolar(t, func.eval(t));
                        else if (func.type == MathFunction.Types.Parametric)
                            coord = func.eval(t);

                        loc = plane.getLocationOfCoordinate(coord);
                        if (loc.clamp(threshold.negate(), threshold).equals(loc))
                            plot.push(loc);
                    }
                    break;
                default:
                    break;
            }

            plane.$.globalCompositeOperation = "destination-over";
            plane.helper.linePlot(plot, this.width, this.style);
            plane.$.globalCompositeOperation = "source-over";
        }
    }
    FunctionNode.prototype = Object.create(PlaneNode.prototype);

    var PlotTypes = new Enum("line", "scatter");

    function PlotNode(plot, type, style) {
        PlaneNode.call(this);
        this.plot = plot;
        this.type = type;
        this.style = new Colour(style);
        this.width = 2;
        this.draw = function (plane) {
            var threshold = plane.settings.functions.threshold;
            var points = this.plot.filter(function (p) {
                var loc = plane.getLocationOfCoordinate(p);
                return loc.clamp(threshold.negate(), threshold).equals(loc);
            });

            this.$.globalCompositeOperation = "destination-over";
            switch (this.type) {
                case "scatter":
                    this.helper.crossPlot(points, null, this.width, this.style);
                    break;
                case "line":
                default:
                    this.helper.linePlot(points, this.width, this.style);
                    break;
            }
            this.$.globalCompositeOperation = "source-over";
        }
    }
    PlotNode.prototype = Object.create(PlaneNode.prototype);

    function CrtPlane3(canvas, expand) {
        WideCanvas.call(this, canvas, expand);
        this.settings = {
            backgroundColour: "",
            textColour: "",
            axes: {
                x: {
                    enabled: true,
                    fixed: "auto", // modes: none, auto, top, bottom
                    width: 6,
                    colour: ""
                },
                y: {
                    enabled: true,
                    fixed: "auto", // modes: none, auto, left, right,
                    width: 6,
                    colour: ""
                },
                fixedIntersect: false,
                margin: new DirectionQuantity(45, 75),
                blockMargin: true,
                blockMarginColour: ""
            },
            scale: {
                enabled: true,
                mark: {
                    width: 4,
                    length: 20,
                    colour: ""
                },
                label: {
                    enabled: true,
                    font: "Open Sans",
                    size: 20,
                    colour: "",
                    offset: new DirectionQuantity(30, 24),
                    padding: new DirectionQuantity(6),
                    xPosition: "auto",
                    yPosition: "auto"
                },
                grid: {
                    enabled: true,
                    width: 2,
                    colour: ""
                },
                minor: {
                    enabled: true,
                    width: 1,
                    length: 12,
                    colour: "",
                    grid: false,
                    minInterval: 45,
                    maxInterval: 70
                },
                minInterval: 135,
                maxInterval: 170,
                fitToMax: true,
                staySquare: true
            },
            controls: {
                scrollZoomFactor: 1.3,
                buttonZoomFactor: 1.6,
                panTimeout: 400,
                zoomTimeout: 600,
                minExtents: new Vector2D(5e-5),
                maxExtents: new Vector2D(1e10)
            },
            functions: {
                threshold: new Vector2D(1e4)
            },
            legend: {
                visible: true
            }
        };
        this.objects = {

        };
        this.state = {
            center: new Vector2D(0, 0),
            deltaCenter: new Vector2D(0, 0),
            extents: new Vector2D(32, 18),
            deltaExtents: new Vector2D(32, 18)
        };
        this.previous = {
            center: null,
            startCenter: null,
            extents: null,
            deltaCenter: null,
            mouseDown: null,
            colour: -1
        };
        this.triggerNextUpdate = true;

        this.getProperty = function (property) {
            var propTree = property.split(".");
            for (var i= 0,c=this;i<propTree.length-1;i++) {
                c = c[propTree[i]];
                if (c === undefined) return null;
            }
            return c[propTree[propTree.length-1]];
        };
        this.setProperty = function (property, value) {
            var propTree = property.split(".");
            for (var i= 0,c=this;i<propTree.length-1;i++) {
                c = c[propTree[i]];
                if (c === undefined) return null;
            }
            c[propTree[propTree.length-1]] = value;
            this.triggerNextUpdate = true;
        };
        this.keepExtentsSquare = function () {
            var extents = this.state.extents;
            var center = this.state.center;
            var ratio = this.canvas.width / this.canvas.height;
            if ((extents.x / extents.y).fixFloat(2) == ratio.fixFloat(2)) return;

            extents.x = extents.y * ratio;
            this.triggerNextUpdate = true;
        };

        this.computeScale = function (factor, min, max) {
            var scale = 1;
            // decreasing scale (0.5, 0.2, 0.1)
            function decreaseScale() {
                while (factor * scale > max) {
                    // divide until number you want to divide by breaks the limit
                    if (factor * (scale / 2) <= max
                        && factor * (scale / 4) > max) scale /= 2;
                    else if (factor * (scale / 5) <= max
                        && factor * (scale / 4) <= max) scale /= 5;
                    else scale /= 10;
                }
            }
            // increasing scale (2, 5, 10)
            function increaseScale() {
                while (factor * scale < min) {
                    // divide until number you want to divide by breaks the limit
                    if (factor * (scale * 2) >= min
                        && factor * (scale * 4) < min) scale *= 2;
                    else if (factor * (scale * 5) >= min
                        && factor * (scale * 4) >= min) scale *= 5;
                    else scale *= 10;
                }
            }
            // swap order to either be as large a scale as possible, or divide as small as possible
            if (this.settings.scale.fitToMax) {
                decreaseScale();
                increaseScale();
            } else {
                increaseScale();
                decreaseScale();
            }
            return scale;
        };
        this.getFactor = function () { return new Vector2D(this.$.canvas.width, this.$.canvas.height).divide(this.state.extents); };
        this.getLocationOfCoordinate = function (coord) { return this.helper.getLocationOfCoordinate(coord, this.state.extents, this.state.pan); };
        this.getCoordinateFromLocation = function (loc) { return this.helper.getCoordinateFromLocation(loc, this.state.extents, this.state.pan); };

        this.loop = function (delta) {
            if (!isNull(this.previous.deltaCenter) || !this.previous.deltaCenter.equals(this.state.deltaCenter))
                moveWithTransforms(this.canvas, this.state.deltaCenter.x, this.state.deltaCenter.y, true);

            this.animate();
            if (this.triggerNextUpdate) {
                this.triggerNextUpdate = false;
                this.draw();
            }
            this.previous.center = this.state.center;
            this.previous.extents = this.state.extents;
            this.previous.startCenter = this.state.startCenter;
            this.previous.deltaCenter = this.state.deltaCenter;
        };

        this.drawScale = function (xfixed, yfixed) {
            var set = this.settings.scale, axesSet = this.settings.axes, state = this.state;
            var trueOrigin = this.getLocationOfCoordinate(new Vector2D(0));
            var factor = this.getFactor();

            var scale = new Vector2D(
                this.computeScale(factor.x, set.minInterval, set.maxInterval),
                this.computeScale(factor.y, set.minInterval, set.maxInterval)
            );
            var minorScale = new Vector2D(
                this.computeScale(factor.x, set.minor.minInterval, set.minor.maxInterval),
                this.computeScale(factor.y, set.minor.minInterval, set.minor.maxInterval)
            );

            var origin = new Vector2D(

            );
        };

        this.draw = function () {
            this.helper.clear();
            for (var obj in this.objects) if (this.objects.hasOwnProperty(obj)) {
                this.objects[obj].draw(this);
            }
        }
    }

    $(document).on("pageload", function () {
        
    });
});
});
