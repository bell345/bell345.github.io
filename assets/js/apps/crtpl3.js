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
                    addCoord(new Vector2D(x, this.func.eval(x)));
                addCoord(new Vector2D(end, this.func.eval(end)));

                break;
            case "Polar":
                start = this.start || -16*Math.PI;
                end = this.end || 16*Math.PI;
                step = Math.PI/this.resolution;

                for (var a=start;a<=end;a+=step)
                    addCoord(Vector2D.fromPolar(a, this.func.eval(a)));
                addCoord(Vector2D.fromPolar(end, this.func.eval(end)));

                break;
            case "Parametric":
                start = this.start || -16*Math.PI;
                end = this.end || 16*Math.PI;
                step = Math.PI/this.resolution;

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
                }, function (path) {
                    path.style.stroke = self.style.toRGBA();
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
                plot.style.stroke = this.style.toRGBA();
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
    loader.start();

    PlotTypes = new Enum("line", "scatter");

    $(document).on("pageload", function () {
        cplane = new CrtPlane3(gebi("main-plane"))
            .addPlugin(plugins["scale"])
            .addPlugin(plugins["animation"])
            .addPlugin(plugins["navigation"])
            .updateSettings(CrtPlane3.MasterSettings, "settings");

        var demoObjects = [
            new PolynomialFunc(3, 1/5, -3, -2),
            //new RelationFunc(2, 3, 10),
            new MathFunction(function (x) { return Math.sin(x); }),
            new MathFunction(function (x) { return Math.pow(2, x); }),
            new PolarFunction(function (a) { return 2*Math.sin(4*a); }),
            new ParametricFunc.lissajous(0.4, 1),
            new ParametricFunc.Variable(
                function (t) { return Math.sin(this.a*t); },
                function (t) { return Math.cos(this.b*t); },
                { a: 1, b: 0.9 }
            )
        ];
        demoObjects.forEach(function (e) {
            cplane.addObject(FunctionNode, e);
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
        }

        function getCurrentObject() {
            var id = $(".object-list").val();
            if (isNull(id) || id == "-") return null;

            return cplane.objects[id];
        }

        function bindToSelectedObject(query, handler, evt) {
            if (isNull(evt)) evt = "click";
            $(query).on(evt, function (event) {
                handler.apply(this, [getCurrentObject(), event]);
                cplane.triggerNextUpdate = true;
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
                var f = MathFunction.Variable.parse(expr, getVariableObject);
                var val = f.eval();
                if (el) $(el).val(val);
                return isNull(val) ? 0 : val;
            } catch (e) {
                TBI.error("Failed to evaluate expression: " + e.message);
            }
        }

        function objectToInputs(obj) {
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
                        .replace(/^\(/, "")
                        .replace(/\)$/, "")
                        .split(", ");
                default:
                    return [];
            }
        }

        function updateInfoBox() {
            var obj = getCurrentObject();
            var $v = $(".info-box .edit-function-view");
            if (isNull(obj)) {
                $v.find(".function-id").val("");
                $v.find(".function-name").val("");
                $v.find(".function-type").val("-").trigger("change");
                $v.find(".function-colour").val(generateRandomColour().toHex());
                $v.find(".function-inputs .function-input").val("");
                TBI.UI.fillSelect($v.find(".variable-select")[0], {});
                $v.find(".variable-select").val("new");
                return;
            }

            $v.find(".function-id").val(obj.id);
            $v.find(".function-name").val(obj.name || "");
            $v.find(".function-type")
                .val(obj.func.type.toLowerCase())
                .trigger("change");
            $v.find(".function-colour").val(obj.style ? obj.style.toHex() : generateRandomColour().toHex());

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
                vars[e] = obj.func[e];
            });

            TBI.UI.fillSelect($v.find(".variable-select")[0], vars, function (option, prop, val) {
                option.innerHTML = prop;
                option.value = prop;
                option.dataset.value = val;
                return option;
            });
            $v.find(".variable-select").val("-");

        }

        function getVariableObject() {
            var obj = {};
            $(".variable-select").find("option").each(function (i, e) {
                obj[e.value] = e.dataset.value;
            });
            if (obj["-"]) delete obj["-"];
            if (obj["new"]) delete obj["new"];
            return obj;
        }

        function setVariable() {
            var el = $(".variable-value");
            var val = evalExpression(el.val(), el);

            var currVar = $(".variable-select").val() || "";
            var option = $(".variable-select").find("option[value='"+currVar+"']");
            if (option.length == 0 || currVar == "new")
                addVariable();
            else
                option.attr("data-value", val);

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
        }

        function inputsToMathFunction() {
            try {
                var result = null;
                var inputList = $(".function-inputs.show .function-input").map(function (i, e) { return $(e).val(); });
                switch ($(".function-type").val()) {
                    case "cartesian":
                        result = MathFunction.Variable.parse("f(x) = " + inputList[0], getVariableObject());
                        break;
                    case "polar":
                        result = PolarFunction.Variable.parse("f(a) = " + inputList[0], getVariableObject());
                        break;
                    case "parametric":
                        result = ParametricFunc.Variable.parse("f(t) = " + inputList[0], "f(t) = " + inputList[1], getVariableObject());
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

        cplane.addEventHandler("post-update", function () {
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
        });

        bindToPlane("#main-plane", "mousedown");
        bindToPlane("#main-plane", "mouseup");
        bindToPlane("#main-plane", "mousemove");

        $(".object-list").change(refreshUI);

        bindToSelectedObject(".hide-function", function (obj) {
            var prop = "objects." + obj.id + ".style.a";
            if (!cplane.plugins.animation) {
                obj.visible = TBI.UI.isToggled(this);
                return;
            }

            if (cplane.propertyLocked(prop)) return;
            obj.visible = true;
            if (TBI.UI.isToggled(this)) {
                obj.style.a = 0;
                cplane.addAnimation(prop, 1, 600);
            } else {
                obj.style.a = 1;
                cplane.addAnimation(prop, 0, 600, null, function (plane, tween) {
                    obj.style.a = 1;
                    obj.visible = false;
                });
            }
        }, "change");

        bindToSelectedObject(".remove-function", function (obj) {
            if (!cplane.plugins.animation) {
                delete cplane.objects[obj.id];
                return;
            }

            cplane.addAnimation("objects."+obj.id+".style.a", 0, 600, null, function (plane, tween) {
                delete plane.objects[obj.id];
                $(".object-list").val("-").trigger("update");
            });
        }, "click");

        bindToSelectedObject(".edit-function", function (obj) {
            switchView(".edit-function-view");
            updateInfoBox();
        }, "click");

        $(".return-to-origin").click(function () {
            if (!cplane.plugins.animation) {
                cplane.state.center = new Vector2D(0, 0);
                return;
            }
            cplane.addAnimation("state.center", Vector2D.zero);
        });

        $(".zoom-in").click(function () {
            var set = cplane.settings.controls;
            cplane.zoom(1/set.buttonZoomFactor);
        });

        $("#main-plane").on("mousewheel", function (event) {
            var set = cplane.settings.controls;
            var delta = event.originalEvent.wheelDelta;
            if (delta > 0) cplane.zoom(1/set.scrollZoomFactor);
            else if (delta < 0) cplane.zoom(set.scrollZoomFactor);
        });

        $(".zoom-out").click(function () {
            var set = cplane.settings.controls;
            cplane.zoom(set.buttonZoomFactor);
        });

        cplane.addEventHandler("post-update", updateInfoBox);

        $(".info-box-view-select li").click(function () {
            if (!$(this).hasClass("active"))
                switchView($(this).attr("rel"));
        });

        $(".info-box-hide").click(function () {
            $(".info-box").slideUp();
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
            var el = $($(this).attr("for"));
            evalExpression(el.val(), el);
        });

        $(".add-function").click(function () {
            switchView(".edit-function-view");
            $(".object-list").val("-").trigger("change");
            updateInfoBox();
        });

        $(".variable-select").change(function () {
            var val = $(this).val();
            if (isNull(val) || val == "-") return null;
            else if (val.toLowerCase() == "new") {
                $(".variable-name").attr("disabled", false);
                $(".variable-name").val("");
                $(".variable-value").val(0);
            } else {
                $(".variable-name").attr("disabled", true);
                $(".variable-name").val(val);
                var variableValue = $(this).find("option[value='"+val+"']").attr("data-value");
                $(".variable-value").val(variableValue);
            }
        });

        $(".variable-set").click(setVariable);

        $(".variable-add").click(addVariable);

        $(".variable-remove").click(function () {
            var $s = $(".variable-select");
            var currVar = $s.val();
            if (currVar !== "new" && currVar !== "-") {
                var option = s.find("option[value='"+currVar+"']");
                if (option.length > 0)
                    option[0].remove();
            }
            $s.val("-");
        });

        $(".edit-function-submit").click(function () {
            setVariable();

            var id = $(".function-id").val() || generateUUID();
            var name = $(".function-name").val() || "";

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

            obj.name = name || undefined;
            obj.id = id;

            cplane.objects[id] = obj;
            var handler_id = cplane.addEventHandler("post-update", function () {
                $(".object-list").val(id).trigger("update");
                cplane.removeEventHandler(handler_id);
            });
            cplane.triggerNextUpdate = true;
        });
    });
});
});
