var cplane, dialogWM, toolWM;
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

function MathJSFunction(expr, scope) {
    this.expr = expr;
    this.node = math.parse(expr);
    this.compiledNode = this.node.compile();
    this.scope = scope || {};
    this.className = "MathJSFunction";
    this.type = "cartesian";
    this.variables = [];
    if (scope) for (var prop in scope) if (scope.hasOwnProperty(prop)) {
        this.variables.push(prop);
    }
}
MathJSFunction.prototype.eval = function (v) {
    return this.compiledNode.eval(this.scope)(v);
};
MathJSFunction.prototype.get = function (variableName) {
    return this.scope[variableName];
};
MathJSFunction.prototype.set = function (variableName, v) {
    this.scope[variableName] = v;
};
MathJSFunction.prototype.serialise = function () {
    return {
        expr: this.expr,
        scope: this.scope,
        className: this.className
    };
};
MathJSFunction.deserialise = function (obj) {
    return new MathJSFunction(obj.expr, obj.scope);
};
MathJSFunction.prototype.toString = function () {
    return this.node.toString().replaceAll(/ *function +/g, "")
        .replaceAll(/ +/g, "")
        .replaceAll(/([+\-=])/g, " $1 ")
        .replaceAll(/([,])/g, "$1 ");
};

function MathJSPolarFunction(expr, scope) {
    MathJSFunction.call(this, expr, scope);
    this.className = "MathJSPolarFunction";
    this.type = "polar";
}
MathJSPolarFunction.prototype = Object.create(MathJSFunction.prototype);
MathJSPolarFunction.prototype.constructor = MathJSPolarFunction;
MathJSPolarFunction.deserialise = function (obj) {
    return new MathJSPolarFunction(obj.expr, obj.scope);
};

function MathJSParametricFunction(exprX, exprY, scope) {
    this.exprX = exprX;
    this.exprY = exprY;
    var expr = "f(t) = [" + exprX + ", " + exprY + "]";
    MathJSFunction.call(this, expr, scope);
    this.compiledNode = this.node.compile();
    this.className = "MathJSParametricFunction";
    this.type = "parametric";
}
MathJSParametricFunction.prototype = Object.create(MathJSFunction.prototype);
MathJSParametricFunction.prototype.constructor = MathJSParametricFunction;
MathJSParametricFunction.prototype.eval = function (v) {
    var data = this.compiledNode.eval(this.scope)(v)._data;
    return new Vector2D(data[0], data[1]);
};
MathJSParametricFunction.prototype.serialise = function () {
    return {
        exprX: this.exprX,
        exprY: this.exprY,
        scope: this.scope,
        className: this.className
    };
};
MathJSParametricFunction.deserialise = function (obj) {
    return new MathJSParametricFunction(obj.exprX, obj.exprY, obj.scope);
};

