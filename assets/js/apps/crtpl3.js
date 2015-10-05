var cplane;
var generateRandomColour;
(function () {
    var genHues = [];

    generateRandomColour = function (sat, val) {
        var hue, tries = 0, acceptableDiff = 50*Math.pow(0.9, genHues.length);
        do {
            hue = Math.floor(Math.random() * 360);
            var diffs = genHues.map(function (e) { return Math.abs(hue - e); });
            var minDiff = Math.min.apply(this, diffs);
        } while (minDiff < acceptableDiff && tries++ < 20);

        var c = new Colour();
        c.setHSV(hue, sat, val);
        genHues.push(hue);
        return c;
    };
})();

function PlaneNode() {
    this.id = generateUUID();
    this.visible = true;
    this.draw = function () {};
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
    this.style = style ? new Colour(style) : generateRandomColour(0.8, 0.8);
    this.start = isNull(start) ? null : start; // null = edge of screen for cartesian funcs
    this.end = isNull(end) ? null : end;
    this.resolution = 50; // inverse of parameter step
    this.draw = function (plane) {
        if (!plane.plugins.scale || !this.visible) return;
        var scalePlugin = plane.plugins.scale;

        var set = plane.settings.functions, scaleSet = scalePlugin.settings.scale;
        var threshold = set.threshold;
        var start, end, step, loc;
        var path = new SVGPathBuilder(plane.helper);

        function addCoord(coord) {
            loc = plane.getLocationOfCoordinate(coord);
            if (loc.clamp(threshold.negate(), threshold).equals(loc))
                path.append(loc);
            else path.close();
        }

        switch (this.func.type) {
            case "Cartesian":
                var factor = plane.getFactor();
                var scaleX = plane.computeScale(factor.x, scaleSet.minInterval, scaleSet.maxInterval);

                if (this.start == null) {
                    start = plane.getCoordinateFromLocation(new Vector2D(0 - (factor.x * scaleX), 0)).x;
                    start = Math.ceil(start/scaleX)*scaleX;
                } else start = this.start;

                if (this.end == null) {
                    end = plane.getCoordinateFromLocation(new Vector2D(plane.width + (factor.x * scaleX), 0)).x;
                    end = Math.ceil(end/scaleX)*scaleX;
                } else end = this.end;

                step = scaleX/this.resolution;

                for (var x=start;x<=end;x+=step)
                    addCoord(new Vector2D(x, func.eval(x)));
                addCoord(new Vector2D(end, func.eval(end)));

                break;
            case "Polar":
                start = this.start;
                end = this.end;
                step = Math.PI/this.resolution;

                for (var a=start;a<=end;a+=step)
                    addCoord(Vector2D.fromPolar(a, func.eval(a)));
                addCoord(Vector2D.fromPolar(end, func.eval(end)));

                break;
            case "Parametric":
                start = this.start;
                end = this.end;
                step = Math.PI/this.resolution;

                for (var t=start;t<=end;t+=step)
                    addCoord(func.eval(t));
                addCoord(func.eval(end));

                break;
            default:
                break;
        }

        //plane.$.globalCompositeOperation = "destination-over";
        //plane.helper.linePlot(plot, this.width, this.style);
        //plane.$.globalCompositeOperation = "source-over";
        var plot = path.apply([this.id, "func"].join(" "), "functions");
        plot.style.stroke = this.style.toHex();

        plane.helper.appendGroup("functions");
    }
}
FunctionNode.prototype = Object.create(PlaneNode.prototype);

var PlotTypes = {"line": "line", "scatter": "scatter"};

