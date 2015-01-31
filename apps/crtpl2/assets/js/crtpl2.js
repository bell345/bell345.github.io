// requestAnimationFrame polyfill
window.requestAnimationFrame = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
window.msRequestAnimationFrame || window.oRequestAnimationFrame ||
function (cback) { setTimeout(cback, 1000/60); };

function DirectionQuantity(top, right, bottom, left) {
    this.top = top;
    this.right = right || top;
    this.bottom = bottom || top;
    this.left = left || right || top;
}

// A class for colours.
// Currently supports constructing from and outputting:
// RGB, RGBA and hex colour formatted strings.
// Also supports 3/4 values for red, green, blue and alpha.
function Colour(arg0, g, b, a) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    if (arg0 instanceof Colour) {
        this.r = arg0.r;
        this.g = arg0.g;
        this.b = arg0.b;
        this.a = arg0.a;
    } else if (!isNull(g) && !isNull(b)) {
        var r = arg0;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a || 1;
    } else {
        var str = arg0;
        if (str.startsWith("#")) {
            str = str.removeAll("#");
            var vals = [];
            if (str.length == 3) {
                this.r = parseInt(str[0], 16) * 16;
                this.g = parseInt(str[1], 16) * 16;
                this.b = parseInt(str[2], 16) * 16;
                this.a = 1;
            } else if (str.length == 6) {
                this.r = parseInt(str[0]+str[1], 16);
                this.g = parseInt(str[2]+str[3], 16);
                this.b = parseInt(str[4]+str[5], 16);
                this.a = 1;
            }
        } else if (str.startsWith("rgb")) {
            str = str.removeAll(/rgba?\(/, ")");
            var vals = str.split(/,\W*/);
            if (vals.length == 3 || vals.length == 4) {
                this.r = parseInt(vals[0]);
                this.g = parseInt(vals[1]);
                this.b = parseInt(vals[2]);
                this.a = parseFloat(isNull(vals[3]) ? 1 : vals[3]);
            }
        }
    }
    this.toRGBA = function () {
        return "rgba("+this.r+", "+this.g+", "+this.b+", "+this.a+")";
    }
    this.toRGB = function () {
        return "rgb("+this.r+", "+this.g+", "+this.b+")";
    },
    this.toHex = function () {
        var red = transformDecimal(this.r, 16);
        var green = transformDecimal(this.g, 16);
        var blue = transformDecimal(this.b, 16);
        return "#"+red+green+blue;
    }
    this.toString = function (format) {
        format = format ? format.toLowerCase() : "rgba";
        switch (format) {
            case "hex": return this.toHex();
            case "rgb": return this.toRGB();
            default: return this.toRGBA();
        }
    }
}

// not mine: repurposed from the ActionScript functions in http://gizma.com/easing/. Thanks to Robert Penner.
var TimingFunctions = {
    linear: function (t, d) { return t / d; },
    quadratic: {
        in: function (t, d) { t /= d; return t * t; },
        out: function (t, d) { t /= d; return -t * (t - 2); },
        both: function (t, d) { t /= (d/2); if (t < 1) return (t * t)/2; t--; return -(t * (t - 2) - 1)/2; }
    },
    cubic: {
        in: function (t, d) { t /= d; return t*t*t; },
        out: function (t, d) { t /= d; t--; return t*t*t + 1; },
        both: function (t, d) { t /= d/2; if (t < 1) return (t*t*t)/2; t -= 2; return (t*t*t + 2)/2; }
    },
    quartic: {
        in: function (t, d) { t /= d; return t*t*t*t; },
        out: function (t, d) { t /= d; t--; return -(t*t*t*t - 1); },
        both: function (t, d) { t /= d/2; if (t < 1) return (t*t*t*t)/2; t -= 2; return -(t*t*t*t - 2)/2; }
    },
    quintic: {
        in: function (t, d) { t /= d; return t*t*t*t*t; },
        out: function (t, d) { t /= d; t--; return t*t*t*t*t + 1; },
        both: function (t, d) { t /= d/2; if (t < 1) return (t*t*t*t*t)/2; t -= 2; return (t*t*t*t*t + 2)/2; }
    },
    sinusoidal: {
        in: function (t, d) { return -(Math.cos(t/d * (Math.PI/2)) - 1); },
        out: function (t, d) { return Math.sin(t/d * (Math.PI/2)); },
        both: function (t, d) { return -(Math.cos(Math.PI*t/d) - 1)/2; }
    },
    exponential: {
        in: function (t, d) { return Math.pow(2, 10 * (t/d - 1)); },
        out: function (t, d) { return -Math.pow(2, -10 * t/d) + 1; },
        both: function (t, d) { return t /= d/2; if (t < 1) return Math.pow(2, 10*(t-1))/2; t--; return (-Math.pow(2, -10 * t) + 2)/2;  }
    }
};

// manual animation #thewayilikeit
function Tween(start, end, ms, func) {
    this.start = start;
    this.end = end;
    this.duration = ms;
    this.startTime = -1;
    this.timingFunction = func || TimingFunctions.linear;

    this.beginAnimation = function (time) { this.startTime = time || new Date().getTime(); }

    Object.defineProperty(this, "getValue", {
        value: function () {
            return ((this.end-this.start) * this.progress) + this.start;
        },
        writable: false,
        configurable: true
    });

    // pseudo-properties
    Object.defineProperty(this, "progress", {
        get: function () { return this.timingFunction(Math.bound(this.elapsedTime, 0, this.duration), this.duration); }
    });
    Object.defineProperty(this, "value", {
        get: function () { return this.getValue(); }
    });
    Object.defineProperty(this, "completed", {
        get: function () { return this.progress >= 1 || this.elapsedTime > this.duration; }
    });
    Object.defineProperty(this, "elapsedTime", {
        get: function () {
            var currTime = new Date().getTime();
            if (this.startTime == -1) this.beginAnimation(currTime);
            return currTime - this.startTime;
        }
    });
}

