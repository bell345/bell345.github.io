/**
 * Created by Thomas on 2015-10-04.
 */
var crtpl3_scalePlugin = module.exports = new CrtPlanePlugin({
    name: "scale",
    settings: {
        axes: {
            x: {
                enabled: true,
                fixed: "auto" // modes: none, auto, top, bottom
            },
            y: {
                enabled: true,
                fixed: "auto" // modes: none, auto, left, right
            },
            fixedIntersect: false,
            margin: new DirectionQuantity(60, 75),
            blockMargin: true,
            blockMarginColour: ""
        },
        scale: {
            enabled: true,
            mark: {
                length: 20
            },
            label: {
                enabled: true,
                offset: new DirectionQuantity(30, 24),
                padding: new DirectionQuantity(6),
                xPosition: "auto",
                yPosition: "auto"
            },
            grid: true,
            minor: {
                enabled: true,
                length: 12,
                grid: false,
                minInterval: 45,
                maxInterval: 70
            },
            minInterval: 135,
            maxInterval: 170,
            fitToMax: true
        }
    },
    iface: {
        computeScale: function (factor, min, max) {
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
            decreaseScale();
            increaseScale();
            return scale;
        }
    },
    draw: function (plane, plugin) {
        var FLOAT_COMPENSATION = 8;

        var set = plugin.settings.axes, scaleSet = plugin.settings.scale,
            xOnTop = null,
            yOnRight = null,
            origin = plane.getLocationOfCoordinate(new Vector2D(0)),
            bound = origin.clamp(
                new Vector2D(set.margin.left,
                    set.margin.top),
                new Vector2D(plane.width - set.margin.right,
                    plane.height - set.margin.bottom)
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

        var xstart = 0, xend = plane.width;
        if (yFixed && !set.fixedIntersect) {
            xstart += yOnRight ? 0 : set.margin.left;
            xend -= yOnLeft ? 0 : set.margin.right;
        }

        var ystart = 0, yend = plane.height;
        if (xFixed && !set.fixedIntersect) {
            ystart += xOnBottom ? 0 : set.margin.top;
            yend -= xOnTop ? 0 : set.margin.bottom;
        }

        var originX;
        if (yFixed)
            originX = yOnRight ? plane.width - set.margin.right : set.margin.left;
        else originX = origin.x;

        var originY;
        if (xFixed)
            originY = xOnTop ? set.margin.top : plane.height - set.margin.bottom;
        else originY = origin.y;

        var inMargin = function (pos) {
            if (set.fixedIntersect) return false;

            if (xFixed) {
                if (xOnTop && pos.y < originY) return true;
                if (xOnBottom && pos.y > originY) return true;
            }
            if (yFixed) {
                if (yOnRight && pos.x > originX) return true;
                if (yOnLeft && pos.x < originX) return true;
            }
            return false;
        };

        var drawXScale = function (mark, grid, label, minInterval, maxInterval, minor) {
                var fact = plane.getFactor().x,
                    scale = plugin.computeScale(fact, minInterval, maxInterval),
                    start = plane.getCoordinateFromLocation(new Vector2D(-(fact*scale), 0)).x,
                    end = plane.getCoordinateFromLocation(new Vector2D(plane.width + (fact*scale), 0)).x;
                start = (Math.ceil(start/scale)*scale).fixFloat(FLOAT_COMPENSATION);
                end = Math.ceil(end/scale)*scale;
                var m = minor ? "minor-" : "";

                for (var x=start;x<=end;x+=scale) {
                    x = x.fixFloat(FLOAT_COMPENSATION);
                    var isValid = x != 0;
                    if (!isValid && !xFixed) continue;

                    var loc = plane.getLocationOfCoordinate(new Vector2D(x, 0));
                    loc.y = originY;

                    if (inMargin(loc)) continue;

                    if (grid) {
                        // draw grid lines
                        plane.helper.linePlot([
                            new Vector2D(loc.x, 0),
                            new Vector2D(loc.x, plane.height)
                        ], m + "grid-line", "x-scale-grid");
                    }
                    // draw scale marks
                    var halfLength = new Vector2D(0, mark.length/2);
                    plane.helper.linePlot([
                        loc.subtract(halfLength),
                        loc.add(halfLength)
                    ], m + "scale-mark", "x-scale-marks");

                    if (label != null) {
                        var pos = label.xPosition;
                        if (pos == "auto")
                            pos = originY < (plane.height/2 + 12) ? "top" : "bottom";

                        var labelPos = loc.copy();
                        if (pos == 'top')
                            labelPos = labelPos.subtract(new Vector2D(0, label.offset.top));
                        else if (pos == 'bottom')
                            labelPos = labelPos.add(new Vector2D(0, label.offset.bottom));

                        // There's one problem with the SVG implementation:
                        // fillText's width parameter is hard to replicate,
                        // so I'll just leave plane here (the width parameter):
                        // var width = fact*scale - label.padding.left;
                        var text = plane.helper.write(x.toString(),
                            labelPos, m + "scale-label", "x-scale-labels");
                        text.style.textAnchor = "middle";
                        text.style.dominantBaseline = "middle";
                    }
                }
            },
            drawYScale = function (mark, grid, label, minInterval, maxInterval, minor) {
                var fact = plane.getFactor().y,
                    scale = plugin.computeScale(fact, minInterval, maxInterval),
                    start = plane.getCoordinateFromLocation(new Vector2D(0, plane.height + (fact*scale))).y,
                    end = plane.getCoordinateFromLocation(new Vector2D(0, -(fact*scale))).y;
                start = (Math.ceil(start/scale)*scale).fixFloat(FLOAT_COMPENSATION);
                end = Math.ceil(end/scale)*scale;
                var m = minor ? "minor-" : "";

                for (var y=start;y<=end;y+=scale) {
                    y = y.fixFloat(FLOAT_COMPENSATION);
                    var isValid = y != 0;
                    if (!isValid && !yFixed) continue;

                    var loc = plane.getLocationOfCoordinate(new Vector2D(0, y));
                    loc.x = originX;

                    if (inMargin(loc)) continue;

                    if (grid) {
                        // draw grid lines
                        plane.helper.linePlot([
                            new Vector2D(0, loc.y),
                            new Vector2D(plane.width, loc.y)
                        ], m + "grid-line", "y-scale-grid");
                    }
                    // draw scale marks
                    var halfLength = new Vector2D(mark.length/2, 0);
                    plane.helper.linePlot([
                        loc.subtract(halfLength),
                        loc.add(halfLength)
                    ], m + "scale-mark", "y-scale-marks");

                    if (label != null) {
                        var pos = label.yPosition;
                        if (pos == "auto")
                            pos = originX < (plane.width/2 + 12) ? "left" : "right";

                        var labelPos = loc.copy(), textWidth = 0, textAlign = "middle";
                        if (pos == "left") {
                            labelPos = labelPos.subtract(new Vector2D(label.offset.left, 0));
                            textWidth = set.margin.left - label.offset.left - label.padding.right;
                            textAlign = "end";
                        } else if (pos == "right") {
                            labelPos = labelPos.add(new Vector2D(label.offset.right, 0));
                            textWidth = set.margin.right - label.offset.right - label.padding.left;
                            textAlign = "start";
                        }

                        var text = plane.helper.write(y.toString(),
                            labelPos, m + "scale-label", "y-scale-labels");
                        text.style.textAnchor = textAlign;
                        text.style.dominantBaseline = "middle";

                    }
                }
            };

        // draw main X scale
        drawXScale(scaleSet.mark,
            scaleSet.grid,
            scaleSet.label.enabled ? scaleSet.label : null,
            scaleSet.minInterval,
            scaleSet.maxInterval
        );

        // draw minor X scale
        if (scaleSet.minor.enabled) drawXScale(scaleSet.minor,
            scaleSet.minor.grid,
            null,
            scaleSet.minor.minInterval,
            scaleSet.minor.maxInterval,
            true
        );

        // draw main Y scale
        drawYScale(scaleSet.mark,
            scaleSet.grid,
            scaleSet.label.enabled ? scaleSet.label : null,
            scaleSet.minInterval,
            scaleSet.maxInterval
        );

        // draw minor Y scale
        if (scaleSet.minor.enabled) drawYScale(scaleSet.minor,
            scaleSet.minor.grid,
            null,
            scaleSet.minor.minInterval,
            scaleSet.minor.maxInterval,
            true
        );


        // draw block margins
        if (xFixed && set.blockMargin) {
            var ylim = xOnTop ? 0 : plane.height;
            plane.helper.polygon([
                new Vector2D(0, originY),
                new Vector2D(0, ylim),
                new Vector2D(plane.width, ylim),
                new Vector2D(plane.width, originY)
            ], "block-margin", "x-scale-margin");
        }

        if (yFixed && set.blockMargin) {
            var xlim = yOnLeft ? 0 : plane.width;
            plane.helper.polygon([
                new Vector2D(originX, 0),
                new Vector2D(xlim, 0),
                new Vector2D(xlim, plane.height),
                new Vector2D(originX, plane.height)
            ], "block-margin", "y-scale-margin");
        }

        // draw X axis
        plane.helper.linePlot([
            new Vector2D(xstart, originY),
            new Vector2D(xend, originY)
        ], "axis", "x-scale-axis");

        // draw Y axis
        plane.helper.linePlot([
            new Vector2D(originX, ystart),
            new Vector2D(originX, yend)
        ], "axis", "y-scale-axis");

        ["grid", "margin", "axis", "marks", "labels"].forEach(function (e) {
            plane.helper.appendGroup("x-scale-"+e, "scale");
            plane.helper.appendGroup("y-scale-"+e, "scale");
        });
        plane.helper.appendGroup("scale");
    }
});