function PlaneNode() {
    this.id = generateUUID();
    this.name = "";
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
    this.derivative = {
        visible: false,
        style: null
    };
    this.integral = {
        visible: false,
        style: null
    };
    this.draw = function (plane) {
        try {
            this.func.eval(2);
        } catch (e) {
            TBI.error("Function error: " + e.message);
            this.visible = false;
        }
        if (!plane.plugins.scale || !this.visible) return;
        var scalePlugin = plane.plugins.scale,
            self = this;

        var set = plane.settings.functions, scaleSet = scalePlugin.settings.scale;
        var threshold = set.threshold;
        var start, end, step, loc;
        var path = new SVGPathBuilder(plane.helper),
            derivativePath = new SVGPathBuilder(plane.helper),
            integralPath = new SVGPathBuilder(plane.helper);

        function isValid(loc) {
            return loc.clamp(threshold.negate(), threshold).equals(loc);
        }

        var lastCoord;
        function addCoord(coord) {
            loc = plane.getLocationOfCoordinate(coord);
            if (isValid(loc))
                path.append(loc);
            else path.close();
            if (self.integral.visible) {
                if (isNull(lastCoord))
                    integralPath.append(
                        plane.getLocationOfCoordinate(
                            new Vector2D(coord.x, 0)));

                if (isValid(loc))
                    integralPath.append(loc);
                else if (!isNull(lastCoord))
                    integralPath.append(
                        plane.getLocationOfCoordinate(
                            new Vector2D(lastCoord.x, 0)));
            }
            if (self.derivative.visible && !isNull(lastCoord)) {
                var rise = coord.y - lastCoord.y,
                    run = coord.x - lastCoord.x;
                loc = plane.getLocationOfCoordinate(new Vector2D(
                    (coord.x + lastCoord.x) / 2,
                    rise / run
                ));
                if (isValid(loc))
                    derivativePath.append(loc);
                else derivativePath.close();
            }

            lastCoord = coord;
        }

        switch (this.func.type.toLowerCase()) {
            case "cartesian":
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
                    addCoord(new Vector2D(x, this.func.eval(x)));
                addCoord(new Vector2D(end, this.func.eval(end)));

                break;
            case "polar":
                this.start = start = this.start || -16;
                this.end = end = this.end || 16;
                step = 1/this.resolution;

                start *= Math.PI;
                end *= Math.PI;
                step *= Math.PI;

                for (var a=start;a<=end;a+=step)
                    addCoord(Vector2D.fromPolar(a, this.func.eval(a)));
                addCoord(Vector2D.fromPolar(end, this.func.eval(end)));

                break;
            case "parametric":
                this.start = start = this.start || -16;
                this.end = end = this.end || 16;
                step = 1/this.resolution;

                start *= Math.PI;
                end *= Math.PI;
                step *= Math.PI;

                for (var t=start;t<=end;t+=step)
                    addCoord(this.func.eval(t));
                addCoord(this.func.eval(end));

                break;
            default:
                break;
        }

        //plane.$.globalCompositeOperation = "destination-over";
        //plane.helper.linePlot(plot, this.width, this.style);
        //plane.$.globalCompositeOperation = "source-over";
        var plot = path.apply([this.id, "func"].join(" "), "functions");
        plot.style.stroke = this.style.toRGBA();

        if (this.derivative.visible) {
            var dplot = derivativePath.apply([this.id, "derivative"].join(" "), "functions");
            dplot.style.stroke = isNull(this.derivative.style) ?
                this.style.toRGBA() :
                this.derivative.style.toRGBA();
        }
        if (this.integral.visible) {
            if (lastCoord)
                integralPath.append(
                    plane.getLocationOfCoordinate(
                        new Vector2D(lastCoord.x, 0)));
            integralPath.close(true);

            var iplot = integralPath.apply([this.id, "integral"].join(" "), "functions");
            iplot.style.stroke = "transparent";
            iplot.style.fill = isNull(this.integral.style) ?
                this.style.toRGBA() :
                this.integral.style.toRGBA();
        }

        plane.helper.appendGroup("functions");
    };
    this.serialise = function () {
        var obj = {
            id: this.id,
            visible: this.visible,
            start: this.start,
            end: this.end,
            style: this.style.toRGBA(),
            resolution: this.resolution,
            derivative: {
                visible: this.derivative.visible,
                style: this.derivative.style ? this.derivative.style.toRGBA() : null
            },
            integral: {
                visible: this.integral.visible,
                style: this.integral.style ? this.integral.style.toRGBA() : null
            },
            func_type: this.func.type.toLowerCase(),
            className: this.func.className,
            variables: {}
        };

        var self = this;
        if (this.func.variables) this.func.variables.forEach(function (e) {
            obj.variables[e] = self.func.scope[e];
        });
        if (this.func.serialise)
            obj.func = this.func.serialise();
        else obj.func = objectToInputs(this, true);
        return JSON.stringify(obj);
    };
}
FunctionNode.prototype = Object.create(PlaneNode.prototype);
FunctionNode.prototype.constructor = FunctionNode;
FunctionNode.deserialise = function (str) {
    var obj = JSON.parse(str);
    var func;
    if (obj.className && window[obj.className]
        && typeof(window[obj.className].deserialise) == "function") {
        func = window[obj.className].deserialise(obj.func);
    }

    if (isNull(func)) {
        var funcstr = null;
        if (!isNull(obj.func[0]) && obj.func[0].search(/^f\([A-Za-z]\) *= */) != -1)
            funcstr = obj.func[0];

        switch (obj.func_type) {
            case "cartesian":
                func = new MathJSFunction(funcstr || "f(x) = " + obj.func[0], obj.variables);
                break;
            case "polar":
                func = new MathJSPolarFunction(funcstr || "f(a) = " + obj.func[0], obj.variables);
                break;
            case "parametric":
                func = new MathJSParametricFunction(obj.func[0], obj.func[1], obj.variables);
                break;
            default:
                func = null;
        }
    }

    if (isNull(func)) return;
    var node = new FunctionNode(func, obj.style, obj.start, obj.end);
    node.id = obj.id || generateUUID();
    node.visible = isNull(obj.visible) ? true : obj.visible;
    node.resolution = obj.resolution;
    node.derivative = {
        visible: obj.derivative.visible,
        style: obj.derivative.style ? new Colour(obj.derivative.style) : null
    };
    node.integral = {
        visible: obj.integral.visible,
        style: obj.integral.style ? new Colour(obj.integral.style) : null
    };
    return node;
};

var PlotTypes = {"line": "line", "scatter": "scatter"};