Tween.Vector = function (start, end, ms, func) {
    Tween.call(this, start, end, ms, func);

    Object.defineProperty(this, "getValue", {
        value: function () {
            var coordX = ((this.end.x - this.start.x) * this.progress) + this.start.x;
            var coordY = ((this.end.y - this.start.y) * this.progress) + this.start.y;
            return new Vector2D(coordX, coordY);
        },
        writable: false,
        configurable: true
    });
}
Tween.Vector.prototype = Object.create(Tween.prototype);

Tween.Colour = function (start, end, ms, func) {
    Tween.call(this, start, end, ms, func);

    Object.defineProperty(this, "getValue", {
        value: function () {
            var red = ((this.end.r-this.start.r) * this.progress) + this.start.r;
            var green = ((this.end.g-this.start.g) * this.progress) + this.start.g;
            var blue = ((this.end.b-this.start.b) * this.progress) + this.start.b;
            var alpha = ((this.end.a-this.start.a) * this.progress) + this.start.a;
            return new Colour(Math.floor(red), Math.floor(green), Math.floor(blue), alpha);
        },
        writable: false,
        configurable: true
    })
}
Tween.Colour.prototype = Object.create(Tween.prototype);

// automates canvas operations
function CvsHelper(context) {
    this.$ = context;
}
CvsHelper.prototype = {
    constructor: CvsHelper,
    convertToVector: function (point) {
        if (point instanceof Vector2D) return point;
        else if (!isNull(point.x) && !isNull(point.y)) return new Vector2D(point.x, point.y);
        else if (!isNull(point[0]) && !isNull(point[1])) return new Vector2D(point[0], point[1]);
        else return new Vector2D(0, 0);
    },
    convertToVectorList: function (points) {
        for (var i=0,a=[];i<points.length;i++) a.push(this.convertToVector(points[i]));
        return a;
    },
    correctCoordinate: function (coord) {
        return new Vector2D(coord.x, -coord.y);
    },
    linePlot: function (points, width, style, fuzz, fuzzColour) {
        points = this.convertToVectorList(points);
        if (points.length == 0) return;
        this.$.beginPath();
        if (!isNull(width)) this.$.lineWidth = width;
        if (!isNull(style)) this.$.strokeStyle = style;
        if (!isNull(fuzz)) {
            if (!isNull(fuzzColour)) this.$.shadowColor = fuzzColour;
            else this.$.shadowColor = this.$.strokeStyle;
            this.$.shadowBlur = fuzz;
        } else this.$.shadowBlur = 0;
        this.$.moveTo(points[0].x, points[0].y);
        for (var i=1;i<points.length;i++)
            this.$.lineTo(points[i].x, points[i].y);
        this.$.stroke();
        this.$.closePath();
    },
    polygon: function (points, style, borderWidth, borderStyle) {
        points = this.convertToVectorList(points);
        this.$.beginPath();
        if (!isNull(style)) this.$.fillStyle = style;
        this.$.moveTo(points[0].x, points[0].y);
        for (var i=1;i<points.length;i++)
            this.$.lineTo(points[i].x, points[i].y);
        this.$.lineTo(points[0].x, points[0].y);
        this.$.fill();
        if (!isNull(borderWidth) || !isNull(borderStyle)) {
            if (!isNull(borderWidth)) this.$.lineWidth = borderWidth;
            if (!isNull(borderStyle)) this.$.strokeStyle = borderStyle;
            this.$.stroke();
        }
        this.$.closePath();
    },
    write: function (text, pos, font, style, align, baseline, width) {
        pos = this.convertToVector(pos);
        if (!isNull(font)) this.$.font = font;
        if (!isNull(style)) this.$.fillStyle = style;
        if (!isNull(align)) this.$.textAlign = align;
        if (!isNull(baseline)) this.$.textBaseline = baseline;
        this.$.beginPath();
        if (isNull(width)) this.$.fillText(text, pos.x, pos.y);
        else this.$.fillText(text, pos.x, pos.y, width);
        this.$.closePath();
    }
}