function PlotNode(plot, type, style) {
    PlaneNode.call(this);
    this.plot = plot;
    this.type = type || "line";
    this.style = style ? new Colour(style) : generateRandomColour(0.8, 0.8);
    this.width = 2;
    this.draw = function (plane) {
        if (!this.visible) return;
        var threshold = plane.settings.functions.threshold;

        var path;
        switch (this.type) {
            case "scatter":
                path = new SVGPathCollectionBuilder(plane.helper, function (builder, coord) {
                    var locs = [
                        new Vector2D(4, 4),
                        new Vector2D(-4, 4),
                        new Vector2D(4, -4),
                        new Vector2D(-4, -4)
                    ];
                    locs.forEach(function (e) {
                        builder.move(coord);
                        builder.line(e, true);
                    });
                }, function (path) {
                    path.style.stroke = this.style;
                }, "cross", this.id);

                this.plot.forEach(function (e) {
                    var loc = plane.getLocationOfCoordinate(e);
                    if (loc.clamp(threshold.negate(), threshold).equals(loc))
                        path.append(loc);
                });

                break;
            case "line":
            default:
                path = new SVGPathBuilder(plane.helper);

                this.plot.forEach(function (e) {
                    var loc = plane.getLocationOfCoordinate(e);
                    if (loc.clamp(threshold.negate(), threshold).equals(loc))
                        path.append(loc);
                    else path.close();
                });

                var plot = path.apply([this.id, "plot"].join(" "), "plots");
                plot.style.stroke = this.style;
        }

        plane.helper.appendGroup("plots");
    }
}
PlotNode.prototype = Object.create(PlaneNode.prototype);

function CrtPlanePlugin(config) {
    var noop = function () {},
        self = this;

    this.config = config;
    this.name = config.name;
    this.settings = config.settings || {};
    this.draw = function (plane) {
        return (config.draw || noop)(plane, self);
    };
    this.update = function (plane) {
        return (config.update || noop)(plane, self);
    };
    this.tick = function (plane) {
        return (config.tick || noop)(plane, self);
    };
    this.creation = function (plane) {
        return (config.creation || noop)(plane, self);
    };

    var pub = config.iface || {};

    for (var prop in pub) if (pub.hasOwnProperty(prop))
        this[prop] = pub[prop];
}