function PlotNode(plot, type, style) {
    PlaneNode.call(this);
    this.plot = plot.map(function (o) {
        if (o instanceof Vector2D)
            return o;
        else if (o.length && o.length == 2)
            return new Vector2D(o[0], o[1]);
        else if (!isNull(o['x']) && !isNull(o['y']))
            return new Vector2D(o.x, o.y);
    });
    this.type = type || "line";
    this.style = style ? new Colour(style) : generateRandomColour(0.8, 0.8);
    this.closed = false;
    this.matrix = [[1,0],[0,1]];

    this.draw = function (plane) {
        if (!this.visible) return;
        var threshold = plane.settings.functions.threshold;

        var path, self = this;
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
                    builder.close();
                }, function (path) {
                    path.style.stroke = self.style.toRGBA();
                }, [this.id, "plot"].join(" "), "plots");

                this.plot.forEach(function (e) {
                    var image = new Vector2D(0, 0);
                    image.x = self.matrix[0][0] * e.x
                            + self.matrix[0][1] * e.y;
                    image.y = self.matrix[1][0] * e.x
                            + self.matrix[1][1] * e.y;

                    var loc = plane.getLocationOfCoordinate(image);
                    if (loc.clamp(threshold.negate(), threshold).equals(loc))
                        path.append(loc);
                });

                break;
            case "line":
            default:
                path = new SVGPathBuilder(plane.helper);

                this.plot.forEach(function (e) {
                    var image = new Vector2D(0, 0);
                    image.x = self.matrix[0][0] * e.x
                            + self.matrix[0][1] * e.y;
                    image.y = self.matrix[1][0] * e.x
                            + self.matrix[1][1] * e.y;

                    var loc = plane.getLocationOfCoordinate(image);
                    if (loc.clamp(threshold.negate(), threshold).equals(loc))
                        path.append(loc);
                    else path.close();
                });
                path.close(self.closed);

                var plot = path.apply([this.id, "plot"].join(" "), "plots");
                plot.style.stroke = this.style.toRGBA();
        }

        plane.helper.appendGroup("plots");
    };
    this.serialise = function () {
        var obj = {
            id: this.id,
            name: this.name,
            visible: this.visible,
            plot: this.plot,
            type: this.type,
            style: this.style.toRGBA(),
            closed: this.closed,
            matrix: this.matrix
        };
        return JSON.stringify(obj);
    };
}
PlotNode.prototype = Object.create(PlaneNode.prototype);
PlotNode.prototype.constructor = PlotNode;
PlotNode.deserialise = function (str) {
    var obj = JSON.parse(str);
    var node = new PlotNode(obj.plot, obj.type, obj.style);
    node.id = obj.id;
    node.visible = obj.visible;
    node.closed = obj.closed;
    node.name = obj.name;
    node.matrix = [[1,0],[0,1]];
    if (!isNull(obj.matrix) && !isNull(obj.matrix[0]) && !isNull(obj.matrix[1])) {
        node.matrix = obj.matrix;
    }

    return node;
};

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