function CrtPlane2(id, canvas) {
    this.init(id, canvas);
}
CrtPlane2.prototype = {
    constructor: CrtPlane2,
    $: null,
    canvas: null,
    helper: null,
    assetDiv: null,
    animFrame: null,
    settings: {
        backgroundColour: "",
        textColour: "",
        infiniteLoopLimit: 500,
        axes: {
            xFixed: false,
            yFixed: false,
            stayOnScreen: true,
            yOnRight: false,
            xOnTop: false,
            fixedIntersect: false,
            margin: new DirectionQuantity(45, 75),
            width: 6,
            colour: "",
            visible: true,
            blockMargin: true,
            blockMarginColour: ""
        },
        scale: {
            visible: true,
            mark: {
                width: 4,
                length: 20,
                colour: ""
            },
            label: {
                font: "Open Sans",
                size: 20,
                colour: "",
                offset: new DirectionQuantity(30, 24),
                padding: 6,
                xPosition: "auto",
                yPosition: "auto"
            },
            grid: {
                visible: true,
                width: 2,
                colour: ""
            },
            minor: {
                visible: true,
                width: 1,
                length: 12,
                colour: "",
                grid: false,
                count: 4
            },
            minInterval: 50,
            maxInterval: 100,
            floatCompensation: 3,
            staySquare: true
        },
        controls: {
            fixedZoom: true,
            scrollZoomFactor: 1.3,
            panTimeout: 400,
            buttonZoomFactor: 1.6,
            zoomTimeout: 600,
            minExtents: new Vector2D(5e-5, 5e-5),
            maxExtents: new Vector2D(1e10, 1e10)
        },
        functions: {
            definition: 50,
            width: 2,
            colours: [
                "#a00",
                "#0a0",
                "#00a",
                "#aa0",
                "#a0a",
                "#0aa",
                "#aaa"
            ],
            highlightColour: "",
            highlightFuzz: 6,
            polarStart: -16,
            polarEnd: 16,
            threshold: new Vector2D(1e6,1e6)
        },
        animation: {
            duration: 1200,
            durations: {
                default: 2000,
                zoom: 300,
                highlight: 400
            },
            timingFunc: TimingFunctions.quintic.both
        },
        legend: {
            visible: true,
            entryOpacity: 0.6
        }
    },
    state: {
        center: new Vector2D(0, 0),
        deltaCenter: new Vector2D(0, 0),
        extents: new Vector2D(32, 18),
        deltaExtents: new Vector2D(32, 18),
        xFixed: null,
        yFixed: null,
        xOnTop: false,
        yOnRight: false
    },
    animations: [
    ],
    previous: {
        extentRatio: 0,
        center: null,
        startCenter: null,
        extents: null,
        mouseDown: null,
        colour: -1,
        functions: "",
        settings: ""
    },
    functions: [
        { func: new PolynomialFunc(3, 1/5, -3, -2) },
        { func: new RelationFunc(2, 3, 10) },
        { func: new MathFunction(function (x) { return Math.sin(x); }) },
        { func: new MathFunction(function (x) { return Math.pow(2, x); }) },
        { func: new MathFunction(function (a) { return 2*Math.sin(4*a); }, MathFunction.Types.Polar) },
        { func: new ParametricFunc.lissajous(0.4, 1) },
        { func: new ParametricFunc(function (t) { return Math.sin(t); }, function (t) { return Math.cos(0.9*t); }) }
    ],
    addFunction: function (func, style) {
        var obj = {};
        obj.func = func;
        if (!isNull(style)) obj.style = style;
        this.functions.push(obj);
        this.draw();
    },
    getFunctionIndexById: function (id) {
        for (var i=0;i<this.functions.length;i++)
            if (this.functions[i].id == id) return i;
        return -1;
    },
    getHighlightedFunctionIndex: function () {
        for (var i=0;i<this.functions.length;i++)
            if (this.functions[i].highlighted == true) return i;
        return -1;
    },
    plots: [

    ],
    addPlot: function (plot, style) {
        var obj = {};
        obj.plot = plot;
        if (!isNull(style)) obj.style = style;
        this.plots.push(obj);
        this.draw();
    },
    init: function (id, canvas) {
        try {
            this.id = id;
            this.canvas = canvas;
            this.$ = this.canvas.getContext("2d");
        } catch (e) {
            TBI.error("Whoops! Something went wrong and the plane cannot be created.");
            return;
        }
        var assetDiv = gecn("plane-"+this.id+"-container");
        if (assetDiv.length == 0) {
            this.assetDiv = document.createElement("div");
            this.assetDiv.className = this.id+"-container";
            this.assetDiv.className += " plane-container";
            this.canvas.parentElement.appendChild(this.assetDiv);
        } else this.assetDiv = assetDiv[0];
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.helper = new CvsHelper(this.$);
        var set = this.settings, aSet = set.axes, sSet = set.scale, fSet = set.functions;
        set.textColour = this.setUsingDefaults(
            set.textColour,
            getComputedStyle(this.canvas).color,
            "#000"
        );
        set.backgroundColour = this.setUsingDefaults(
            this.settings.backgroundColour,
            getComputedStyle(this.canvas).backgroundColor,
            "#fff"
        );
        aSet.colour = this.setUsingDefaults(
            aSet.colour,
            getComputedStyle(this.getElement("axis-colour")).color,
            set.textColour
        );
        aSet.blockMarginColour = this.setUsingDefaults(
            aSet.blockMarginColour,
            getComputedStyle(this.getElement("margin-colour")).color,
            set.backgroundColour
        );
        sSet.label.colour = this.setUsingDefaults(
            sSet.label.colour,
            set.textColour
        );
        sSet.mark.colour = this.setUsingDefaults(
            sSet.mark.colour,
            aSet.colour
        );
        sSet.grid.colour = this.setUsingDefaults(
            sSet.grid.colour,
            getComputedStyle(this.getElement("grid-colour")).color,
            sSet.mark.colour
        );
        sSet.minor.colour = this.setUsingDefaults(
            sSet.minor.colour,
            getComputedStyle(this.getElement("minor-grid-colour")).color,
            sSet.grid.colour
        );
        fSet.highlightColour = this.setUsingDefaults(
            fSet.highlightColour,
            getComputedStyle(this.getElement("highlight-colour")).color,
            "#09f"
        );
        this.loop();
    },
    setUsingDefaults: function (value) {
        var defaults = [];
        for (var i=1;i<arguments.length;i++) defaults.push(arguments[i]);
        var j = 0;
        while (isNull(value) && j < defaults.length) {
            value = defaults[j++];
        }
        return value;
    },
    getElement: function () {
        for (var i=0,args=[];i<arguments.length;i++) args.push(arguments[i]);
        var els = this.assetDiv.querySelectorAll("."+args.join("."));
        if (els.length == 0) {
            var newDiv = document.createElement("div");
            newDiv.className = "plane-"+this.id;
            newDiv.className += " "+args.join(" ");
            this.assetDiv.appendChild(newDiv);
            return newDiv;
        } else return els[0];
    },
    getProperty: function (property) {
        var propTree = property.split(".");
        for (var i=0,c=this;i<propTree.length-1;i++) {
            c = c[propTree[i]];
            if (c === undefined) return;
        }
        return c[propTree[propTree.length-1]];
    },
    setProperty: function (property, value) {
        var propTree = property.split(".");
        for (var i=0,c=this;i<propTree.length-1;i++) {
            c = c[propTree[i]];
            if (c === undefined) return;
        }
        c[propTree[propTree.length-1]] = value;
    },
    hasUpdated: function () {
        var state = this.state, prev = this.previous;
        if (isNull(prev.center) || !prev.center.equals(state.center)) return true;
        else if (isNull(prev.extents) || !prev.extents.equals(state.extents)) return true;
        else if (this.canvas.width != window.innerWidth) return true;
        else if (this.canvas.height != window.innerHeight) return true;
        else if (prev.functions != this.functions.toString()) return true;
        else if (isNull(prev.settings) || prev.settings != this.settings.toString()) return true;
        return false;
    },
    isPropLocked: function (property) {
        for (var i=0;i<this.animations.length;i++)
            if (this.animations[i].prop == property) return true;
        return false;
    },
    getAnimationIndexByProperty: function (property) {
        for (var i=0;i<this.animations.length;i++)
            if (this.animations[i].prop == property) return i;
        return -1;
    },
    animateProperty: function (property, end, pDuration, pFunc, pOnCompleted) {
        var set = this.settings.animation;
        var func = pFunc || set.timingFunc;
        var duration = pDuration || set.durations.default;
        var onCompleted = pOnCompleted || function () {};
        var propIndex = this.getAnimationIndexByProperty(property);
        if (propIndex != -1) {
            var anim = this.animations[propIndex];
            anim.tween.duration = anim.tween.elapsedTime + duration;
            anim.tween.end = end;
            if (!isNull(pFunc)) anim.tween.timingFunction = func;
        } else {
            var isVector = this.getProperty(property) instanceof Vector2D;
            var isColour = this.getProperty(property) instanceof Colour || typeof(this.getProperty(property)) == "string";
            var tween = new Tween(this.getProperty(property), end, duration, func);
            if (isVector) tween = new Tween.Vector(this.getProperty(property).copy(), end, duration, func);
            else if (isColour)
                tween = new Tween.Colour(new Colour(this.getProperty(property).toString()),
                    new Colour(end.toString()), duration, func);

            this.animations.push({
                tween: tween,
                prop: property,
                onCompleted: onCompleted
            });
        }
    },
    loop: function () {
        // closure magic
        requestAnimationFrame(
            function (plane) {
                return function () {
                    plane.loop();
                }
            }(this)
        );
        $(this.canvas).css("transform", "translateX("+this.state.deltaCenter.x+"px) translateY("+this.state.deltaCenter.y+"px)");
        this.animate();
        if (this.hasUpdated()) this.draw();
        this.previous.center = this.state.center;
        this.previous.extents = this.state.extents;
        this.previous.functions = this.functions.toString();
        this.previous.settings = this.settings.toString();
    },
    draw: function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.$.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.settings.scale.staySquare) this.keepExtentsSquare();
        if (this.settings.axes.visible) this.drawAxes();
        if (this.settings.scale.visible) this.drawScale();
        this.drawFunctions();
        var legend = this.getElement("legend");
        if (this.settings.legend.visible && legend.className.search(" show") == -1) $(legend).toggleClass("show", true);
        else if (!this.settings.legend.visible && legend.className.search(" show") != -1) $(legend).toggleClass("show", false);

        if (this.settings.legend.visible) this.populateLegend();
    },
    animate: function () {
        var anims = this.animations;
        var tAnims = this.tempAnimations;
        for (var i=0,exp=[];i<anims.length;i++) {
            var curr = anims[i];
            if (curr.tween instanceof Tween) {
                this.setProperty(curr.prop, curr.tween.value);
                if (curr.tween.completed) {
                    if (!isNull(curr.onCompleted)) curr.onCompleted(curr);
                    exp.push(i);
                }
            } else exp.push(i);
        }
        for (var i=0;i<exp.length;i++) anims.splice(exp[i], 1);
    },
    keepExtentsSquare: function (masterAxis) {
        var extents = this.state.extents;
        var center = this.state.center;
        var ratio = this.canvas.width / this.canvas.height;
        if (extents.x / extents.y == ratio) return;
        if (masterAxis == "y") {
            extents.x = extents.y * ratio;
        }
        else {
            extents.y = extents.x / ratio;
        }
        this.previous.extentRatio = ratio;
    },
    getLocationOfCoordinate: function (coord, fixNum) {
        var set = this.settings, state = this.state;
        coord = this.helper.correctCoordinate(coord);
        var center = this.helper.correctCoordinate(state.center);
        return this.getFactor().multiply(state.extents.divide(2).subtract(center).add(coord)).fix(fixNum);
    },
    getCoordinateFromLocation: function (location, fixNum) {
        var set = this.settings, state = this.state;
        var center = this.helper.correctCoordinate(state.center);
        var coord = location.divide(this.getFactor()).subtract(state.extents.divide(2)).add(center);
        return this.helper.correctCoordinate(coord).fix(fixNum);
    },
    getFactor: function () {
        return new Vector2D(this.canvas.width, this.canvas.height).divide(this.state.extents);
    },
    populateLegend: function () {
        var set = this.settings.legend;
        var funcList = this.getElement("function-list");
        $(funcList).empty();
        for (var i=0;i<this.functions.length;i++) {
            var curr = this.functions[i];
            if (!isNull(curr.id)) {
                var li = document.createElement("li");
                li.id = curr.id;
                li.className = "function";
                switch (curr.func.type) {
                    case MathFunction.Types.Cartesian: li.className += " cartesian"; break;
                    case MathFunction.Types.Polar: li.className += " polar"; break;
                    case MathFunction.Types.Parametric: li.className += " parametric"; break;
                }
                if (curr.hidden) li.className += " hidden";
                else if (curr.highlighted) li.className += " highlighted";
                li.innerHTML = curr.func.toString(true);
                if (curr.highlighted) var col = new Colour(curr.highlightedStyle.toString());
                else var col = new Colour(curr.style.toString());
                col.a = set.entryOpacity;
                li.style.borderColor = col.toRGBA();
                funcList.appendChild(li);
                $(li).mouseenter(function (plane) {
                    return function (event) {
                        var index = plane.getFunctionIndexById(this.id), lightIndex = plane.getHighlightedFunctionIndex();
                        if (index != -1) {
                            var func = plane.functions[index], set = plane.settings.functions;
                            func.highlighted = true;
                            func.highlightedStyle = set.highlightColour;
                        }
                        if (lightIndex != -1 && lightIndex != index) {
                            var func = plane.functions[lightIndex], set = plane.settings.functions;
                            func.highlighted = false;
                        }
                    }
                }(this));
                $(li).mouseleave(function (plane) {
                    return function (event) {
                        var index = plane.getHighlightedFunctionIndex();
                        if (index != -1) {
                            var func = plane.functions[index], set = plane.settings.functions;
                            func.highlighted = false;
                        }
                    }
                }(this));
                $(li).click(function (plane) {
                    return function (event) {
                        var mode = TBI.getRadioInput("mode-select");
                        var funcIndex = plane.getFunctionIndexById(this.id);
                        var func = plane.functions[funcIndex];
                        switch (mode) {
                            case "hide": func.hidden = !func.hidden; break;
                            case "remove": plane.functions.remove(funcIndex); break;
                            case "edit": TBI.log("To be implemented"); break;
                            default: TBI.log("The input's smoking crack again");
                        }
                    }
                }(this));
            }
        }
    },
    plotFunction: function (func, style, fuzz) {
        var set = this.settings.functions, scaleSet = this.settings.scale;
        var factor = this.getFactor();
        var scaleX = this.computeScale(factor.x, scaleSet.minInterval, scaleSet.maxInterval);
        var scaleXMagnitude = Math.ceil(Math.abs(Math.log10(scaleX/set.definition).fixFloat()))+scaleSet.floatCompensation;

        var startX = this.getCoordinateFromLocation(new Vector2D(0 - (factor.x*scaleX), 0)).x;
        startX = Math.ceil(startX/scaleX)*scaleX;
        var endX = this.getCoordinateFromLocation(new Vector2D(this.canvas.width + (factor.x*scaleX), 0)).x;
        endX = Math.ceil(endX/scaleX)*scaleX;

        //var step = 1/set.definition;
        var step = scaleX/set.definition;
        var plot = [];

        var infTries = 0;

        if (func.type == MathFunction.Types.Cartesian) {
            for (var x=startX;x<=endX;x+=step) {
                if (scaleX < 1) x = x.fixFloat(scaleXMagnitude);
                var coord = null;
                if (func.type == MathFunction.Types.Cartesian) coord = new Vector2D(x, func.eval(x));
                else if (func.type == MathFunction.Types.Parametric) coord = func.eval(x);
                var loc = this.getLocationOfCoordinate(coord);
                if (loc.clamp(set.threshold.negate(), set.threshold).equals(loc))
                    plot.push(this.getLocationOfCoordinate(coord));
            }
        } else if (func.type == MathFunction.Types.Polar || func.type == MathFunction.Types.Parametric) {
            var startPol = set.polarStart*Math.PI;
            var endPol = set.polarEnd*Math.PI;
            var stepPol = Math.PI/set.definition;
            var magnitudePol = Math.ceil(Math.abs(Math.log10(stepPol).fixFloat()))+scaleSet.floatCompensation;
            for (var a=startPol;a<=endPol;a+=stepPol) {
                if (stepPol < 1) a = a.fixFloat(magnitudePol);
                var coord = null;
                if (func.type == MathFunction.Types.Polar) coord = Vector2D.fromPolar(a, func.eval(a));
                else if (func.type == MathFunction.Types.Parametric) coord = func.eval(a);
                plot.push(this.getLocationOfCoordinate(coord));
            }
        }

        this.$.globalCompositeOperation = "destination-over";
        this.helper.linePlot(plot, set.width, style, fuzz);
        this.$.globalCompositeOperation = "source-over";
    },
    plotPoints: function (points, style, fuzz) {
        var set = this.settings.functions;
        points = this.helper.convertToVectorList(points);
        for (var i=0,a=[];i<points.length;i++) {
            var loc = this.getLocationOfCoordinate(points[i]);
            if (loc.clamp(set.threshold.negate(), set.threshold).equals(loc))
                a.push(loc);
        }
        this.$.globalCompositeOperation = "destination-over";
        this.helper.linePlot(a, set.width, style, fuzz);
        this.$.globalCompositeOperation = "source-over";
    },
    drawFunctions: function () {
        var set = this.settings.functions, funcs = this.functions, plots = this.plots, prev = this.previous;
        for (var i=0;i<funcs.length;i++) {
            var curr = funcs[i];
            var style = curr.style;
            if (isNull(style)) {
                prev.colour = (prev.colour + 1) % set.colours.length;
                curr.style = set.colours[prev.colour];
                style = curr.style;
            }
            if (isNull(curr.id)) curr.id = generateUUID();
            if (isNull(curr.visible)) curr.visible = true;
            if (isNull(curr.highlighted)) {
                curr.highlighted = false;
                curr.highlightedStyle = style;
            } else if (curr.highlighted) style = curr.highlightedStyle;
            if (isNull(curr.hidden)) {
                curr.hidden = false;
                curr.hiddenStyle = "rgba(0,0,0,0)"
            } else if (curr.hidden) style = curr.hiddenStyle;
            this.plotFunction(curr.func, style.toString(), curr.highlighted ? set.highlightFuzz : 0);
        }

        for (var i=0;i<plots.length;i++) {
            var curr = plots[i];
            var style = curr.style;
            if (isNull(style)) {
                prev.colour = (prev.colour + 1) % set.colours.length;
                curr.style = set.colours[prev.colour];
                style = curr.style;
            }
            if (isNull(curr.id)) curr.id = generateUUID();
            if (isNull(curr.visible)) curr.visible = true;
            if (isNull(curr.highlighted)) {
                curr.highlighted = false;
                curr.highlightedStyle = style;
            } else if (curr.highlighted) style = curr.highlightedStyle;
            if (isNull(curr.hidden)) {
                curr.hidden = false;
                curr.hiddenStyle = style;
            } else if (curr.hidden) style = curr.hiddenStyle;
            this.plotPoints(curr.plot, style.toString(), curr.highlighted ? set.highlightFuzz : 0);
        }
    },
    computeScale: function (factor, min, max) {
        var scale = 1, giveUp = 0, giveUpLimit = 999;
        while (factor * scale > max && giveUp++ < giveUpLimit) {
            if (factor * (scale / 2) <= max) scale /= 2;
            else if (factor * (scale / 5) <= max) scale /= 5;
            else scale /= 10;
        }
        while (factor * scale < min && giveUp++ < giveUpLimit) {
            if (factor * (scale * 2) >= min) scale *= 2;
            else if (factor * (scale * 5) >= min) scale *= 5;
            else scale *= 10;
        }
        return scale;
    },
    drawScale: function () {
        var set = this.settings.scale, axesSet = this.settings.axes, state = this.state;
        var trueOrigin = this.getLocationOfCoordinate(new Coords(0, 0));
        var factor = this.getFactor();
        var infTries = 0;

        var scaleX = this.computeScale(factor.x, set.minInterval, set.maxInterval);
        var scaleY = this.computeScale(factor.y, set.minInterval, set.maxInterval);
        var minorScaleX = scaleX/set.minor.count;
        var minorScaleY = scaleY/set.minor.count;

        var scaleXMagnitude = Math.ceil(Math.abs(Math.log10(scaleX).fixFloat()))+set.floatCompensation;
        var scaleYMagnitude = Math.ceil(Math.abs(Math.log10(scaleY).fixFloat()))+set.floatCompensation;
        var minorScaleXMagnitude = Math.ceil(Math.abs(Math.log10(minorScaleX).fixFloat()))+set.floatCompensation;
        var minorScaleYMagnitude = Math.ceil(Math.abs(Math.log10(minorScaleY).fixFloat()))+set.floatCompensation;

        if (state.yFixed) var originX = state.yOnRight ? this.canvas.width - axesSet.margin.right : axesSet.margin.left;
        else originX = trueOrigin.x;

        if (state.xFixed) var originY = state.xOnTop ? axesSet.margin.top : this.canvas.height - axesSet.margin.bottom;
        else originY = trueOrigin.y;

        var xstart = this.getCoordinateFromLocation(new Vector2D(0 - (factor.x*scaleX), originY)).x;
        xstart = Math.ceil(xstart/scaleX)*scaleX;

        var xend = this.getCoordinateFromLocation(new Vector2D(this.canvas.width + (factor.x*scaleX), originY)).x;
        xend = Math.ceil(xend/scaleX)*scaleX;

        var ystart = this.getCoordinateFromLocation(new Vector2D(originX, this.canvas.height + (factor.y*scaleY))).y;
        ystart = Math.ceil(ystart/scaleY)*scaleY;

        var yend = this.getCoordinateFromLocation(new Vector2D(originX, 0 - (factor.y*scaleY))).y;
        yend = Math.ceil(yend/scaleY)*scaleY;

        var xLabelPos = "auto";
        if (originY > (this.canvas.height/2)) xLabelPos = "bottom";
        else xLabelPos = "top";

        if (set.label.xPosition == "top") xLabelPos = "top";
        else if (set.label.xPosition == "bottom") xLabelPos = "bottom";

        var yLabelPos = "auto";
        if (originX > (this.canvas.width/2)) yLabelPos = "right";
        else yLabelPos = "left";

        if (set.label.yPosition == "left") yLabelPos = "left";
        else if (set.label.yPosition == "right") yLabelPos = "right";

        var xHalfLength = new Vector2D(set.mark.length/2, 0);
        var yHalfLength = new Vector2D(0, set.mark.length/2);

        var minorXHalfLength = new Vector2D(set.minor.length/2, 0);
        var minorYHalfLength = new Vector2D(0, set.minor.length/2);

        var xZeroIsValid = state.xFixed && !axesSet.fixedIntersect;
        var yZeroIsValid = state.yFixed && !axesSet.fixedIntersect;

        for (var i=xstart,p=null;i<xend;i+=scaleX) {
            if (scaleX < 1) i = i.fixFloat(scaleXMagnitude);
            var loc = this.getLocationOfCoordinate(new Vector2D(i, 0));
            loc.y = originY;

            var gridStart = 0, gridEnd = this.canvas.width;
            if (state.xFixed && !axesSet.fixedIntersect) {
                if (state.xOnTop && gridStart < originY) gridStart = originY;
                if (!state.xOnTop && gridEnd > originY) gridEnd = originY;
            }

            var inMargin = false;
            if (state.yFixed && !axesSet.fixedIntersect) {
                if (state.yOnRight && loc.x > originX) inMargin = true;
                else if (!state.yOnRight && loc.x < originX) inMargin = true;
            }

            var isValid = !inMargin && (i != 0 || xZeroIsValid);

            if (set.grid.visible && isValid) this.helper.linePlot([
                new Vector2D(loc.x, gridStart),
                new Vector2D(loc.x, gridEnd)
            ], set.grid.width, set.grid.colour);

            if (set.minor.visible) {
                for (var j=i;j<i+scaleX;j+=minorScaleX) {
                    if (minorScaleX < 1) j = j.fixFloat(minorScaleXMagnitude);
                    var minorLoc = this.getLocationOfCoordinate(new Vector2D(j, 0));
                    minorLoc.y = originY;

                    var minorIsValid = j == Math.bound(j, j-minorScaleX/4, j+minorScaleX/4);
                    if (state.yFixed && !axesSet.fixedIntersect) {
                        if (state.yOnRight && minorLoc.x > originX) minorIsValid = false;
                        else if (!state.yOnRight && minorLoc.x < originX) minorIsValid = false;
                    }

                    if (set.minor.grid && minorIsValid) this.helper.linePlot([
                        new Vector2D(minorLoc.x, gridStart),
                        new Vector2D(minorLoc.x, gridEnd)
                    ], set.minor.width, set.minor.colour);

                    if (!set.minor.grid && minorIsValid) this.helper.linePlot([
                        minorLoc.subtract(minorYHalfLength),
                        minorLoc.add(minorYHalfLength)
                    ], set.minor.width, set.minor.colour);
                }
            }

            if (isValid) this.helper.linePlot([
                loc.subtract(yHalfLength),
                loc.add(yHalfLength)
            ], set.mark.width, set.mark.colour);

            var labelPos = loc.copy();
            if (xLabelPos == "top") labelPos = labelPos.subtract(new Vector2D(0, set.label.offset.top));
            else if (xLabelPos == "bottom") labelPos = labelPos.add(new Vector2D(0, set.label.offset.bottom));

            if (isValid) this.helper.write(i,
                labelPos,
                set.label.size+"px "+set.label.font,
                set.label.colour,
                "center",
                "middle",
                factor.x*scaleX - set.label.padding
            );
            p = i;
        }

        for (var i=ystart,p=null;i<yend;i+=scaleY) {
            if (scaleY < 1) i = i.fixFloat(scaleYMagnitude);
            var loc = this.getLocationOfCoordinate(new Vector2D(0, i));
            loc.x = originX;

            var gridStart = 0, gridEnd = this.canvas.width;
            if (state.yFixed && !axesSet.fixedIntersect) {
                if (!state.yOnRight && gridStart < originX) gridStart = originX;
                if (state.yOnRight && gridEnd > originX) gridEnd = originX;
            }

            var inMargin = false;
            if (state.xFixed && !axesSet.fixedIntersect) {
                if (state.xOnTop && loc.y < originY) inMargin = true;
                else if (!state.xOnTop && loc.y > originY) inMargin = true;
            }

            var isValid = !inMargin && (i != 0 || yZeroIsValid);

            if (set.grid.visible && isValid) this.helper.linePlot([
                new Vector2D(gridStart, loc.y),
                new Vector2D(gridEnd, loc.y)
            ], set.grid.width, set.grid.colour);

            if (set.minor.visible) {
                for (var j=i;j<i+scaleY;j+=minorScaleY) {
                    if (minorScaleY < 1) j = j.fixFloat(minorScaleYMagnitude);
                    var minorLoc = this.getLocationOfCoordinate(new Vector2D(0, j));
                    minorLoc.x = originX;

                    var minorIsValid = j == Math.bound(j, j-minorScaleY/4, j+minorScaleY/4);
                    if (state.xFixed && !axesSet.fixedIntersect) {
                        if (state.xOnTop && minorLoc.y < originY) minorIsValid = false;
                        else if (!state.xOnTop && minorLoc.y > originY) minorIsValid = false;
                    }

                    if (set.minor.grid && minorIsValid) this.helper.linePlot([
                        new Vector2D(gridStart, minorLoc.y),
                        new Vector2D(gridEnd, minorLoc.y)
                    ], set.minor.width, set.minor.colour);

                    if (!set.minor.grid && minorIsValid) this.helper.linePlot([
                        minorLoc.subtract(minorXHalfLength),
                        minorLoc.add(minorXHalfLength)
                    ], set.minor.width, set.minor.colour);
                }
            }

            if (isValid) this.helper.linePlot([
                loc.subtract(xHalfLength),
                loc.add(xHalfLength)
            ], set.mark.width, set.mark.colour);

            var labelPos = loc.copy(), textAlign = "center", textWidth = 0;
            if (yLabelPos == "left") {
                labelPos = labelPos.subtract(new Vector2D(set.label.offset.left, 0));
                textAlign = "right";
                textWidth = axesSet.margin.left - set.label.offset.left - set.label.padding;
            } else if (yLabelPos == "right") {
                labelPos = labelPos.add(new Vector2D(set.label.offset.right, 0));
                textAlign = "left";
                textWidth = axesSet.margin.right - set.label.offset.right - set.label.padding;
            }

            if (isValid) this.helper.write(i,
                labelPos,
                set.label.size+"px "+set.label.font,
                set.label.colour,
                textAlign,
                "middle",
                textWidth
            );
            p = i;
        }
    },
    drawFixedXAxis: function (xOnTop, yOnRight) {
        var ignoreYAxis = isNull(yOnRight);
        if (isNull(xOnTop)) return;
        var set = this.settings.axes, state = this.state;
        this.$.lineCap = "square";
        // get intersection of axis lines
        var xcoord = yOnRight ? this.canvas.width - set.margin.right : set.margin.left;
        var ycoord = xOnTop ? set.margin.top : this.canvas.height - set.margin.bottom;
        // if the axis margin is filled in
        if (set.blockMargin) {
            // get screen limits based on axis locations
            var ylim = xOnTop ? 0 : this.canvas.height;
            // draw x axis margin
            this.$.globalCompositeOperation = "destination-over";
            this.helper.polygon([
                new Coords(0, ylim),
                new Coords(0, ycoord),
                new Coords(this.canvas.width, ycoord),
                new Coords(this.canvas.width, ylim)
            ], set.blockMarginColour);
            this.$.globalCompositeOperation = "source-over";
        }
        if (set.fixedIntersect || ignoreYAxis) {
            // draw x axis
            this.helper.linePlot([
                new Coords(0, ycoord),
                new Coords(this.canvas.width, ycoord)
            ], set.width, set.colour);
        } else {
            // draw x axis
            this.helper.linePlot([
                new Coords((!yOnRight ? xcoord : 0), ycoord),
                new Coords((yOnRight ? xcoord : this.canvas.width), ycoord)
            ], set.width, set.colour);
        }
        this.state.xFixed = true;
        this.state.xOnTop = xOnTop;
    },
    drawFixedYAxis: function (xOnTop, yOnRight) {
        var ignoreXAxis = isNull(xOnTop);
        if (isNull(yOnRight)) return;
        var set = this.settings.axes, state = this.state;
        this.$.lineCap = "square";
        // get intersection of axis lines
        var xcoord = yOnRight ? this.canvas.width - set.margin.right : set.margin.left;
        var ycoord = xOnTop ? set.margin.top : this.canvas.height - set.margin.bottom;
        // if the axis margin is filled in
        if (set.blockMargin) {
            // get screen limits based on axis locations
            var xlim = yOnRight ? this.canvas.width : 0;
            // draw y axis margin
            this.$.globalCompositeOperation = "destination-over";
            this.helper.polygon([
                new Coords(xcoord, 0),
                new Coords(xlim, 0),
                new Coords(xlim, this.canvas.height),
                new Coords(xcoord, this.canvas.height)
            ], set.blockMarginColour);
            this.$.globalCompositeOperation = "source-over";
        }
        if (set.fixedIntersect || ignoreXAxis) {
            // draw y axis
            this.helper.linePlot([
                new Coords(xcoord, 0),
                new Coords(xcoord, this.canvas.height)
            ], set.width, set.colour);
        } else {
            // draw y axis
            this.helper.linePlot([
                new Coords(xcoord, (xOnTop ? ycoord : 0)),
                new Coords(xcoord, (!xOnTop ? ycoord : this.canvas.height))
            ], set.width, set.colour);
        }
        this.state.yFixed = true;
        this.state.yOnRight = yOnRight;
    },
    drawXAxis: function (yOnRight) {
        var origin = this.getLocationOfCoordinate(new Coords(0, 0));
        var set = this.settings.axes;
        var begin = 0, end = this.canvas.width;
        if (yOnRight == false && !set.fixedIntersect) begin += set.margin.left;
        if (yOnRight == true && !set.fixedIntersect) end -= set.margin.right;
        this.helper.linePlot([
            new Coords(begin, origin.y),
            new Coords(end, origin.y)
        ], set.width, set.colour);
        this.state.xFixed = false;
    },
    drawYAxis: function (xOnTop) {
        var origin = this.getLocationOfCoordinate(new Coords(0, 0));
        var set = this.settings.axes;
        var begin = 0, end = this.canvas.height;
        if (xOnTop == true && !set.fixedIntersect) begin += set.margin.top;
        if (xOnTop == false && !set.fixedIntersect) end -= set.margin.bottom;
        this.helper.linePlot([
            new Coords(origin.x, begin),
            new Coords(origin.x, end)
        ], set.width, set.colour);
        this.state.yFixed = false;
    },
    drawAxes: function () {
        var set = this.settings.axes, state = this.state;
        this.$.lineCap = "square";
        // get origin
        var origin = this.getLocationOfCoordinate(new Coords(0, 0)),
            xOnTop = null,
            yOnRight = null,
            boundX = Math.bound(origin.x, set.margin.left, this.canvas.width - set.margin.right),
            boundY = Math.bound(origin.y, set.margin.top, this.canvas.height - set.margin.bottom);

        if (set.xFixed) xOnTop = set.xOnTop;
        if (set.yFixed) yOnRight = set.yOnRight;

        if (set.stayOnScreen) {
            if (origin.x < boundX) yOnRight = false;
            else if (origin.x > boundX) yOnRight = true;

            if (origin.y < boundY) xOnTop = true;
            else if (origin.y > boundY) xOnTop = false;

            if (!isNull(xOnTop)) this.drawFixedXAxis(xOnTop, yOnRight);
            else this.drawXAxis(yOnRight);
            if (!isNull(yOnRight)) this.drawFixedYAxis(xOnTop, yOnRight);
            else this.drawYAxis(xOnTop);
        } else {
            if (set.xFixed) this.drawFixedXAxis(xOnTop, yOnRight);
            else this.drawXAxis();

            if (set.yFixed) this.drawFixedYAxis(xOnTop, yOnRight);
            else this.drawYAxis();
        }
    },
    bind: function (element, property) {
        TBI.toggleButton(element, this.getProperty(property));
        $(element).click(
            function (plane, prop) {
                return function () { plane.setProperty(prop, TBI.isToggled(this)); plane.draw(); };
            }(this, property)
        );
    },
    zoom: function (factor, duration) {
        var set = this.settings.controls, animSet = this.settings.animation;
        var futureExtents = this.state.extents.multiply(factor);
        var clampd = futureExtents.clamp(set.minExtents, set.maxExtents);
        // cplane.state.extents = clampd;
        this.animateProperty("state.extents", clampd, animSet.durations.zoom);
        // if (!set.fixedZoom && futureExtents.equals(clampd)) this.state.center = this.state.center.multiply(factor);
        if (!set.fixedZoom && futureExtents.equals(clampd)) this.animateProperty("state.center", this.state.center.multiply(factor), animSet.durations.zoom);
    }
}
var cplane;
$(document).on("pageload", function () {
    cplane = new CrtPlane2("cplane", gebi("cplane"));
    var mdown = null,
        startCenter = null,
        panTimeout = null;
    $("#cplane").mousedown(function (event) {
        cplane.previous.mouseDown = new Vector2D(event.clientX, event.clientY);
        cplane.previous.startCenter = cplane.state.center;
    });
    $("#cplane").mouseup(function () {
        cplane.previous.mouseDown = null;
        cplane.previous.startCenter = null;
    });
    $("#cplane").mousemove(function (event) {
        var mdown = cplane.previous.mouseDown;
        var startCenter = cplane.previous.startCenter;
        if (!isNull(mdown) && !isNull(startCenter)) {
            var diff = cplane.helper.correctCoordinate(mdown.subtract(new Vector2D(event.clientX, event.clientY)));
            cplane.state.deltaCenter = cplane.helper.correctCoordinate(diff).negate();
            var newCenter = startCenter.add(diff.divide(cplane.getFactor()));

            clearTimeout(panTimeout);
            panTimeout = setTimeout(function (newCenter, event) {
                return function () {
                    cplane.state.deltaCenter = new Vector2D(0, 0);
                    cplane.state.center = newCenter;
                    if (!isNull(cplane.previous.mouseDown) && !isNull(cplane.previous.startCenter)) {
                        cplane.previous.mouseDown = new Vector2D(event.clientX, event.clientY);
                        cplane.previous.startCenter = newCenter;
                    }
                }
            }(newCenter, event), cplane.settings.controls.panTimeout);
        }
    });
    $("#cplane").on("mousewheel", function (event) {
        var set = cplane.settings.controls;
        var delta = event.originalEvent.wheelDelta;
        if (delta > 0) cplane.zoom(1/set.scrollZoomFactor);
        else if (delta < 0) cplane.zoom(set.scrollZoomFactor);
    });
    $(".pan-reset button").click(function () {
        var set = cplane.settings.animation;
        if (!cplane.isPropLocked("state.center"))
            cplane.animateProperty("state.center", new Vector2D(0, 0));
    });
    $(".zoom-in button").click(function () {
        var set = cplane.settings.controls;
        cplane.zoom(1/set.buttonZoomFactor);
    });
    $(".zoom-out button").click(function () {
        var set = cplane.settings.controls;
        cplane.zoom(set.buttonZoomFactor);
    });
    cplane.bind($(".show-axes button")[0], "settings.axes.visible");
    cplane.bind($(".show-axes button")[0], "settings.scale.visible");
    cplane.bind($(".show-legend button")[0], "settings.legend.visible");
    cplane.bind($(".keep-axes button")[0], "settings.axes.stayOnScreen");
    cplane.bind($(".zoom-mode button")[0], "settings.controls.fixedZoom");
    $(".legend").mouseleave(function () {
        var index = cplane.getHighlightedFunctionIndex();
        if (index != -1) {
            var func = cplane.functions[index], set = cplane.settings.functions;
            func.highlighted = false;
        }
    });
});
