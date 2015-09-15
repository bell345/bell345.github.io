var plane;
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

    /**
     * Node for MathFunctions that handles drawing independently of the canvas.
     * @param func The MathFunction that is to be drawn to the canvas.
     * @param style A colour code for styling the line drawn.
     * @param start An X value where the drawing will begin (null if fully continuous)
     * @param end An X value where the drawing will end (null if fully continuous)
     * @constructor
     */
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
                        start = plane.getCoordinateFromLocation(new Vector2D(0 - (factor.x * scaleX), 0)).x;
                        start = Math.ceil(start/scaleX)*scaleX;
                    } else start = this.start;
                    if (this.end == null) {
                        end = plane.getCoordinateFromLocation(new Vector2D(plane.canvas.width + (factor.x * scaleX), 0)).x;
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

    function CyclicGenerator(items, mapfunc) {
        if (isNull(mapfunc)) mapfunc = function (e) { return e; };
        var i = 0;
        return function () {
            var prev = i;
            i = (i + 1) % items.length;
            return mapfunc(items[prev], prev, items);
        };
    }

    function CrtPlane3(canvas, notExpand) {
        WideCanvas.call(this, canvas, notExpand);
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
            dimensions: null,
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
            var ratio = this.canvas.width / this.canvas.height;
            if ((extents.x / extents.y).fixFloat(2) == ratio.fixFloat(2)) return;

            //extents.x = extents.y * ratio;
            extents.y = extents.x / ratio;
            this.state.extents = extents;
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
        this.getLocationOfCoordinate = function (coord) { return this.helper.getLocationOfCoordinate(coord, this.state.extents, this.state.center); };
        this.getCoordinateFromLocation = function (loc) { return this.helper.getCoordinateFromLocation(loc, this.state.extents, this.state.center); };

        this.animate = function (delta) {};

        this.loop = function (delta) {
            var dims = new Vector2D(this.canvas.width, this.canvas.height);
            if (isNull(this.previous.dimensions) || !this.previous.dimensions.equals(dims)) {
                this.triggerNextUpdate = true;
            }

            if (isNull(this.previous.deltaCenter) || !this.previous.deltaCenter.equals(this.state.deltaCenter)) {
                moveWithTransforms(this.canvas, this.state.deltaCenter.x, this.state.deltaCenter.y, true);
                this.triggerNextUpdate = true;
            }

            this.animate(delta);
            if (this.triggerNextUpdate) {
                this.keepExtentsSquare();
                this.draw();
                this.triggerNextUpdate = false;
            }
            this.previous.center = this.state.center;
            this.previous.extents = this.state.extents;
            this.previous.startCenter = this.state.startCenter;
            this.previous.deltaCenter = this.state.deltaCenter;
            this.previous.dimensions = dims;
        };

        this.drawAxes = function () {
            var FLOAT_COMPENSATION = 8;

            var set = this.settings.axes, scaleSet = this.settings.scale,
                xOnTop = null,
                yOnRight = null,
                origin = this.getLocationOfCoordinate(new Vector2D(0)),
                bound = origin.clamp(
                    new Vector2D(set.margin.left,
                        set.margin.top),
                    new Vector2D(this.canvas.width - set.margin.right,
                        this.canvas.height - set.margin.bottom)
                );

            if (set.x.fixed == "auto") {
                if (origin.y > bound.y) xOnTop = false;
                else if (origin.y < bound.y) xOnTop = true;
            } else if (set.x.fixed != "none") xOnTop = (set.x.fixed == "top");

            if (set.y.fixed == "auto") {
                if (origin.x > bound.x) yOnRight = true;
                else if (origin.x < bound.x) yOnRight = false;
            } else if (set.x.fixed != "none") yOnRight = (set.y.fixed == "right");

            var xFixed = xOnTop != null,
                xOnBottom = xOnTop == false,
                yFixed = yOnRight != null,
                yOnLeft = yOnRight == false; // sidesteps yOnRight == null, where !yOnRight could also equal true

            var xstart = 0, xend = this.canvas.width;
            if (xFixed && !set.fixedIntersect) {
                xstart += yOnRight ? 0 : set.margin.left;
                xend -= yOnLeft ? 0 : set.margin.right;
            }

            var ystart = 0, yend = this.canvas.height;
            if (xFixed && !set.fixedIntersect) {
                ystart += xOnBottom ? 0 : set.margin.top;
                yend -= xOnTop ? 0 : set.margin.bottom;
            }

            var originX;
            if (yFixed)
                originX = yOnRight ? this.canvas.width - set.margin.right : set.margin.left;
            else originX = origin.x;

            var originY;
            if (xFixed)
                originY = xOnTop ? set.margin.top : this.canvas.height - set.margin.bottom;
            else originY = origin.y;

            // draw X axis
            this.helper.linePlot([
                new Vector2D(xstart, originY),
                new Vector2D(xend, originY)
            ], set.x.width, set.x.colour);

            // draw Y axis
            this.helper.linePlot([
                new Vector2D(originX, ystart),
                new Vector2D(originX, yend)
            ], set.y.width, set.y.colour);
            
            var plane = this;
            var drawXScale = function (mark, grid, label, minInterval, maxInterval) {
                var fact = plane.getFactor().x,
                    scale = plane.computeScale(fact, minInterval, maxInterval),
                    start = plane.getCoordinateFromLocation(new Vector2D(-(fact*scale), 0)).x,
                    end = plane.getCoordinateFromLocation(new Vector2D(plane.canvas.width + (fact*scale), 0)).x;
                start = Math.ceil(start/scale)*scale;
                end = Math.ceil(end/scale)*scale;

                for (var x=start;x<=end;x+=scale) {
                    var isValid = x.fixFloat(FLOAT_COMPENSATION) != 0;
                    if (!isValid && !yFixed) continue;

                    var loc = plane.getLocationOfCoordinate(new Vector2D(x, 0));
                    loc.y = originY;

                    if (grid != null) {
                        // draw grid lines
                        plane.helper.linePlot([
                            new Vector2D(loc.x, 0),
                            new Vector2D(loc.x, plane.canvas.height)
                        ], grid.width, grid.colour);
                    }
                    // draw scale marks
                    var halfLength = new Vector2D(0, mark.length/2);
                    plane.helper.linePlot([
                        loc.subtract(halfLength),
                        loc.add(halfLength)
                    ], mark.width, mark.colour);

                    if (label != null) {
                        var pos = label.xPosition;
                        if (pos == "auto")
                            pos = originY > (plane.canvas.height/2) ? "top" : "bottom";

                        var labelPos = loc.copy();
                        if (pos == 'top')
                            labelPos = labelPos.subtract(new Vector2D(0, label.offset.top));
                        else if (pos == 'bottom')
                            labelPos = labelPos.add(new Vector2D(0, label.offset.bottom));

                        plane.helper.write(x.toString(),
                            labelPos,
                            label.size + "px " + label.font,
                            label.colour,
                            "center",
                            "middle",
                            fact*scale - label.padding.left
                        );
                    }
                }
            }, drawYScale = function (mark, grid, label, minInterval, maxInterval) {
                var fact = plane.getFactor().y,
                    scale = plane.computeScale(fact, minInterval, maxInterval),
                    start = plane.getCoordinateFromLocation(new Vector2D(0, plane.canvas.height + (fact*scale))).y,
                    end = plane.getCoordinateFromLocation(new Vector2D(0, -(fact*scale))).y;
                start = Math.ceil(start/scale)*scale;
                end = Math.ceil(end/scale)*scale;

                for (var y=start;y<=end;y+=scale) {
                    var isValid = y.fixFloat(FLOAT_COMPENSATION) != 0;
                    if (!isValid && !xFixed) continue;

                    var loc = plane.getLocationOfCoordinate(new Vector2D(0, y));
                    loc.x = originX;

                    if (grid != null) {
                        // draw grid lines
                        plane.helper.linePlot([
                            new Vector2D(0, loc.y),
                            new Vector2D(plane.canvas.width, loc.y)
                        ], grid.width, grid.colour);
                    }
                    // draw scale marks
                    var halfLength = new Vector2D(mark.length/2, 0);
                    plane.helper.linePlot([
                        loc.subtract(halfLength),
                        loc.add(halfLength)
                    ], mark.width, mark.colour);

                    if (label != null) {
                        var pos = label.yPosition;
                        if (pos == "auto")
                            pos = originX > (plane.canvas.width/2) ? "left" : "right";

                        var labelPos = loc.copy(), textWidth = 0;
                        if (pos == "left") {
                            labelPos = labelPos.subtract(new Vector2D(label.offset.left, 0));
                            textWidth = set.margin.left - label.offset.left - label.padding.right;
                        } else if (pos == "right") {
                            labelPos = labelPos.add(new Vector2D(label.offset.right, 0));
                            textWidth = set.margin.right - label.offset.right - label.padding.left;
                        }

                        plane.helper.write(y.toString(),
                            labelPos,
                            label.size + "px " + label.font,
                            label.colour,
                            pos,
                            "middle",
                            textWidth
                        );
                    }
                }
            };

            // draw main X scale
            drawXScale(scaleSet.mark,
                scaleSet.grid.enabled ? scaleSet.grid : null,
                scaleSet.label,
                scaleSet.minInterval,
                scaleSet.maxInterval
            );

            // draw minor X scale
            drawXScale(scaleSet.minor,
                scaleSet.minor.grid ? scaleSet.minor : null,
                null,
                scaleSet.minor.minInterval,
                scaleSet.minor.maxInterval
            );

            // draw main Y scale
            drawYScale(scaleSet.mark,
                scaleSet.grid.enabled ? scaleSet.grid : null,
                scaleSet.label,
                scaleSet.minInterval,
                scaleSet.maxInterval
            );

            // draw minor Y scale
            drawYScale(scaleSet.minor,
                scaleSet.minor.grid ? scaleSet.minor : null,
                null,
                scaleSet.minor.minInterval,
                scaleSet.minor.maxInterval
            );


            // draw block margins
            if (xFixed && set.blockMargin) {
                var ylim = xOnTop ? 0 : this.canvas.height;
                this.$.globalCompositeOperation = "destination-over";
                this.helper.polygon([
                    new Vector2D(0, originY),
                    new Vector2D(0, ylim),
                    new Vector2D(this.canvas.width, ylim),
                    new Vector2D(this.canvas.width, originY)
                ], set.blockMarginColour);
                this.$.globalCompositeOperation = "source-over";
            }

            if (yFixed && set.blockMargin) {
                var xlim = yOnLeft ? 0 : this.canvas.width;
                this.$.globalCompositeOperation = "destination-over";
                this.helper.polygon([
                    new Vector2D(originX, 0),
                    new Vector2D(xlim, 0),
                    new Vector2D(xlim, this.canvas.height),
                    new Vector2D(originX, this.canvas.height)
                ], set.blockMarginColour);
                this.$.globalCompositeOperation = "source-over";
            }

        };

        this.draw = function () {
            this.helper.clear();

            this.drawAxes();
            for (var obj in this.objects) if (this.objects.hasOwnProperty(obj)) {
                this.objects[obj].draw(this);
            }
        }
    }
    CrtPlane3.prototype = Object.create(WideCanvas.prototype);

    $(document).on("pageload", function () {
        plane = new CrtPlane3($("#cplane")[0]);
    });
});
});