var objectToInputs;
$(function () {
Require([
    "/assets/js/tblib/base.js",
    "/assets/js/tblib/util.js",
    "/assets/js/tblib/loader.js",
    "/assets/js/tblib/math.js",
    "/assets/js/tblib/ui.js",
    "/assets/js/jswm2.js",
    "/assets/js/math.min.js"
], function () {


    function CrtPlane3(svg, parent) {
        if (isNull(parent)) parent = $(svg).parent()[0];
        WideSVG.call(this, svg, parent);
        this.settings = {
            functions: {
                threshold: new Vector2D(4e4, 2e4)
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
                this.triggerEvent("post-update");
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
    loadPlugin("persist");
    loader.start();

    PlotTypes = new Enum("line", "scatter");

    $(document).on("pageload", function () {
        cplane = new CrtPlane3(gebi("main-plane"))
            .addPlugin(plugins["scale"])
            .addPlugin(plugins["animation"])
            .addPlugin(plugins["navigation"])
            .addPlugin(plugins["persistency"]);

        dialogWM = new JSWM($(".dialog-container")[0]);
        toolWM = new JSWM($(".tool-container")[0]);

        if (!isNull(localStorage.getItem("crtpl3-save")))
            cplane.load(localStorage.getItem("crtpl3-save"));
        else {
            cplane.updateSettings(CrtPlane3.MasterSettings, "settings");
            var demoObjects = [
                new MathJSFunction("f(x) = 3x^3 + (1/5)x^2 - 3x - 2"),
                //new RelationFunc(2, 3, 10),
                new MathJSFunction("f(x) = sin(x)"),
                new MathJSFunction("f(x) = 2^x"),
                new MathJSPolarFunction("f(a) = 2sin(4a)"),
                new MathJSParametricFunction(
                    "sin(a t)",
                    "cos(b t)",
                    {a: 1, b: 0.9}
                )
            ];
            demoObjects.forEach(function (e) {
                cplane.addObject(FunctionNode, e);
            });
        }

        $("[data-icon-src]").each(function () {
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

        function refreshUI() {
            var id = $(".object-list").val();
            var obj = cplane.objects[id];
            if (isNull(id) || id == "-" || isNull(obj)) {
                $(".fn-defined-only").removeClass("fn-defined");
                return;
            }

            // $("svg .selected").removeClass("selected");
            $("svg .selected").attr("class", function (i, c) {
                if (!c) return;
                return c.replace(/(^| )selected($| )/g, "$1$2");
            });
            // $("."+id).addClass("selected");
            $("svg ."+id).attr("class", function (i, c) {
                if (!c) return;
                return c + " selected";
            });

            TBI.UI.toggleButton($(".hide-function")[0], obj.visible, true);
            $(".fn-defined-only").addClass("fn-defined");

            updateInfoBox();
            updateScaleLocking();
        }

        function getCurrentObject() {
            var id = $(".object-list").val();
            if (isNull(id) || id == "-") return null;

            return cplane.objects[id];
        }

        function bindToSelectedObject(query, handler, evt) {
            if (isNull(evt)) evt = "click";
            $(query).on(evt, function (event, args) {
                handler.apply(this, [getCurrentObject(), event, args]);
                cplane.triggerNextUpdate = true;
            });
        }

        function updateScaleLocking() {
            if (!cplane.plugins["navigation"]) return;
            var set = cplane.settings.controls,
                x = TBI.UI.isToggled($(".lock-x")[0]),
                y = TBI.UI.isToggled($(".lock-y")[0]);

            if (!x && !y) set.mode = "free";
            else if (x && !y) set.mode = "x-fixed";
            else if (!x && y) set.mode = "y-fixed";
            else set.mode = "square";
        }

        function updateObjectList() {
            var select = $(".object-list")[0];
            var obj = {};
            for (var prop in cplane.objects) if (cplane.objects.hasOwnProperty(prop))
                obj[prop] = prop;

            TBI.UI.fillSelect(select, obj, function (option, id) {
                var o = cplane.objects[id];

                if (o.name) option.textContent = o.name;
                else if (o.func) option.innerHTML = o.func.toString(true);
                else if (o.plot) option.innerHTML = o.plot.toString();

                if (!o.visible)
                    option.className += " hidden";
                return option;
            });
        }

        function switchView(val) {
            $(".info-box").slideDown();
            $(".info-box-view-select li").removeClass("active");
            $(".info-box-view-select li[rel='"+val+"']").addClass("active");
            $(".info-box-view").removeClass("show");
            $(".info-box "+val).addClass("show");
        }

        function evalExpression(expr, el) {
            try {
                var f = math.parse(expr).compile();
                var val = f.eval(getVariableObject());
                if (el) $(el).val(val);
                return isNull(val) ? 0 : val;
            } catch (e) {
                TBI.error("Failed to evaluate expression: " + e.message);
            }
        }

        objectToInputs = function (obj) {
            function normalise(str) {
                return str.removeAll(/f\([^\)]*\) *= */);
            }
            switch (obj.func.type.toLowerCase()) {
                case "cartesian":
                case "polar":
                    return [
                        normalise(obj.func.toString())
                    ];
                case "parametric":
                    var str = obj.func.toString();
                    return normalise(str)
                        .replace(/^[\(\[]/, "")
                        .replace(/[\)\]]$/, "")
                        .split(", ");
                default:
                    return [];
            }
        };

        function updateInfoBox() {
            var obj = getCurrentObject();
            var $v = $(".info-box .edit-function-view"),
                $p = $(".info-box .edit-plot-view");

            if (isNull(obj)) {

                $v.find(".function-id").val("");
                $v.find(".function-type").val("cartesian").trigger("change");
                $v.find(".function-colour").val(generateRandomColour(0.8, 0.8).toHex());
                $v.find(".function-start").val("");
                $v.find(".function-end").val("");
                $v.find(".function-resolution").val(50);
                $v.find(".function-inputs .function-input").val("");
                TBI.UI.fillSelect($v.find(".variable-select")[0], {});
                $v.find(".variable-select").val("new").trigger("change");
                TBI.UI.toggleButton($v.find(".derivative-toggle")[0], false);
                TBI.UI.toggleButton($v.find(".integral-toggle")[0], false);

                $p.find(".plot-id").val("");
                $p.find(".plot-type").val("line").trigger("change");
                $p.find(".plot-colour").val(generateRandomColour(0.8, 0.8).toHex());
                $p.find(".plot-matrix").find(".0-1,.1-0").val(0);
                $p.find(".plot-matrix").find(".0-0,.1-1").val(1);
                $p.find(".plot-name").val("");
                TBI.UI.toggleButton($p.find(".plot-closed")[0], false);
                $p.find(".plot-input").val("(0, 1), (2, 3)");

            } else if (obj instanceof FunctionNode) {

                //switchView(".edit-function-view");
                $v.find(".function-id").val(obj.id);
                $v.find(".function-type")
                    .val(obj.func.type.toLowerCase())
                    .trigger("change");
                $v.find(".function-colour").val(obj.style ? obj.style.toHex() : generateRandomColour().toHex());
                $v.find(".function-start").val(isNull(obj.start) ? "" : obj.start);
                $v.find(".function-end").val(isNull(obj.end) ? "" : obj.end);
                $v.find(".function-resolution").val(obj.resolution);
                TBI.UI.toggleButton($v.find(".derivative-toggle")[0], obj.derivative.visible);
                TBI.UI.toggleButton($v.find(".integral-toggle")[0], obj.integral.visible);

                var inputs = objectToInputs(obj);
                $v.find(".function-inputs.show .function-input")
                    .each(function (i, e) {
                        if (i < inputs.length)
                            $(e).val(inputs[i]);
                        else
                            $(e).val("");
                    });

                var vars = {
                    "new": null
                };
                if (obj.func.variables) obj.func.variables.forEach(function (e) {
                    vars[e] = obj.func.scope[e];
                });

                var selection = $v.find(".variable-select").val();
                TBI.UI.fillSelect($v.find(".variable-select")[0], vars, function (option, prop, val) {
                    option.innerHTML = prop;
                    option.value = prop;
                    option.dataset.value = val;
                    return option;
                });
                $v.find(".variable-select").val(selection || "-").trigger("change");

            } else if (obj instanceof PlotNode) {

                //switchView(".edit-plot-view");
                $p.find(".plot-id").val(obj.id);
                $p.find(".plot-type")
                    .val(obj.type.toLowerCase())
                    .trigger("change");
                $p.find(".plot-colour").val(obj.style ? obj.style.toHex() : generateRandomColour().toHex());
                $p.find(".plot-matrix.0-0").val(obj.matrix[0][0]);
                $p.find(".plot-matrix.0-1").val(obj.matrix[0][1]);
                $p.find(".plot-matrix.1-0").val(obj.matrix[1][0]);
                $p.find(".plot-matrix.1-1").val(obj.matrix[1][1]);
                $p.find(".plot-name").val(obj.name || "");
                TBI.UI.toggleButton($p.find(".plot-closed")[0], obj.closed);

                $p.find(".plot-input").val(obj.plot.map(function (v) { return v.toString(); }).join(", "));

            } else {
                TBI.error("Object type not supported");
            }

        }

        function getVariableObject() {
            var obj = {};
            $(".variable-select").find("option").each(function (i, e) {
                if (!isNaN(parseFloat(e.dataset.value)))
                    obj[e.value] = parseFloat(e.dataset.value);
            });
            return obj;
        }

        function setVariable() {
            var el = $(".variable-value");
            var val = evalExpression(el.val(), el);

            var currVar = $(".variable-select").val() || "";
            var option = $(".variable-select").find("option[value='"+currVar+"']");
            if (option.length == 0 || currVar == "new")
                currVar = addVariable();
            else
                option.attr("data-value", val);

            return currVar;

        }

        function addVariable() {
            var select = $(".variable-select")[0];
            var currVar = $(select).val() || "";
            if (currVar.toLowerCase() != "new") {
                $(".variable-select")
                    .val("new")
                    .trigger("change");
                return;
            }
            var name = $(".variable-name").val();
            if (isNull(name)) return;
            var valEl = $(".variable-value");
            var value = evalExpression(valEl.val(), valEl);

            var option = $(select).find("option[value='"+name+"']");
            if (option.length > 0) {
                option = option[0];
                option.dataset.value = value;
            } else {
                option = document.createElement("option");
                option.innerHTML = name;
                option.value = name;
                option.dataset.value = value;
                select.appendChild(option);
            }

            TBI.UI.updateSelect(select);
            $(select).val(name)
                .trigger("change");
            return name;
        }

        function inputsToMathFunction() {
            try {
                var result = null;
                var inputList = $(".function-inputs.show .function-input").map(function (i, e) { return $(e).val(); });
                switch ($(".function-type").val()) {
                    case "cartesian":
                        result = new MathJSFunction("f(x) = " + inputList[0], getVariableObject());
                        break;
                    case "polar":
                        result = new MathJSPolarFunction("f(a) = " + inputList[0], getVariableObject());
                        break;
                    case "parametric":
                        result = new MathJSParametricFunction(inputList[0], inputList[1], getVariableObject());
                        break;
                    default:
                        return null;
                }
                if (isNull(result)) return null;

                result.eval(2);
                return result;
            } catch (e) {
                TBI.error("Function failed to parse: " + e.message);
                return null;
            }
        }

        function inputsToPlot() {
            try {
                var result = null;
                var coords = $(".plot-input").val().replaceAll(/(^\(|\)$)/g, "").split(/\), *\(/);
                coords = coords.map(function (c) {
                    var parts = c.split(/, */).map(parseFloat);
                    return new Vector2D(parts[0], parts[1]);
                });

                return coords;
            } catch (e) {
                TBI.error("Plot failed to parse: " + e.message);
                return null;
            }
        }

        function submitFunction() {
            var varname = setVariable();

            var id = $(".function-id").val() || generateUUID();

            var start = isNull($(".function-start").val()) ? null :
                parseInt($(".function-start").val());
            var end = isNull($(".function-end").val()) ? null :
                parseInt($(".function-end").val());
            var resolution = Math.abs(parseInt($(".function-resolution").val())) || 50;

            var func = inputsToMathFunction();
            if (isNull(func))
                return TBI.error("Failed to save function.");
            var style = new Colour($(".function-colour").val()) || Colours.black;

            var obj = getCurrentObject();
            if (isNull(obj)) obj = new FunctionNode(func, style);
            else {
                obj.func = func;
                obj.style = style;
            }

            obj.id = id;
            obj.start = start;
            obj.end = end;
            obj.resolution = resolution;
            obj.derivative.visible = TBI.UI.isToggled($(".derivative-toggle")[0]);
            obj.integral.visible = TBI.UI.isToggled($(".integral-toggle")[0]);

            cplane.objects[id] = obj;
            cplane.triggerNextUpdate = true;
            updateObjectList();
            $(".object-list").val(id).trigger("update");
            if (!isNull(varname)) $(".variable-select").val(varname).trigger("update");

            cplane.triggerEvent("save");
        }

        function submitPlot() {
            var id = $(".plot-id").val() || generateUUID();

            var plot = inputsToPlot();
            if (isNull(plot))
                return TBI.error("Failed to save plot.");
            var style = new Colour($(".plot-colour").val()) || Colours.black;
            var name = $(".plot-name").val();
            var closed = TBI.UI.isToggled($(".plot-closed")[0]);
            var type = $(".plot-type").val();
            var mat = [
                [parseFloat($(".plot-matrix.0-0").val()), parseFloat($(".plot-matrix.0-1").val())],
                [parseFloat($(".plot-matrix.1-0").val()), parseFloat($(".plot-matrix.1-1").val())]
            ];

            var obj = getCurrentObject();
            if (isNull(obj)) obj = new PlotNode(plot, type, style);
            else {
                obj.plot = plot;
                obj.type = type;
                obj.style = style;
            }

            obj.id = id;
            obj.closed = closed;
            obj.name = name;
            obj.matrix = mat;

            cplane.objects[id] = obj;
            cplane.triggerNextUpdate = true;
            updateObjectList();
            $(".object-list").val(id).trigger("update");

            cplane.triggerEvent("save");
        }

        cplane.addEventHandler("post-update", updateObjectList);

        bindToPlane("#main-plane", "mousedown");
        bindToPlane("#main-plane", "mouseup");
        bindToPlane("#main-plane", "mousemove");

        cplane.addEventHandler("mouseup", function (plane, event) {
            var uuidRe = /([0-9A-Fa-f]{8}\-([0-9A-Fa-f]{4}\-){3}[0-9A-Fa-f]{12})/;
            if (!isNull(plane.state.deltaCenter)
                && plane.state.deltaCenter.equals(Vector2D.zero)
                && event.target.getAttribute("class").search(uuidRe) != -1) {
                $(".object-list").val(event.target.getAttribute("class").match(uuidRe)[1])
                    .trigger("change");
            }
        });

        $(".object-list").change(refreshUI);

        bindToSelectedObject(".hide-function", function (obj) {
            var prop = "objects." + obj.id + ".style.a";
            if (!cplane.plugins.animation) {
                obj.visible = TBI.UI.isToggled(this);
                cplane.triggerEvent("save");
                return;
            }

            if (cplane.propertyLocked(prop)) return;
            obj.visible = true;
            if (TBI.UI.isToggled(this)) {
                obj.style.a = 0;
                cplane.addAnimation(prop, 1, 600);
            } else {
                obj.style.a = 1;
                cplane.addAnimation(prop, 0, 600, null, function () {
                    obj.style.a = 1;
                    obj.visible = false;
                });
            }
        }, "change");

        bindToSelectedObject(".remove-function", function (obj) {
            if (!cplane.plugins.animation) {
                delete cplane.objects[obj.id];
                cplane.triggerEvent("save");
                return;
            }

            cplane.addAnimation("objects."+obj.id+".style.a", 0, 600, null, function (plane) {
                delete plane.objects[obj.id];
                $(".object-list").val("-").trigger("update");
                cplane.triggerEvent("save");
            });
        }, "click");

        bindToSelectedObject(".edit-function", function () {
            var obj = getCurrentObject();
            if (obj instanceof FunctionNode)
                switchView(".edit-function-view");
            else if (obj instanceof PlotNode)
                switchView(".edit-plot-view");

            updateInfoBox();
        }, "click");

        $(".return-to-origin").click(function () {
            if (!cplane.plugins.animation) {
                cplane.state.center = new Vector2D(0, 0);
                cplane.triggerEvent("save");
                return;
            }
            cplane.addAnimation("state.center", Vector2D.zero);
        });

        $(".zoom-in").click(function () {
            if (!cplane.plugins["navigation"]) return;

            var set = cplane.settings.controls;
            cplane.zoom(1/set.buttonZoomFactor);
        });

        $("#main-plane").on("mousewheel", function (event) {
            if (!cplane.plugins["navigation"]) return;

            var set = cplane.settings.controls;
            var delta = event.originalEvent.wheelDelta;
            if (delta > 0) cplane.zoom(1/set.scrollZoomFactor);
            else if (delta < 0) cplane.zoom(set.scrollZoomFactor);
        });

        $(".zoom-out").click(function () {
            if (!cplane.plugins["navigation"]) return;

            var set = cplane.settings.controls;
            cplane.zoom(set.buttonZoomFactor);
        });

        $(".lock-x").on("change", updateScaleLocking);
        $(".lock-y").on("change", updateScaleLocking);

        if (cplane.plugins["navigation"]) {
            var m = cplane.settings.controls.mode;
            if (m) {
                TBI.UI.toggleButton($(".lock-x")[0], m === "x-fixed" || m === "square");
                TBI.UI.toggleButton($(".lock-y")[0], m === "y-fixed" || m === "square");
            }
        }

        cplane.addEventHandler("post-update", updateInfoBox);

        $(".info-box-view-select li").click(function () {
            if (!$(this).hasClass("active"))
                switchView($(this).attr("rel"));
        });

        $(".info-box-hide").click(function () {
            $(".info-box").slideUp();
        });

        $(".info-box-show").click(function () {
            $(".info-box").slideDown();
        });

        $(".function-type").change(function () {
            var val = $(this).val();
            if (isNull(val) || val == "-") $(".type-selection-needed").removeClass("type-selection-fulfilled");
            else {
                $(".type-selection-needed").addClass("type-selection-fulfilled");
                $(".function-inputs").removeClass("show");
                $("."+val+"-inputs").addClass("show");
            }
        });

        $(".evaluate-expression").click(function () {
            var el = $($(this).attr("data-for") || $(this).attr("for"));
            evalExpression(el.val(), el);
        });

        $(".add-function").click(function () {
            switchView(".edit-function-view");
            $(".object-list").val("-").trigger("change");
            updateInfoBox();
        });

        $(".add-plot").click(function () {
            switchView(".edit-plot-view");
            $(".object-list").val("-").trigger("change");
            updateInfoBox();
        });

        $(".variable-select").change(function () {
            var val = $(this).val();
            if (isNull(val) || val == "-") {
                $(".variable-name").attr("disabled", true);
                $(".variable-name").val("");
                $(".variable-value").attr("disabled", true);
                $(".variable-value").val(0).trigger("update");
                updateSlider(0);
                $(".variable-demo").text("name");
            } else if (val.toLowerCase() == "new") {
                $(".variable-name").attr("disabled", false);
                $(".variable-name").val("");
                $(".variable-value").attr("disabled", false);
                $(".variable-value").val(0).trigger("update");
                $(".variable-demo").text("name");
                updateSlider(0);
            } else {
                $(".variable-name").attr("disabled", true);
                $(".variable-name").val(val);
                var variableValue = $(this).find("option[value='"+val+"']").attr("data-value");
                $(".variable-value").attr("disabled", false);
                $(".variable-value").val(variableValue).trigger("update");
                updateSlider(variableValue);
                $(".variable-demo").text(val);
            }
        });

        $(".variable-value").on("blur", submitFunction);

        $(".variable-set").click(submitFunction);

        $(".variable-add").click(addVariable);

        $(".variable-remove").click(function () {
            var $s = $(".variable-select");
            var currVar = $s.val();
            if (currVar !== "new" && currVar !== "-") {
                var option = $s.find("option[value='"+currVar+"']");
                if (option.length > 0)
                    $(option[0]).remove();
            }
            $s.val("-").trigger("change");
        });

        $(".edit-function-submit").click(submitFunction);

        $(".function-start").on("blur", submitFunction);
        $(".function-end").on("blur", submitFunction);
        $(".function-colour").on("change", submitFunction);
        $(".derivative-toggle").on("change", submitFunction);
        $(".integral-toggle").on("change", submitFunction);

        $(".edit-plot-submit").click(submitPlot);
        $(".plot-colour").on("change", submitPlot);
        $(".plot-closed").on("change", submitPlot);
        $(".plot-matrix").on("blur", submitPlot);
        $(".plot-name").on("blur", submitPlot);

        bindToSelectedObject(".plot-matrix-reset", function (obj) {
            if (obj instanceof PlotNode)
                obj.matrix = [[1,0],[0,1]];
            updateInfoBox();
        });

        var gotoBody = [
            "<form class='goto-form'>",
                "<div class='control-row'>",
                    "<input type='number' class='goto-x-input' />",
                    "<input type='number' class='goto-y-input' />",
                    "<input type='submit' value='Go' />",
                "</div>",
            "</form>"
        ].join("\n");

        $(".goto-coords").click(function () {
            var win = dialogWM.createWindow("Go To Coordinates", gotoBody, {
                x: "35%",
                y: "35%",
                width: "30%",
                height: "30%",
                flags: JSWM.WindowFlags.bound | JSWM.WindowFlags.resize,
                onClose: function () { /*$(".shadow").removeClass("show");*/ }
            });

            var $win = $(win.element);

            $win.find(".goto-x-input").val(cplane.state.center.x);
            $win.find(".goto-y-input").val(cplane.state.center.y);
            $win.find(".goto-form").on("submit", function (event) {
                if (event.preventDefault) event.preventDefault();

                var c = new Vector2D(
                    parseFloat($win.find(".goto-x-input").val()),
                    parseFloat($win.find(".goto-y-input").val())
                );

                if (cplane.plugins["animation"])
                    cplane.addAnimation("state.center", c);
                else cplane.state.center = c;

                //win.close();

                return false;
            });

            // $(".shadow").addClass("show");
        });

        var measurementToolWindow,
            updateMeasurementTool = function (coords) {
                var $c = $(".measurement-crosshair"),
                    sel = cplane.objects[$(".object-list").val()],
                    off = new Vector2D(
                        $("#main-plane").offset().left,
                        $("#main-plane").offset().top
                    );

                var loc = cplane.getLocationOfCoordinate(coords),
                    screen = loc.add(off);

                if (isNull(sel)) {
                    $c.css("left", screen.x)
                        .css("top", screen.y);
                } else switch (sel.func.type.toLowerCase()) {
                    case "cartesian":
                        var y = sel.func.eval(coords.x);

                        $c.css("left", screen.x);
                        $c.css("top", cplane.getLocationOfCoordinate(
                            new Vector2D(y)).add(off).y);
                        break;

                    case "polar":
                    case "parametric":
                    default:
                        $c.css("left", screen.x);
                        $c.css("top", screen.y);
                }

                coords = cplane.getCoordinateFromLocation(new Vector2D(
                    parseFloat($c.css("left")),
                    parseFloat($c.css("top"))
                ).subtract(off));

                $(".measurement-tool-x").val(coords.x);
                $(".measurement-tool-y").val(coords.y);

            },
            measurementMousemove = function (event) {
                var off = new Vector2D(
                    $("#main-plane").offset().left,
                    $("#main-plane").offset().top
                );

                updateMeasurementTool(cplane.getCoordinateFromLocation(
                    new Vector2D(
                        event.clientX,
                        event.clientY
                    ).subtract(off)
                ));
            };
        $("[name='tool-select']").on("change", function () {
            var val = TBI.UI.getRadioInput("tool-select"),
                possibilities = $("[name='tool-select']")
                    .toArray()
                    .map(function (e) { return e.value; });

            $(".tool-container").removeClass(possibilities.join(" "));
            $(".tool-container").addClass(val);

            switch (val) {
                case "measurement":
                    if (!measurementToolWindow ||
                        !measurementToolWindow.element ||
                        !measurementToolWindow.element.parentElement) {

                        if (measurementToolWindow && measurementToolWindow.element)
                            delete measurementToolWindow.element;

                        measurementToolWindow =
                            toolWM.createWindow("Measurement", $(".measurement-tool-template").html(), {
                                x: "50%",
                                y: "50%",
                                width: 300,
                                height: 190,
                                flags: JSWM.WindowFlags.bound | JSWM.WindowFlags.resize,
                                onClose: function () {
                                    $("#tool-select-navigation")[0].checked = true;
                                    $("#tool-select-navigation").trigger("change");
                                }
                            });

                        var $e = $(measurementToolWindow.element);
                        $e.find(".measurement-tool-x").on("change", function () {
                            updateMeasurementTool(new Vector2D(
                                parseFloat($(this).val()),
                                parseFloat($e.find(".measurement-tool-y").val())
                            ));
                        });
                        $e.find(".measurement-tool-y").on("change", function () {
                            updateMeasurementTool(new Vector2D(
                                parseFloat($e.find(".measurement-tool-x").val()),
                                parseFloat($(this).val())
                            ));
                        });
                    }
                    $("#main-plane").on("mousemove", measurementMousemove);
                    break;
                default:
                    $("#main-plane").off("mousemove", measurementMousemove);
                    break;
            }
        });

        var updateSlider = (function () {
            var lastUpdated = new Date().getTime();
            return function (val) {
                if (new Date().getTime() - 50 <= lastUpdated) return;
                else lastUpdated = new Date().getTime();

                var $s = $(".variable-slider"),
                    min = parseFloat($s.attr("min")),
                    max = parseFloat($s.attr("max"));

                if (val < min)
                    $(".variable-slider-start").val(parseFloat(val)).trigger("change");
                if (val > max)
                    $(".variable-slider-end").val(parseFloat(val)).trigger("change");

                $s.val(parseFloat(val));
            };
        })();

        $(".variable-slider-start").on("change", function () {
            $(".variable-slider").attr("min", $(this).val());
        });
        $(".variable-slider-end").on("change", function () {
            $(".variable-slider").attr("max", $(this).val());
        });
        $(".variable-value").on("change", function () {
            updateSlider($(this).val());
        });
        $(".variable-slider").on("change", function () {
            var val = $(".variable-select").val();
            if (isNull(val) || val == "-") return false;
            $(".variable-value").val($(this).val());

            submitFunction();
        });

        var sliderTimers = [];
        function setSliderTimer(sign, obj, variable) {
            var $s = $(".variable-slider"),
                min = parseFloat($s.attr("min")),
                max = parseFloat($s.attr("max")),
                bounce = true,
                interval = 1000/20,
                duration = 2000;

            //if (sliderTimer instanceof TBI.Timer)
            //    sliderTimer.clear();

            if (sign !== 0 && !isNull(obj) && !isNull(variable)
                    && variable !== "new"
                    && variable !== "-") {
                sliderTimers.push(new TBI.Timer(function (timer) {
                    var val = obj.func.scope[variable],
                        step = (interval / duration) * (max - min);

                    var newval = val + sign * step;
                    if (newval > max) {
                        if (bounce) {
                            newval = max - (newval - max);
                            setSliderTimer(sign * -1, obj, variable);
                        } else newval = min + (newval - max);
                    }

                    if (newval < min) {
                        if (bounce) {
                            newval = min + (min - newval);
                            setSliderTimer(sign * -1, obj, variable);
                        } else newval = max - (min - newval);
                    }

                    if (isNaN(obj.func.scope[variable]) || !cplane.objects[obj.id])
                        return timer.clear();

                    // $s.val(newval).trigger("change");
                    obj.func.scope[variable] = newval;
                    cplane.triggerNextUpdate = true;
                }, interval, true, "cplane-" + obj.id + "-" + variable));
            } else {
                var timer = TBI.TimerDB["cplane-" + obj.id + "-" + variable];
                if (timer) timer.clear();
            }
        }

        bindToSelectedObject(".variable-slider-forwards", function (obj) {
            console.log(obj);
            setSliderTimer( 1, obj, $(".variable-select").val());
        }, "click");

        bindToSelectedObject(".variable-slider-backwards", function (obj) {
            setSliderTimer(-1, obj, $(".variable-select").val());
        }, "click");

        bindToSelectedObject(".variable-slider-stop", function (obj) {
            setSliderTimer( 0, obj, $(".variable-select").val());
        }, "click");

        $(".variable-slider-stop-all").click(function () {
            sliderTimers.forEach(function (t) {
                if (t instanceof TBI.Timer) t.clear();
            });
            sliderTimers = [];
        });
        $(".save").click(function () {
            cplane.triggerEvent("save", true);
        });
    });
});
});