$(function () {
Require([
    "/assets/js/tblib/base.js",
    "/assets/js/tblib/util.js",
    "/assets/js/tblib/loader.js",
    "/assets/js/tblib/math.js",
    "/assets/js/tblib/ui.js"
], function () {

    function CrtPlane3(svg, parent) {
        if (isNull(parent)) parent = $(svg).parent()[0];
        WideSVG.call(this, svg, parent);
        this.settings = {
            functions: {
                threshold: new Vector2D(4e3, 2e3)
            }
        };
        this.plugins = {

        };
        this.objects = {

        };
        this.state = {
            center: new Vector2D(0, 0),
            extents: new Vector2D(32, 18),
            dimensions: new Vector2D(0, 0)
        };
        this.previous = {

        };
        this.triggerNextUpdate = true;

        this.addPlugin = function (plugin) {
            if (isNull(plugin)) return this;
            this.plugins[plugin.name] = plugin;

            var currSettings = Object.copy(this.settings);
            this.updateSettings(plugin.settings, "settings");
            this.updateSettings(currSettings, "settings");

            var currState = Object.copy(this.state);
            this.updateSettings(plugin.state, "state");
            this.updateSettings(currState, "state");

            this.updateSettings(plugin.config.iface);

            this.addEventHandler("update", plugin.update);
            this.addEventHandler("tick", plugin.tick);
            this.addEventHandler("draw", plugin.draw);
            plugin.creation(this);

            return this;
        };
        this.addObject = function (constructor) {
            var node = new (constructor.bind.apply(constructor, arguments));
            this.objects[node.id] = node;
            this.triggerNextUpdate = true;
            this.triggerEvent("new-object", node);
            return this;
        };

        this.getProperty = function (property) {
            var propTree = property.split(".");
            for (var i=0,c=this;i<propTree.length-1;i++) {
                c = c[propTree[i]];
                if (c === undefined) return null;
            }
            return c[propTree[propTree.length-1]];
        };
        this.setProperty = function (property, value, ignore) {
            var propTree = property.split(".");
            for (var i=0,c=this;i<propTree.length-1;i++) {
                c = c[propTree[i]];
                if (c === undefined) return null;
            }
            c[propTree[propTree.length-1]] = value;
            if (!ignore) this.triggerNextUpdate = true;
        };

        this.updateSettings = function (obj, name, ignore) {
            if (!isNull(name)) name += ".";
            else name = "";

            for (var prop in obj) if (obj.hasOwnProperty(prop)) {
                if (!isNull(this.getProperty(name+prop)) && typeof(obj[prop]) == "object") {
                    if (obj[prop].constructor == Object)
                        this.updateSettings(obj[prop], name+prop, ignore);
                    else if (typeof(obj[prop].copy) == "function")
                        this.setProperty(name+prop, obj[prop].copy(), ignore);
                    else
                        this.setProperty(name+prop, obj[prop], ignore);
                } else this.setProperty(name+prop, obj[prop], ignore);
            }
            return this;
        };

        this.getFactor = function () { return new Vector2D(this.width, this.height).divide(this.state.extents); };
        this.getLocationOfCoordinate = function (coord) { return this.helper.getLocationOfCoordinate(coord, this.state.extents, this.state.center); };
        this.getCoordinateFromLocation = function (loc) { return this.helper.getCoordinateFromLocation(loc, this.state.extents, this.state.center); };

        this.loop = function (delta) {
            var dims = new Vector2D(this.width, this.height);
            this.state.dimensions = dims;
            if (isNull(this.previous.dimensions) || !this.previous.dimensions.equals(dims))
                this.triggerNextUpdate = true;

            this.triggerEvent("tick", delta);
            if (this.triggerNextUpdate) {
                this.triggerEvent("update");
                this.draw();
                this.triggerNextUpdate = false;
            }
            this.updateSettings(this.state, "previous", true);
        };

        this.draw = function () {
            this.helper.clear();

            for (var obj in this.objects) if (this.objects.hasOwnProperty(obj)) {
                this.objects[obj].draw(this);
            }

            this.triggerEvent("draw");
        }
    }
    CrtPlane3.prototype = Object.create(WideSVG.prototype);
    CrtPlane3.MasterSettings = {
        scale: {
            minor: {
                minInterval: 25,
                maxInterval: 35
            },
            minInterval: 75,
            maxInterval: 110
        }
    };

    var plugins = {};
    function loadPlugin(pluginName) {
        loader.addTask(function (resolve) {
            require("/assets/js/apps/crtpl3-"+pluginName+".js", function (plugin) {
                plugins[plugin.name] = plugin;
                resolve();
            });
        });
    }

    loadPlugin("scale");
    loadPlugin("anim");
    loadPlugin("nav");
    loader.start();

    PlotTypes = new Enum("line", "scatter");

    $(document).on("pageload", function () {
        cplane = new CrtPlane3(gebi("main-plane"))
            .addPlugin(plugins.scale)
            .addPlugin(plugins.animation)
            .addPlugin(plugins.navigation)
            .updateSettings(CrtPlane3.MasterSettings, "settings");

        cplane.addEventHandler("update", function () {
            var select = $(".object-list")[0];
            var selection = $(select).val();
            $(select).removeClass("done");
            $(select).empty();
            for (var obj in cplane.objects) if (cplane.objects.hasOwnProperty(obj)) {
                var option = document.createElement("option");
                    var o = cplane.objects[obj];
                    if (o.name) option.textContent = o.name;
                    else if (o.func) option.innerHTML = o.func.toString(true);
                    else if (o.plot) option.innerHTML = o.plot.toString();
                    else option.innerHTML = o.id;

                    option.value = o.id;
                select.appendChild(option);
            }
            $(select).val(selection);
            TBI.UI.updateUI();
        });

        $("button[data-icon-src]").each(function () {
            var self = $(this);

            var src = self.attr("data-icon-src");
            $.ajax({
                url: src,
                success: function (response) {
                    self[0].appendChild(response.documentElement);
                }
            });
        });

        function bindToPlane(query, evt, planeEvt) {
            if (isNull(planeEvt)) planeEvt = evt;
            $(query).on(evt, function (event) {
                cplane.triggerEvent(planeEvt, event);
            });
        }

        bindToPlane("#main-plane", "mousedown");
        bindToPlane("#main-plane", "mouseup");
        bindToPlane("#main-plane", "mousemove");

        $(".object-list").change(function () {
            if ($(this).val() != "-") $(".fn-defined-only").show();
            else $(".fn-defined-only").hide();
        });

        $(".return-to-origin").click(function () {
            cplane.addAnimation("state.center", Vector2D.zero);
        });

        $(".zoom-in").click(function () {
            var set = cplane.settings.controls;
            cplane.zoom(1/set.buttonZoomFactor);
        });
        $(".zoom-out").click(function () {
            var set = cplane.settings.controls;
            cplane.zoom(set.buttonZoomFactor);
        })
    });
});
});
