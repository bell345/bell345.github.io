/**
 * Created by Thomas on 2015-10-05.
 */
var panTimeout = null;
var crtpl3_navPlugin = module.exports = new CrtPlanePlugin({
    name: "navigation",
    settings: {
        controls: {
            scrollZoomFactor: 1.3,
            buttonZoomFactor: 1.6,
            zoomTimeout: 600,
            minExtents: new Vector2D(5e-5),
            maxExtents: new Vector2D(1e10),
            panTimeout: 400,
            // possible values: square, x-fixed, y-fixed, free
            mode: "square"
        },
        animation: {
            durations: {
                zoom: 300
            }
        }
    },
    iface: {
        state: {
            deltaCenter: new Vector2D(0, 0)
        },
        zoom: function (factor) {
            var plane = this;
            var set = plane.settings.controls, animSet = plane.settings.animation;
            var futureExtents = plane.state.extents.multiply(factor);

            var clampd = futureExtents.clamp(set.minExtents, set.maxExtents);
            if (set.mode == "x-fixed") clampd.x = plane.state.extents.x;
            else if (set.mode == "y-fixed") clampd.y = plane.state.extents.y;

            if (plane.plugins.animation)
                plane.addAnimation("state.extents", clampd, animSet.durations.zoom);
            else
                plane.state.extents = clampd;
            /*if (!set.fixedZoom && futureExtents.equals(clampd))
                plane.addAnimation("state.center",
                    plane.state.center.multiply(factor),
                    animSet.durations.zoom
                );*/
        },
        keepExtentsSquare: function () {
            var plane = this;
            var extents = plane.state.extents;
            var ratio = plane.width / plane.height;
            if ((extents.x / extents.y).fixFloat(2) == ratio.fixFloat(2)) return;

            //extents.x = extents.y * ratio;
            extents.y = extents.x / ratio;
            this.state.extents = extents;
            this.triggerNextUpdate = true;
        }
    },
    tick: function (plane) {
        if (isNull(plane.previous.deltaCenter) ||
            !plane.previous.deltaCenter.equals(plane.state.deltaCenter))
            moveWithTransforms(plane.svg,
                plane.state.deltaCenter.x,
                plane.state.deltaCenter.y,
                true
            );

        plane.previous.deltaCenter = plane.state.deltaCenter.copy();
    },
    update: function (plane) {
        if (plane.settings.controls.mode == "square")
            plane.keepExtentsSquare();
    },
    creation: function (plane) {
        plane.addEventHandler("mousedown", function (plane, event) {
            if (event.which != 1) return;
            var center = plane.state.center;
            if (panTimeout instanceof TBI.Timer && !panTimeout.completed) {
                panTimeout.finish();
                panTimeout = null;
            }
            plane.previous.mouseDown = new Vector2D(event.clientX, event.clientY);
            plane.previous.startCenter = center;
        });

        plane.addEventHandler("mouseup", function (plane, event) {
            plane.previous.mouseDown = null;
            plane.previous.startCenter = null;
        });

        plane.addEventHandler("mousemove", function (plane, event) {
            var mdown = plane.previous.mouseDown;
            var startCenter = plane.previous.startCenter;
            if (!isNull(mdown) && !isNull(startCenter)) {
                var c = plane.helper.correctCoordinate;
                var diff = c(mdown.subtract(new Vector2D(event.clientX, event.clientY)));
                plane.state.deltaCenter = c(diff).negate();
                var newCenter = startCenter.add(diff.divide(plane.getFactor()));

                if (panTimeout instanceof TBI.Timer) panTimeout.clear();
                panTimeout = new TBI.Timer(function () {
                    plane.state.deltaCenter = Vector2D.zero;
                    plane.state.center = newCenter;
                    if (!isNull(plane.previous.mouseDown) && !isNull(plane.previous.startCenter)) {
                        plane.previous.mouseDown = new Vector2D(event.clientX, event.clientY);
                        plane.previous.startCenter = newCenter;
                    }
                    plane.triggerNextUpdate = true;
                }, plane.settings.controls.panTimeout, false);
            }
        });
    }
});
