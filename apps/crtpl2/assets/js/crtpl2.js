// TODO: Complete the documentation.
// This is why you should document while you code, kids.
// requestAnimationFrame polyfill
window.requestAnimationFrame = window.requestAnimationFrame ||
window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame ||
window.msRequestAnimationFrame || window.oRequestAnimationFrame ||
function (cback) { setTimeout(cback, 1000/60); };

// Quick and dirty class for representing top, right, bottom and left properties.
// Similar to CSS margin-width, border-width, etc. shorthand.
function DirectionQuantity(top, right, bottom, left) {
    this.top = top;
    this.right = right || top;
    this.bottom = bottom || top;
    this.left = left || right || top;
}

// A class for colours.
// Currently supports constructing from and outputting
// RGB, RGBA, HSV and hex colour formatted strings.
// HSL coming soon.
// Also supports 3-4 values for red, green, blue and alpha.
// Can also take a colour object as an argument (for compatibility).
function Colour(arg0, g, b, a) {
    // default is transparent, also colour returned when parsing fails
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;

    // Sets a Colour object with the colour represented by a hex string.
    // e.g. "#6a0094" or "#ffd" or "AADF09"
    this.setHex = function (hexStr) {
        // get rid of the "#", and don't rely on it
        hexStr = hexStr.removeAll("#");
        var vals = [];
        // if hex is three-digit shorthand
        if (hexStr.length == 3) {
            // too lazy for the mathematical way
            hexStr = [
                hexStr[0], hexStr[0],
                hexStr[1], hexStr[1],
                hexStr[2], hexStr[2]
            ];
        }
        if (hexStr.length == 6) {
            // simple: just convert the relevant hex areas of the string
            // into their decimal representations using parseInt().
            this.r = parseInt(hexStr[0]+hexStr[1], 16);
            this.g = parseInt(hexStr[2]+hexStr[3], 16);
            this.b = parseInt(hexStr[4]+hexStr[5], 16);
            this.a = 1;
        }
    };
    // Sets a Colour object with the colour represented by three
    // red, green and blue bytes.
    // e.g. (34, 89, 179)
    this.setRGB = function (r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
    };
    // Sets a Colour object with the colour represented by three
    // red, green and blue bytes and an alpha channel intensity.
    // e.g. (34, 89, 179, 0.73)
    this.setRGBA = function (r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = isNull(a) ? 1 : a;
    }
    // Sets a Colour object with the colour represented by
    // three hue [0-360), saturation [0-1] and value [0-1] values.
    // e.g. 190, 0.5, 0.83
    // Also: I got this off of a website, no idea where it was [not mine]
    // and I have no idea how this works (well, I have a cursory idea)
    this.setHSV = function (h, s, v) {
        var c = v * s;
        var x = c * (1 - Math.abs((h/60) % 2 - 1));
        var m = v - c;

        var rgb = [0, 0, 0];
        if      (h <  60) rgb = [c,x,0];
        else if (h < 120) rgb = [x,c,0];
        else if (h < 180) rgb = [0,c,x];
        else if (h < 240) rgb = [0,x,c];
        else if (h < 300) rgb = [x,0,c];
        else if (h < 360) rgb = [c,0,x];

        this.r = (rgb[0] + m)*255;
        this.g = (rgb[1] + m)*255;
        this.b = (rgb[2] + m)*255;
        this.a = 1;
    };

    // To hell with using instanceofs and checks to make sure the
    // input isn't already a colour! Just accept it as input!
    // / this may also bite me in the ass /
    if (arg0 instanceof Colour) {
        this.r = arg0.r;
        this.g = arg0.g;
        this.b = arg0.b;
        this.a = arg0.a;
    // if input is provided as three/four rgb(a) values
    } else if (!isNull(g) && !isNull(b)) {
        var r = arg0;
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a || 1;
    // here comes the string parsing
    } else {
        var str = arg0;
        // hex is simple, just call the function with the string intact
        if (str.startsWith("#")) {
            this.setHex(str);
        // if it's rgb formatted, extract the numbers from the string
        } else if (str.startsWith("rgb")) {
            // remove the rgb/rgba( and ) delimiters
            str = str.removeAll(/rgba?\(/, ")");
            // split by commas and trailing whitespace
            var vals = str.split(/,\W*/);
            // only accept good lengths of input
            if (vals.length == 3 || vals.length == 4) this.setRGBA(
                // and just parse the strings as integers
                parseInt(vals[0]),
                parseInt(vals[1]),
                parseInt(vals[2]),
                parseFloat(isNull(vals[3]) ? 1 : vals[3])
            )
        // pretty much rgb() all over again, but with a few modifications
        // and no optional alpha to worry about
        } else if (str.startsWith("hsv")) {
            str = str.removeAll("hsv(", ")");
            var vals = str.split(/,\W*/);
            if (vals.length == 3) this.setHSV(
                parseInt(vals[0]),
                // s and v are apparently given as percentages rather than floats
                // parseFloat() gets rid of the trailing percentage mark
                // (lazy, I know)
                parseFloat(vals[1])/100,
                parseFloat(vals[2])/100
            )
        }
    }

    // a pseudo-property for the hue (hue hue hue) value
    // stolen from the same website where I got my hsv parsing code from
    Object.defineProperty(this, "h", {
        get: function () {
            var r = this.r/255;
            var g = this.g/255;
            var b = this.b/255;

            var delta = Math.max(r, g, b) - Math.min(r, g, b);

            switch (delta) {
                case r: return 60 * (((g - b)/delta) % 6); break;
                case g: return 60 * (((b - r)/delta) + 2); break;
                case b: return 60 * (((r - g)/delta) + 4); break;
            }
        }, set: function (h) {
            this.setHSV(h, this.s, this.v);
        }
    });
    // another pseudo-property, this time for saturation
    Object.defineProperty(this, "s", {
        get: function () {
            var r = this.r/255;
            var g = this.g/255;
            var b = this.b/255;

            var max = Math.max(r, g, b);
            var delta = max - Math.min(r, g, b);

            if (max == 0) return 0;
            else return delta / max;
        }, set: function (s) {
            s = s.toString();
            // either it is given as a percentage, or as a float
            // handle both
            if (s.endsWith("%")) s = parseFloat(s)/100;
            this.setHSV(this.h, s, this.v);
        }
    });
    // last one for the 'value' value
    Object.defineProperty(this, "v", {
        get: function () {
            var r = this.r/255;
            var g = this.g/255;
            var b = this.b/255;

            return Math.max(r, g, b);
        }, set: function (v) {
            v = v.toString();
            // either it is given as a percentage, or as a float
            // handle both
            if (v.endsWith("%")) v = parseFloat(v)/100;
            this.setHSV(this.r, this.s, v);
        }
    });

    // These functions return valid string representations of themselves
    // in various formats (these can also be passed back into Colour()).
    // Useful for HTML/CSS styling and colour animation.
    this.toRGBA = function () {
        return "rgba("+this.r+", "+this.g+", "+this.b+", "+this.a+")";
    };
    this.toRGB = function () {
        return "rgb("+this.r+", "+this.g+", "+this.b+")";
    };
    this.toHex = function () {
        var red = zeroPrefix(transformDecimal(this.r, 16), 2);
        var green = zeroPrefix(transformDecimal(this.g, 16), 2);
        var blue = zeroPrefix(transformDecimal(this.b, 16), 2);
        return "#"+red+green+blue;
    };
    this.toHSV = function () {
        return "hsv("+this.h+", "+(this.s*100)+"%, "+(this.v*100)+"%)";
    }
    // A common interface for the above functions;
    // because I like overriding toString() and using parameters. Sue me.
    this.toString = function (format) {
        format = !isNull(format) ? format.toLowerCase() : "rgba";
        switch (format) {
            case "hex": return this.toHex();
            case "rgb": return this.toRGB();
            case "hsv": return this.toHSV();
            default: return this.toRGBA();
        }
    };
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

// Defines a transition between a start and end value that takes ms milliseconds
// and uses func as a timing function (from the list above, or of a custom creation).
// manual animation #thewayilikeit
function Tween(start, end, ms, func) {
    this.start = start;
    this.end = end;
    this.duration = ms;
    this.startTime = -1;
    this.timingFunction = func || TimingFunctions.linear;

    // fun fact: I used this.start() before, not knowing that it was already defined as a property
    // a few lines above
    // This begins the animation at the specified time (or at time of execution).
    this.beginAnimation = function (time) { this.startTime = time || new Date().getTime(); }

    // A function for returning the value that can be overridden by classes that inherit Tween.
    // e.g. redefining this to return a vector value for animating position
    Object.defineProperty(this, "getValue", {
        value: function () {
            return ((this.end-this.start) * this.progress) + this.start;
        },
        writable: false,
        configurable: true
    });

    // pseudo-properties
    // This one represents the current progress from start to end as a float [0-1].
    // Used in returning a value and also useful for determining when to stop the animation.
    Object.defineProperty(this, "progress", {
        // all timing functions take the elapsed time t and the duration of the animation d.
        get: function () { return this.timingFunction(Math.bound(this.elapsedTime, 0, this.duration), this.duration); }
    });
    // Pseudo-property for the above getValue(), just because using methods looks wrong
    Object.defineProperty(this, "value", {
        get: function () { return this.getValue(); }
    });
    // A boolean returning whether or not the animation has run its course.
    // Defined either when the progress breaks the 100% barrier, or when the elapsed time
    // exceeds the duration.
    Object.defineProperty(this, "completed", {
        get: function () { return this.progress >= 1 || this.elapsedTime > this.duration; }
    });
    // Returns the number of milliseconds from when the animation first began.
    // If it hasn't begun yet, then it will launch the animation.
    Object.defineProperty(this, "elapsedTime", {
        get: function () {
            var currTime = new Date().getTime();
            if (this.startTime == -1) this.beginAnimation(currTime);
            return currTime - this.startTime;
        }
    });
}

// Defines a transition between two points in 2D space. Takes start and
// end as Vector2Ds, and ms as the duration in milliseconds.
// Can also take a timing function func, either from the list
// defined in TimingFunctions or one of specialised design.
Tween.Vector = function (start, end, ms, func) {
    // Inherit from Tween.
    Tween.call(this, start, end, ms, func);

    // Override the getValue() method to return a vector value.
    // Assumes that start and end are vectors.
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
// This isn't *strictly* required, but I like to do it anyway.
Tween.Vector.prototype = Object.create(Tween.prototype);

// Defines a transition between two colours. Takes start and end
// as Colour values, ms as the duration of the animation in milliseconds
// and func as a timing function, either from TimingFunctions or a custom one.
Tween.Colour = function (start, end, ms, func) {
    // Inherit from Tween.
    Tween.call(this, start, end, ms, func);

    // Override the getValue() method to return a Colour value.
    // Assumes that start and end are Colour values.
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

// This creates a helper object that can batch execute common CanvasRenderingContext2D
// tasks, such as drawing a line plot or 2D text.
function CvsHelper(context) {
    this.$ = context;
}
CvsHelper.prototype = {
    constructor: CvsHelper,
    // Converts a non-vector value (such as a deprecated Coords() or a two-length array)
    // to a vector value.
    convertToVector: function (point) {
        if (point instanceof Vector2D) return point;
        else if (!isNull(point.x) && !isNull(point.y)) return new Vector2D(point.x, point.y);
        else if (!isNull(point[0]) && !isNull(point[1])) return new Vector2D(point[0], point[1]);
        else return new Vector2D(0, 0);
    },
    // Does the same as above, but in batch for an array of points (either array or Coords)
    convertToVectorList: function (points) {
        for (var i=0,a=[];i<points.length;i++) a.push(this.convertToVector(points[i]));
        return a;
    },
    // Corrects a coordinate on a canvas to a properly signed value for drawing on a Canvas2D.
    correctCoordinate: function (coord) {
        return new Vector2D(coord.x, -coord.y);
    },
    // Returns whether or not the specified coordinate is inside of the canvas borders.
    isBounded: function (coord) {
        return coord.clamp(Vector2D.zero, new Vector2D(this.$.canvas.width, this.$.canvas.height)).equals(coord);
    },
    // Draws an array of points on the canvas as a line plot.
    // The 'fuzz' refers to the glow (rather, shadow) behind a drawn line.
    // It is not required.
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
    // Draws an array of points representing a polygon on the screen.
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
    // Writes text to the screen.
    // pos: the position of the text on the canvas. (e.g. (150, 300))
    // font: the font used to render the text (e.g. "Franklin Gothic Medium 20")
    // style: the colour used to fill in the text (e.g. "#555555")
    // align: text alignment (left, center, right)
    // baseline: where to place the baseline in relation to the position (e.g. "hanging")
    // width: the width of the container used to draw the text. The text will be squished to fit.
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

// Defines a Cartesian plane.
// id: The text identification for the plane. Not *really* that important.
// canvas: The HTMLCanvasElement where the context will be defined.
// simple: A bool defining whether or not to function in a limited manner
//      i.e. not stretching to the limits of the window
// settings: An object that can be applied to the CrtPlane2 to define its
//      runtime settings.
function CrtPlane2(id, canvas, simple, settings) {
    if (isNull(simple)) simple = false;
    if (isNull(settings)) settings = { settings: {} };
    settings.settings.simple = simple;
    this.$ = null;
    this.canvas = null;
    this.helper = null;
    this.assetDiv = null;
    this.animFrame = null;
    this.settings = {
        backgroundColour: "",
        textColour: "",
        infiniteLoopLimit: 500,
        simple: false,
        axes: {
            xFixed: false,
            yFixed: false,
            stayOnScreen: true,
            yOnRight: false,
            xOnTop: false,
            // if axes should intersect each other on top of margins
            fixedIntersect: false,
            margin: new DirectionQuantity(45, 75),
            width: 6,
            colour: "",
            visible: true,
            // draw a margin between the axis and the edge of the screen, blocking out functions
            blockMargin: true,
            blockMarginColour: ""
        },
        scale: {
            visible: true,
            // controls the tick drawn on the axis
            mark: {
                width: 4,
                length: 20,
                colour: ""
            },
            // controls the label corresponding to a tick
            label: {
                font: "Open Sans",
                size: 20,
                colour: "",
                offset: new DirectionQuantity(30, 24),
                padding: 6,
                xPosition: "auto",
                yPosition: "auto"
            },
            // controls the grid
            grid: {
                visible: true,
                width: 2,
                colour: ""
            },
            // controls the smaller ticks between major ones without labels
            minor: {
                visible: true,
                width: 1,
                length: 12,
                colour: "",
                grid: false,
                minInterval: 45,
                maxInterval: 70
            },
            // numbers (as pixel values) used in calculating the tick interval
            // minInterval is the lowest allowable pixel distance between two ticks
            // maxInterval is the highest allowable pixel distance between two ticks
            minInterval: 135,
            maxInterval: 170,
            // whether or not to draw ticks as far away as possible
            fitToMax: true,
            // const used to make sure that the scale doesn't break
            floatCompensation: 3,
            // whether or not the x and y axes share the same scale at all times
            staySquare: true
        },
        controls: {
            // zoom on a center point, rather than the origin
            fixedZoom: true,
            // higher: more zoom power
            scrollZoomFactor: 1.3,
            // ms after panning when the plane should be redrawn
            panTimeout: 400,
            buttonZoomFactor: 1.6,
            // orphaned
            zoomTimeout: 600,
            // fix the x axis's scale
            xFixed: false,
            // fix the y axis's scale
            yFixed: false,
            // min and max extent values
            minExtents: new Vector2D(5e-5, 5e-5),
            maxExtents: new Vector2D(1e10, 1e10)
        },
        functions: {
            // higher: more function detail, but huge performance drop
            definition: 50,
            width: 2,
            // when a style is not given for a function, this list is iterated through
            // to provide a default
            colours: [
                "#555"
            ],
            highlightColour: "",
            highlightFuzz: 6,
            // multiple of pi that polar/parametric functions use to define a start and end
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
    this.state = {
        // center/centre of the current view, used as a pan value
        // can't believe I used colour, but not centre
        center: new Vector2D(0, 0),
        // difference between rendered plane center and viewport center
        // used in optimised panning
        deltaCenter: new Vector2D(0, 0),
        // max lengths of the x and y axes
        extents: new Vector2D(32, 18),
        // not currently used, hopefully to be used in optimised zooming
        deltaExtents: new Vector2D(32, 18),
        xFixed: null,
        yFixed: null,
        xOnTop: false,
        yOnRight: false
    };
    this.animations = [
    ];
    // previous values are used for calculating deltas and figuring out
    // whether or not to update the plane when these values are inequal to
    // their live counterparts
    this.previous = {
        extentRatio: 0,
        center: null,
        startCenter: null,
        deltaCenter: new Vector2D(0, 0),
        extents: null,
        mouseDown: null,
        colour: -1,
        functions: "",
        settings: ""
    };
    // list of functions
    // defined as an object with the following properties:
    // func: The only required. Takes the form of a MathFunction used in
    //      definition.
    // style: A string value representing the colour of the line as drawn
    //      on screen. Defaults in this.settings.colours are used when
    //      this is not defined.
    // id: A unique identification string. When not defined, a UUID
    //      is used instead. You probably shouldn't define this property.
    // to add a new one, use the this.addFunction() method instead of
    // direct modification.
    this.functions = [
    ];
    // set this to true to trigger an immediate update of the plane
    // used when modifying values
    this.triggerNextUpdate = true;
    // Adds a MathFunction and an optional style.
    this.addFunction = function (func, style) {
        var obj = {};
        obj.func = func;
        if (!isNull(style)) obj.style = style;
        this.functions.push(obj);
        this.triggerNextUpdate = true;
    };
    // Returns the index of the function with the corresponding unique ID.
    this.getFunctionIndexById = function (id) {
        for (var i=0;i<this.functions.length;i++)
            if (this.functions[i].id == id) return i;
        return -1;
    };
    // Returns the index of the function currently highlighted.
    this.getHighlightedFunctionIndex = function () {
        for (var i=0;i<this.functions.length;i++)
            if (this.functions[i].highlighted == true) return i;
        return -1;
    };
    this.plots = [
    ];
    this.addPlot = function (plot, style) {
        var obj = {};
        obj.plot = plot;
        if (!isNull(style)) obj.style = style;
        this.plots.push(obj);
        this.triggerNextUpdate = true;
    };
    this.loadSettings = function (obj, name) {
        for (var prop in obj) if (obj.hasOwnProperty(prop)) {
            if (!isNull(name)) {
                if (!isNull(this.getProperty(name+"."+prop)) && typeof(obj[prop]) == "object")
                    this.loadSettings(obj[prop], name+"."+prop);
                else this.setProperty(name+"."+prop, obj[prop]);
            } else {
                if (!isNull(this.getProperty(prop)) && typeof(obj[prop]) == "object")
                    this.loadSettings(obj[prop], prop);
                else this.setProperty(prop, obj[prop]);
            }
        }
    };
    this.init = function (id, canvas, settings) {
        try {
            this.id = id;
            this.canvas = canvas;
            this.$ = this.canvas.getContext("2d");
        } catch (e) {
            TBI.error("Whoops! Something went wrong and the plane cannot be created.");
            return;
        }

        this.loadSettings(settings);

        var assetDiv = gecn("plane-"+this.id+"-container");
        if (assetDiv.length == 0) {
            this.assetDiv = document.createElement("div");
            this.assetDiv.className = this.id+"-container";
            this.assetDiv.className += " plane-container";
            this.canvas.parentElement.appendChild(this.assetDiv);
        } else this.assetDiv = assetDiv[0];

        var simple = this.settings.simple;
        if (!simple) this.canvas.width = window.innerWidth;
        if (!simple) this.canvas.height = window.innerHeight;
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
    };
    this.setUsingDefaults = function (value) {
        var defaults = [];
        for (var i=1;i<arguments.length;i++) defaults.push(arguments[i]);
        var j = 0;
        while (isNull(value) && j < defaults.length) {
            value = defaults[j++];
        }
        return value;
    };
    this.getElement = function () {
        for (var i=0,args=[];i<arguments.length;i++) args.push(arguments[i]);
        var els = this.assetDiv.querySelectorAll("."+args.join("."));
        if (els.length == 0) {
            var newDiv = document.createElement("div");
            newDiv.className = "plane-"+this.id;
            newDiv.className += " "+args.join(" ");
            this.assetDiv.appendChild(newDiv);
            return newDiv;
        } else return els[0];
    };
    this.getProperty = function (property) {
        var propTree = property.split(".");
        for (var i=0,c=this;i<propTree.length-1;i++) {
            c = c[propTree[i]];
            if (c === undefined) return;
        }
        return c[propTree[propTree.length-1]];
    };
    this.setProperty = function (property, value) {
        var propTree = property.split(".");
        for (var i=0,c=this;i<propTree.length-1;i++) {
            c = c[propTree[i]];
            if (c === undefined) return;
        }
        c[propTree[propTree.length-1]] = value;
        this.triggerNextUpdate = true;
    };
    this.hasUpdated = function () {
        var state = this.state, prev = this.previous, simple = this.settings.simple;
        if (!simple && this.canvas.width != window.innerWidth) return true;
        else if (!simple && this.canvas.height != window.innerHeight) return true;
        else if (this.triggerNextUpdate) {
            this.triggerNextUpdate = false;
            return true;
        }
        return false;
    };
    this.isPropLocked = function (property) {
        for (var i=0;i<this.animations.length;i++)
            if (this.animations[i].prop == property) return true;
        return false;
    };
    this.getAnimationIndexByProperty = function (property) {
        for (var i=0;i<this.animations.length;i++)
            if (this.animations[i].prop == property) return i;
        return -1;
    };
    this.animateProperty = function (property, end, pDuration, pFunc, pOnCompleted) {
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
    };
    this.loop = function () {
        // closure magic
        requestAnimationFrame(
            function (plane) {
                return function () {
                    plane.loop();
                }
            }(this)
        );
        if (!(this.previous.deltaCenter instanceof Vector2D)
            || !this.previous.deltaCenter.equals(this.state.deltaCenter))
            $(this.canvas).css("transform",
                "translateX("
                    + this.state.deltaCenter.x
                + "px) translateY("
                    + this.state.deltaCenter.y
                + "px)"
            );
        this.animate();
        if (this.hasUpdated()) this.draw();
        this.previous.center = this.state.center;
        this.previous.extents = this.state.extents;
        this.previous.startCenter = this.state.center;
        this.previous.deltaCenter = this.state.deltaCenter;
    };
    this.draw = function () {
        var simple = this.settings.simple;
        if (!simple) this.canvas.width = window.innerWidth;
        if (!simple) this.canvas.height = window.innerHeight;
        this.$.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.settings.scale.staySquare
            && !(this.settings.controls.xFixed
                || this.settings.controls.yFixed)
            ) this.keepExtentsSquare();
        if (this.settings.axes.visible) this.drawAxes();
        if (this.settings.scale.visible) this.drawScale();
        this.drawFunctions();
        if (!this.settings.simple) {
            var legend = this.getElement("legend");
            if (this.settings.legend.visible && legend.className.search(" show") == -1) $(legend).toggleClass("show", true);
            else if (!this.settings.legend.visible && legend.className.search(" show") != -1) $(legend).toggleClass("show", false);
            if (this.settings.legend.visible) this.populateLegend();
        }
    };
    this.animate = function () {
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
    };
    this.keepExtentsSquare = function (masterAxis) {
        var extents = this.state.extents;
        var center = this.state.center;
        var ratio = this.canvas.width / this.canvas.height;
        if ((extents.x / extents.y).fixFloat(2) == ratio.fixFloat(2)) return;
        if (masterAxis == "y") {
            extents.x = extents.y * ratio;
        }
        else {
            extents.y = extents.x / ratio;
        }
        this.previous.extentRatio = ratio;
        this.triggerNextUpdate = true;
    };
    this.getLocationOfCoordinate = function (coord, fixNum) {
        var set = this.settings, state = this.state;
        coord = this.helper.correctCoordinate(coord);
        var center = this.helper.correctCoordinate(state.center);
        return this.getFactor().multiply(state.extents.divide(2).subtract(center).add(coord)).fix(fixNum);
    };
    this.getCoordinateFromLocation = function (location, fixNum) {
        var set = this.settings, state = this.state;
        var center = this.helper.correctCoordinate(state.center);
        var coord = location.divide(this.getFactor()).subtract(state.extents.divide(2)).add(center);
        return this.helper.correctCoordinate(coord).fix(fixNum);
    };
    this.getFactor = function () {
        return new Vector2D(this.canvas.width, this.canvas.height).divide(this.state.extents);
    };
    this.populateLegend = function () {
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
                        if (lightIndex != index) plane.triggerNextUpdate = true;
                    }
                }(this));
                $(li).mouseleave(function (plane) {
                    return function (event) {
                        var index = plane.getHighlightedFunctionIndex();
                        if (index != -1) {
                            var func = plane.functions[index], set = plane.settings.functions;
                            func.highlighted = false;
                        }
                        plane.triggerNextUpdate = true;
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
                            case "edit": plane.editFunction(this.id); break;
                            default: TBI.log("I don't think anything's supposed to happen...");
                        }
                        plane.triggerNextUpdate = true;
                    }
                }(this));
            }
        }
    };
    this.editFunction = function (id) {
        CompanionDialogInit(this, "edit", id);
    };
    this.plotFunction = function (func, style, fuzz) {
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
    };
    this.plotPoints = function (points, style, fuzz) {
        // TODO: Support drawing plots a *lot* better.
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
    };
    this.drawFunctions = function () {
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
    };
    this.computeScale = function (factor, min, max) {
        var scale = 1;
        // decreasing scale (0.5, 0.2, 0.1)
        function decreaseScale() {
            while (factor * scale > max) {
                // divide until number you want to divide by breaks the limit
                if (factor * (scale / 2) <= max) scale /= 2;
                else if (factor * (scale / 5) <= max) scale /= 5;
                else scale /= 10;
            }
        }
        // increasing scale (2, 5, 10)
        function increaseScale() {
            while (factor * scale < min) {
                // divide until number you want to divide by breaks the limit
                if (factor * (scale * 2) >= min) scale *= 2;
                else if (factor * (scale * 5) >= min) scale *= 5;
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
    this.drawScale = function () {
        var set = this.settings.scale, axesSet = this.settings.axes, state = this.state;
        // where the origin is on the canvas, even if it is located off the screen
        var trueOrigin = this.getLocationOfCoordinate(new Coords(0, 0));
        // pixels per unit, as a coordinate value (x, y)
        var factor = this.getFactor();
        // infinite loop discouragement
        var infTries = 0;

        // scale represents each step of the x and y axes (e.g. scale = 1, 1, 2, 3; scale = 5, 5, 10, 15)
        var scaleX = this.computeScale(factor.x, set.minInterval, set.maxInterval);
        var scaleY = this.computeScale(factor.y, set.minInterval, set.maxInterval);
        var minorScaleX = this.computeScale(factor.x, set.minor.minInterval, set.minor.maxInterval);
        var minorScaleY = this.computeScale(factor.y, set.minor.minInterval, set.minor.maxInterval);

        // magnitude of the scale (0.1 -> 1, 0.01 -> 2)
        // used in correcting coordinate values
        var scaleXMagnitude = Math.ceil(Math.abs(Math.log10(scaleX).fixFloat()))+set.floatCompensation;
        var scaleYMagnitude = Math.ceil(Math.abs(Math.log10(scaleY).fixFloat()))+set.floatCompensation;
        var minorScaleXMagnitude = Math.ceil(Math.abs(Math.log10(minorScaleX).fixFloat()))+set.floatCompensation;
        var minorScaleYMagnitude = Math.ceil(Math.abs(Math.log10(minorScaleY).fixFloat()))+set.floatCompensation;

        // calculating the "origin" point on the canvas for the axes
        if (state.yFixed) var originX = state.yOnRight ? this.canvas.width - axesSet.margin.right : axesSet.margin.left;
        else originX = trueOrigin.x;
        if (state.xFixed) var originY = state.xOnTop ? axesSet.margin.top : this.canvas.height - axesSet.margin.bottom;
        else originY = trueOrigin.y;

        // calculating the start and end of the scale in coordinate form
        var xstart = this.getCoordinateFromLocation(new Vector2D(0 - (factor.x*scaleX), originY)).x;
        xstart = Math.ceil(xstart/scaleX)*scaleX;

        var xend = this.getCoordinateFromLocation(new Vector2D(this.canvas.width + (factor.x*scaleX), originY)).x;
        xend = Math.ceil(xend/scaleX)*scaleX;

        var ystart = this.getCoordinateFromLocation(new Vector2D(originX, this.canvas.height + (factor.y*scaleY))).y;
        ystart = Math.ceil(ystart/scaleY)*scaleY;

        var yend = this.getCoordinateFromLocation(new Vector2D(originX, 0 - (factor.y*scaleY))).y;
        yend = Math.ceil(yend/scaleY)*scaleY;

        // which side of the axis to put the scale labels on, x and y
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

        // shorthand for scale mark offsets
        var xHalfLength = new Vector2D(set.mark.length/2, 0);
        var yHalfLength = new Vector2D(0, set.mark.length/2);

        var minorXHalfLength = new Vector2D(set.minor.length/2, 0);
        var minorYHalfLength = new Vector2D(0, set.minor.length/2);

        // whether or not to include 0 as a scale mark
        var xZeroIsValid = state.xFixed;
        var yZeroIsValid = state.yFixed;

        // draw minor marks first
        if (set.minor.visible) {
            for (var j=xstart;j<xend;j+=minorScaleX) {
                if (minorScaleX < 1) j = j.fixFloat(minorScaleXMagnitude);
                // where the scale point is on the canvas
                var minorLoc = this.getLocationOfCoordinate(new Vector2D(j, 0));
                minorLoc.y = originY;

                // checking whether or not the scale mark is in an acceptable position
                // ignore the Math.bound part, that is pretty bogus

                var minorIsValid = j == Math.bound(j, j-minorScaleX/4, j+minorScaleX/4);
                if (state.yFixed && !axesSet.fixedIntersect) {
                    if (state.yOnRight && minorLoc.x > originX) minorIsValid = false;
                    else if (!state.yOnRight && minorLoc.x < originX) minorIsValid = false;
                }

                var gridStart = 0, gridEnd = this.canvas.width;
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

        // draw x axis
        for (var i=xstart,p=null;i<xend;i+=scaleX) {
            if (scaleX < 1) i = i.fixFloat(scaleXMagnitude);
            // the location of the scale mark on the canvas
            var loc = this.getLocationOfCoordinate(new Vector2D(i, 0));
            loc.y = originY;

            // figuring out where the grid should start and end
            // if the grid crosses a margin, make sure that it doesn't
            var gridStart = 0, gridEnd = this.canvas.width;
            if (state.xFixed && !axesSet.fixedIntersect) {
                if (state.xOnTop && gridStart < originY) gridStart = originY;
                if (!state.xOnTop && gridEnd > originY) gridEnd = originY;
            }

            // checking to see if the mark itself is inside of the margin
            var inMargin = false;
            if (state.yFixed && !axesSet.fixedIntersect) {
                if (state.yOnRight && loc.x > originX) inMargin = true;
                else if (!state.yOnRight && loc.x < originX) inMargin = true;
            }

            // combining this with checking to see if the scale mark
            // is zero, and whether or not that is wrong
            // (we shouldn't draw zero when the origin is visible, but
            // when in a margin, we don't want a gap in the grid lines)
            var isValid = !inMargin && (i != 0 || xZeroIsValid);

            if (set.grid.visible && isValid) this.helper.linePlot([
                new Vector2D(loc.x, gridStart),
                new Vector2D(loc.x, gridEnd)
            ], set.grid.width, set.grid.colour);

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

        if (set.minor.visible) {
            for (var j=ystart;j<yend;j+=minorScaleY) {
                if (minorScaleY < 1) j = j.fixFloat(minorScaleYMagnitude);
                var minorLoc = this.getLocationOfCoordinate(new Vector2D(0, j));
                minorLoc.x = originX;

                var minorIsValid = j == Math.bound(j, j-minorScaleY/4, j+minorScaleY/4);
                if (state.xFixed && !axesSet.fixedIntersect) {
                    if (state.xOnTop && minorLoc.y < originY) minorIsValid = false;
                    else if (!state.xOnTop && minorLoc.y > originY) minorIsValid = false;
                }

                var gridStart = 0, gridEnd = this.canvas.width;
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
    };
    this.drawFixedXAxis = function (xOnTop, yOnRight) {
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
    };
    this.drawFixedYAxis = function (xOnTop, yOnRight) {
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
    };
    this.drawXAxis = function (yOnRight) {
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
    };
    this.drawYAxis = function (xOnTop) {
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
    };
    this.drawAxes = function () {
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
            if (!set.xFixed) {
                if (origin.y < boundY) xOnTop = true;
                else if (origin.y > boundY) xOnTop = false;
            }

            if (!set.yFixed) {
                if (origin.x < boundX) yOnRight = false;
                else if (origin.x > boundX) yOnRight = true;
            }

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
    };
    this.bind = function (element, property) {
        TBI.toggleButton(element, this.getProperty(property));
        var handler = function (plane, prop) {
            return function () {
                plane.setProperty(prop, TBI.isToggled(this));
                plane.triggerNextUpdate = true;
                if (!isNull(gebn(this.name))) {
                    var alreadyDone = this.className.search("done") != -1;
                    if (!alreadyDone) {
                        $(gebn(this.name)).toggleClass("done", true);
                        $(gebn(this.name)).trigger("change");
                    }
                    $(this).toggleClass("done", false);
                }
            };
        }(this, property);
        $(element).click(handler);
        $(element).change(handler);

    };
    this.bindInput = function (element, property) {
        element.value = this.getProperty(property);
        $(element).change(
            function (plane, prop) {
                return function () {
                    var val = this.value;
                    if (parseFloat(val).toString() == val) val = parseFloat(val);
                    plane.setProperty(prop, val);
                    plane.triggerNextUpdate = true;
                }
            }(this, property)
        )
    };
    this.bindColourInput = function (element, property) {
        element.value = new Colour(this.getProperty(property)).toHex();
        $(element).change(
            function (plane, prop) {
                return function () { plane.setProperty(prop, new Colour(this.value)); plane.triggerNextUpdate = true; }
            }(this, property)
        );
    }
    this.zoom = function (factor, duration) {
        var set = this.settings.controls, animSet = this.settings.animation;
        var futureExtents = this.state.extents.multiply(factor);
        var clampd = futureExtents.clamp(set.minExtents, set.maxExtents);
        if (set.xFixed) clampd.x = this.state.extents.x;
        else if (set.yFixed) clampd.y = this.state.extents.y;
        // cplane.state.extents = clampd;
        this.animateProperty("state.extents", clampd, animSet.durations.zoom);
        // if (!set.fixedZoom && futureExtents.equals(clampd)) this.state.center = this.state.center.multiply(factor);
        if (!set.fixedZoom && futureExtents.equals(clampd)) this.animateProperty("state.center", this.state.center.multiply(factor), animSet.durations.zoom);
    };
    this.init(id, canvas, settings);
}
CrtPlane2.MasterSettings = {
    settings: {
        simple: false,
        axes: {
            width: 6
        },
        scale: {
            mark: {
                width: 4,
                length: 20
            },
            label: {
                size: 20,
                padding: 6
            },
            minor: {
                minInterval: 25,
                maxInterval: 35
            },
            minInterval: 75,
            maxInterval: 110
        },
        functions: {
            colours: [
                "#a00",
                "#0a0",
                "#00a",
                "#aa0",
                "#a0a",
                "#0aa",
                "#aaa"
            ]
        }
    },
    functions: [
        { func: new PolynomialFunc(3, 1/5, -3, -2) },
        { func: new RelationFunc(2, 3, 10) },
        { func: new MathFunction(function (x) { return Math.sin(x); }) },
        { func: new MathFunction(function (x) { return Math.pow(2, x); }) },
        { func: new PolarFunction(function (a) { return 2*Math.sin(4*a); }) },
        { func: new ParametricFunc.lissajous(0.4, 1) },
        { func: new ParametricFunc.Variable(function (t) { return Math.sin(this.a*t); }, function (t) { return Math.cos(this.b*t); }, 1, 0.9) }
    ]
};
CrtPlane2.SimpleSettings = {
    settings: {
        simple: true,
        axes: {
            width: 4
        },
        scale: {
            mark: {
                width: 1,
                length: 12
            },
            label: {
                size: 12,
                padding: 4,
                offset: new DirectionQuantity(18, 12)
            },
            minor: {
                minInterval: 15,
                maxInterval: 30
            },
            minInterval: 50,
            maxInterval: 90
        },
        functions: {
            colours: [
                "#555"
            ]
        }
    },
    functions: []
};
var cplane;
var companion;
$(document).on("pageload", function () {
    // let's get this party started
    cplane = new CrtPlane2("cplane", gebi("cplane"), false, CrtPlane2.MasterSettings);

    // START PANNING STUFF //
    // panning timer for redrawing after inactivity
    var panTimeout = null;

    // when the mouse clicks down on the plane
    $("#cplane").mousedown(function (event) {
        // get the current centre of the plne
        var center = cplane.state.center;
        // if the panning timer is set and not over...
        if (panTimeout instanceof TBI.Timer && !panTimeout.completed) {
            // perform its task
            panTimeout.finish();
            // and reset it (for a fresh, redrawn environment)
            panTimeout = null;
        }
        // if the centre property isn't already being used...
        if (!cplane.isPropLocked("state.center")) {
            // store the initial click point
            cplane.previous.mouseDown = new Vector2D(event.clientX, event.clientY);
            // and what the centre of the plane was at that time
            cplane.previous.startCenter = center;
        }
    });

    // when the mouse button is released over the plane...
    $("#cplane").mouseup(function () {
        // reset the variables to let the program know that panning has stopped
        cplane.previous.mouseDown = null;
        cplane.previous.startCenter = null;
    });

    // when the mouse is moving over the plane
    $("#cplane").mousemove(function (event) {
        // initial click point
        var mdown = cplane.previous.mouseDown;
        // initial centre at click point
        var startCenter = cplane.previous.startCenter;
        // if panning is currently underway
        if (!isNull(mdown) && !isNull(startCenter)) {
            // get the mouse point difference between the initial point and the current point
            var diff = cplane.helper.correctCoordinate(mdown.subtract(new Vector2D(event.clientX, event.clientY)));
            //                         ^ corrects to math x and y          ^ delta px (difference between initial and current)
            // temporarily move the canvas (CSS transform) to reflect the mouse displacement
            cplane.state.deltaCenter = cplane.helper.correctCoordinate(diff).negate();
            //                         to correct into CSS x and y ^           ^ and to go in the right direction
            // the new centre of the plane if panning were to stop
            var newCenter = startCenter.add(diff.divide(cplane.getFactor()));
            //              ^ initial centre at click point  ^ from px to coordinate difference

            // make sure to override the timer
            if (panTimeout instanceof TBI.Timer) panTimeout.clear();
            // after a period of panning inactivity
            panTimeout = new TBI.Timer(function (newCenter, event) {
                return function () {
                    // time to redraw the canvas
                    // reset the canvas's CSS transform
                    cplane.state.deltaCenter = new Vector2D(0, 0);
                    // and set the canvas centre
                    cplane.state.center = newCenter;
                    // if panning hasn't been terminated
                    if (!isNull(cplane.previous.mouseDown) && !isNull(cplane.previous.startCenter)) {
                        // make the initial point to where the mouse was when the plane was redrawn
                        cplane.previous.mouseDown = new Vector2D(event.clientX, event.clientY);
                        // canvas centre point, as well
                        cplane.previous.startCenter = newCenter;
                    }
                    // trigger an update
                    cplane.triggerNextUpdate = true;
                }
            }(newCenter, event), cplane.settings.controls.panTimeout, false);
        }
    });

    // when the "Reset To Origin" button is clicked...
    $(".pan-reset button").click(function () {
        var set = cplane.settings.animation;
        // animate the canvas centre back to the origin
        cplane.animateProperty("state.center", new Vector2D(0, 0));
    });
    // END PANNING STUFF //

    // START ZOOMING STUFF //
    // when the mousewheel is scrolled on the canvas
    $("#cplane").on("mousewheel", function (event) {
        var set = cplane.settings.controls;
        var delta = event.originalEvent.wheelDelta;
        // if scrolling forward, zoom in (decrease the coordinate/px factor)
        if (delta > 0) cplane.zoom(1/set.scrollZoomFactor);
        //                                ^ how strong the zooming should be
        // else we're scrolling backward; zoom out (increase the coordinate/px factor)
        else if (delta < 0) cplane.zoom(set.scrollZoomFactor);
    });

    // when the "Zoom In" button is clicked...
    $(".zoom-in button").click(function () {
        var set = cplane.settings.controls;
        // do what the button says
        cplane.zoom(1/set.buttonZoomFactor);
    });

    // when the "Zoom Out" button is clicked...
    $(".zoom-out button").click(function () {
        var set = cplane.settings.controls;
        // do what the button says
        cplane.zoom(set.buttonZoomFactor);
    });
    // END ZOOMING STUFF //

    // binds toggleable elements to boolean settings (simple)
    cplane.bind($(".show-axes button")[0], "settings.axes.visible"); // axis visibility
    cplane.bind($(".show-axes button")[0], "settings.scale.visible"); // scale visibility
    cplane.bind($(".show-legend button")[0], "settings.legend.visible"); // legend visibility

    // when the cursor leaves the legend
    $(".legend").mouseleave(function () {
        // get the highlighted func
        var index = cplane.getHighlightedFunctionIndex();
        // and if it exists...
        if (index != -1) {
            // make it un-highlighted
            var func = cplane.functions[index], set = cplane.settings.functions;
            func.highlighted = false;
        }
        // and trigger an update
        cplane.triggerNextUpdate = true;
    });

    // when the "+" add function button is clicked
    $(".add button").click(function () {
        CompanionDialogInit(cplane, "add", generateUUID());
    });

    $(".settings-icon button").click(function () {
        var settings = new TBI.Dialog("Settings", cplane.getElement("settings-dialog").innerHTML, TBI.DialogButtons.okCancel);
        TBI.updateUI();
        var settingInputs = $(".dialog *[data-plane-setting]");
        for (var i=0;i<settingInputs.length;i++) {
            var curr = settingInputs[i];
            if ((
                    (curr.nodeName.toLowerCase() == "button" || curr.type == "button")
                    && curr.className.search("toggle") != -1
                ) || (
                    curr.nodeName.toLowerCase() == "input"
                    && curr.type == "radio"
                ))
                cplane.bind(curr, curr.getAttribute("data-plane-setting"));
            else if (curr.nodeName.toLowerCase() == "input" && (
                curr.type == "color" || curr.className.search("fallback") != -1
            ))
                cplane.bindColourInput(curr, curr.getAttribute("data-plane-setting"));
            else if (curr.nodeName.toLowerCase() == "input")
                cplane.bindInput(curr, curr.getAttribute("data-plane-setting"));
        }
    });
});

// presents a dialog box with bindings to a specific plane
// which enables creation (type = "add") and editing (type = "edit") of
// functions on the plane. The ID is necessary when using type = "edit",
// as we need to know what function we are actually editing. Not recommended
// for type = "add", as we generate the ID instead.
function CompanionDialogInit(plane, type, id) {
    var title = "Add New Function";
    if (type == "edit") title = "Edit Function";
    // initiate the dialog
    var dia = new TBI.Dialog(title, cplane.getElement("comp-dialog").innerHTML, TBI.DialogButtons.okCancel);
    // and create a simple companion plane
    companion = new CrtPlane2("companion", $(".dialog #companion")[0], true, CrtPlane2.SimpleSettings);

    // when the dialog box is closed...
    dia.onclose = function (plane, type, id) {
        return function (result, event) {
            // and if the result is an "OK"...
            if (result == TBI.DialogResult.ok) {
                var entry = $(".dialog .comp-dia-entry.show")[0];
                var func = parseFunction(entry.getAttribute("data-plane-class"), parseInputs(entry));
                var styleEl = $(".dialog .comp-dia-style.changed");
                var style;
                if (styleEl.length > 0) style = styleEl[0].value;

                // AND if it retrieved the inputs and parsed them correctly
                if (func != null) {
                    // either add a new function
                    if (type != "edit") plane.addFunction(func, style);
                    else if (type == "edit") {
                        // or edit the current one
                        plane.functions[plane.getFunctionIndexById(id)].func = func;
                        if (!isNull(style)) plane.functions[plane.getFunctionIndexById(id)].style = style;
                    }
                    // trigger an update
                    cplane.triggerNextUpdate = true;
                }
            }
        }
    }(plane, type, id);

    // on zoom in button clicked
    $(".dialog .companion-container .zoom-in button").click(function () {
        var set = companion.settings.controls;
        companion.zoom(1/set.buttonZoomFactor);
    });

    // on zoom out button clicked
    $(".dialog .companion-container .zoom-out button").click(function () {
        var set = companion.settings.controls;
        companion.zoom(set.buttonZoomFactor);
    });

    // when the function class is changed (MathFunction, RelationFunc, ParametricFunc.ellipse, etc.)
    $(".dialog .comp-dia-class").on("input", function () {
        var dpc = "[data-plane-class='"+this.value+"']";
        // hide the current active input entry
        $(".dialog .comp-dia-entry.show").toggleClass("show", false);
        // and show the entry corresponding to the selected function class
        $(".dialog .comp-dia-entry"+dpc).toggleClass("show", true);
    });

    // when the function type is changed (cartesian, polar, parametric)
    $(".dialog .comp-dia-type").on("input", function () {
        var dpt = "[data-plane-type='"+this.value+"']";
        // hide the current active input entry AND the current active function class selector
        $(".dialog .comp-dia-class.show, .dialog .comp-dia-entry.show").toggleClass("show", false);
        // and show the corresponding function class selector
        $(".dialog .comp-dia-class"+dpt).toggleClass("show", true);
        // test to see if elements that require a selection need to be revealed or not
        $(".dialog .selection-required").toggleClass("show", this.value != "none");
        // trigger the function class selector
        $(".dialog .comp-dia-class.show").trigger("input");
    });

    // when the style has changed...
    $(".dialog .comp-dia-style").change(function () {
        // let me know
        $(this).toggleClass("changed", true);
    });

    // on instantiation, if the dialog is going to be used for editing purposes...
    if (type == "edit") {
        var currFuncObj = plane.functions[plane.getFunctionIndexById(id)];
        var currFunc = currFuncObj.func;
        var style = new Colour(currFuncObj.style).toHex();

        // trigger the function type and function class selectors appropriately
        $(".dialog .comp-dia-type").val(currFunc.type.toLowerCase());
        $(".dialog .comp-dia-type").trigger("input");
        $(".dialog .comp-dia-class.show").val(currFunc.className.toLowerCase());
        $(".dialog .comp-dia-class.show").trigger("input");

        var entry = $(".dialog .comp-dia-entry.show")[0];
        // check for function class validity (mostly occurs when I haven't put in the inputs yet)
        if (entry == undefined) {
            // let the user know what happened
            TBI.error("Not yet implemented: Editing of "+currFunc.className+" functions");
            // and close the box
            dia.close();
            return;
        }

        var inputs = entry.gecn("comp-dia-field");
        var inputArray = [];
        // pushes the values of the variables for
        // ParametricFunc.Variable based types
        function pfvFillIn(func) {
            for (var i=0,a=[];i<func.variables.length;i++)
                a.push(func[func.variables[i]]);
            return a;
        }
        // methods for creating the array of inputs for each function class
        if (currFunc instanceof LinearFunc) {
            inputArray = [currFunc.gradient, currFunc.yIntercept];
        } else if (currFunc instanceof PolynomialFunc) {
            // 0th degree, 1st degree, 2nd degree
            // index 0,    index 1,    index 2
            // x^0 (1),    x^1 (x),    x^2
            // 3rd input,  2nd input,  1st input
            // index 2,    index 1,    index 0
            // hence, we have to reverse the coefficients
            // because having degree 0 -> index 0 is way more helpful
            inputArray = currFunc.coefficients.copy().reverse();
            // add additional terms besides the three already present
            var maxTerm = entry.gecn("term").length;
            if (inputArray.length > maxTerm) addTerm(entry, inputArray.length - maxTerm);
        } else if (currFunc instanceof RelationFunc) {
            inputArray = [currFunc.a, currFunc.b, currFunc.c];
        } else if (currFunc instanceof ParametricFunc.ellipse) inputArray = pfvFillIn(currFunc);
        else if (currFunc instanceof ParametricFunc.lissajous) {
            inputArray = [currFunc.a, currFunc["σ"], currFunc.b];
        } else if (currFunc instanceof ParametricFunc.trochoid) inputArray = pfvFillIn(currFunc);
        else if (currFunc instanceof ParametricFunc.hypotrochoid) inputArray = pfvFillIn(currFunc);
        else if (currFunc instanceof ParametricFunc.butterfly) inputArray = pfvFillIn(currFunc);

        // if the methods before didn't catch the function (e.g. generic types)
        if (inputArray.length == 0) {
            // first, remove the "f(x) = " at the start, to allow for the HTML to deal with the header
            var truncd = currFunc.toString().replace(/f\([^\)]+\) ?= ?/, "");
            if (currFunc instanceof ParametricFunc.Variable) {
                // this removes the list of variables placed at the end
                truncd = currFunc.toString(false, true).replace(/f\([^\)]+\) ?= ?/, "");
                // gets rid of the parens around the two funcs
                inputArray = truncd.substring(1, truncd.length - 1).split(/, ?/);
                // assign an object with the keys being the variable names, and
                // the values being the variable values
                for (var i=0,o={};i<currFunc.variables.length;i++) {
                    var curr = currFunc.variables[i];
                    o[curr] = currFunc[curr];
                }
                // that will be our varObj
                inputArray.push(o);
            } else if (currFunc instanceof ParametricFunc) {
                // gets rid of the parens around the two funcs
                inputArray = truncd.substring(1, truncd.length - 1).split(/, ?/);
            // otherwise just accept the truncated string representation of the function
            } else inputArray = [truncd];
        }

        // where we assign the inputArray values to appropriate fields
        for (var i=0;i<inputArray.length&&i<inputs.length;i++) {
            // if the element is a <select> element
            // and the current array value is an object
            if (inputs[i].nodeName.toLowerCase() == "select"
                && typeof(inputArray[i]) == "object") {
                // take each object property
                for (var name in inputArray[i]) if (inputArray[i].hasOwnProperty(name))
                    // and apply it to the element by adding an <option>
                    addVariable(inputs[i], name, inputArray[i][name]);
            // otherwise set the field's value to the current array value
            } else inputs[i].value = inputArray[i];
        }

        // set the colour selection input
        $(".dialog .comp-dia-style").val(style);

        // now that that's over and done with, preview the function in the companion
        companionPreview(currFunc.className.toLowerCase(), parseInputs(entry), style);
    }

    // function that adds a term for PolynomialFunc functions
    // recursive, accepts the element containing the term elements
    // and the number of terms left to add
    function addTerm(el, n) {
        // if the number of terms left to add is not given, assume we just want one
        n = n || 1;
        // the highest term degree + 1
        var maxTerm = el.gecn("term").length;

        // if the element in question
        // (1) exists
        // and (2) actually contains span.term elements
        if (maxTerm > 0) {
            // take the highest term degree's element
            var termTemplate = el.gecn("term")[0];
            // and copy that element to...
            var newTerm = termTemplate.cloneNode(true);
            // increase the degree
            if (maxTerm > 1) newTerm.getn("sup")[0].innerText = maxTerm;
            else newTerm.getn("sup")[0].innerText = "";
            // and insert into the parent element as the highest degree term
            el.insertBefore(newTerm, termTemplate);
        }
        // decrement the number left to add (because we just added a term)
        n--;
        // recurse if there's still some terms left to add
        if (n > 0) addTerm(el, n);
    }

    // when the "Add Term" button is clicked
    $(".dialog .term-add").click(function () {
        // do what the button says
        addTerm(this.parentElement, 1);
    });

    // when the "Preview" button is clicked
    $(".dialog .comp-dia-preview").click(function () {
        var entry = $(".dialog .comp-dia-entry.show")[0];
        if (entry.length == 0) return;
        var parsedInputs = parseInputs(entry);
        var styleEl = $(".dialog .comp-dia-style.changed");
        // if the style has been changed...
        if (styleEl.length > 0)
            // show me what the func looks like with the style
            companionPreview(entry.getAttribute("data-plane-class"), parsedInputs, styleEl[0].value);
        // otherwise give me the default style
        else companionPreview(entry.getAttribute("data-plane-class"), parsedInputs);
    });

    // when the "Add Variable" button is clicked...
    $(".dialog .variable-select-add").click(function () {
        var select = $(".dialog .variable-select-select")[0];
        var name = $(".dialog .variable-select-name").val();
        var value = $(".dialog .variable-select-value").val();
        // do what the button says
        addVariable(select, name, value);
    });

    // function to add a dynamic variable in the form of an <option> element
    // with the variable name being the content and the value being encapsulated
    // in a data-value attribute on the <option> element. The element is to be
    // appended to a <select> element provided.
    function addVariable(select, name, value) {
        var option = document.createElement("option");
        // set the interior text
        option.innerHTML = name;
        // and unique value to the variable name
        option.value = name;
        // set the data-value attribute to the variable value
        option.setAttribute("data-value", value);
        // if an option for the current variable already exists...
        if ($(select).find("option[value='"+name+"']").length > 0)
            // remove it
            $(select).find("option[value='"+name+"']").remove();
        // let's see the results
        select.appendChild(option);
    }

    // when the variable value number box is changed
    $(".dialog .variable-select-value").change(function () {
        var selected = $(".dialog .variable-select-select option:selected")[0];
        // if the current value is a valid variable value, set the current variable's value
        if (!isNull(this.value)) selected.setAttribute("data-value", this.value);
        // else set the current value to zero
        else selected.setAttribute("data-value", "0");
    });

    // when the variable selector is changed
    $(".dialog .variable-select-select").change(function () {
        var selected = $(".dialog .variable-select-select option:selected")[0];
        var value = selected.getAttribute("data-value");
        // if the currently selected <option> is a real variable...
        if (selected.value != "none") {
            // set the value box
            $(".dialog .variable-select-value").val(value);
            // and hide the new variable form controls
            $(".dialog .variable-select-newonly").hide();
        }
        // otherwise it is the dummy "New Variable" option
        else {
            // unset the value box
            $(".dialog .variable-select-value").val("");
            // and show the new variable form controls
            $(".dialog .variable-select-newonly").show();
        }
    });

    // when the "Delete Selected Variable" button is clicked...
    $(".dialog .variable-select-delete").click(function () {
        var selected = $(".dialog .variable-select-select option:selected");
        if (selected.value == "none") return;
        // do what the button says
        $(".dialog .variable-select-select option:selected")[0].remove();
        $(".dialog .variable-select-select").trigger("change");
    });

    // this function takes the fields labeled as .comp-dia-field and parses their
    // values for use in creating a function
    function parseInputs(entry) {
        var className = entry.getAttribute("data-plane-class");
        var inputs = entry.gecn("comp-dia-field");
        var parsedInputs = [];
        for (var i=0;i<inputs.length;i++) {
            // if the current input is a number box, interpret the value as a number
            if (inputs[i].getAttribute("type") == "number") parsedInputs.push(parseFloat(inputs[i].value));
            // else if the current input is a <select> element
            else if (inputs[i].nodeName.toLowerCase() == "select") {
                // object that holds the name: value variable pairs
                var obj = {};
                var options = inputs[i].getn("option");
                // go through all the options in turn
                for (var j=0;j<options.length;j++) {
                    // make sure the current one is not the dummy option
                    if (options[j].value != "none")
                        // and interpret the data-value attribute of the <option> element
                        obj[options[j].innerHTML] = parseFloat(options[j].getAttribute("data-value"));
                }
                // this will be our varObj
                parsedInputs.push(obj);
            }
            // otherwise just interpret the value as-is (string inputs, etc.)
            else parsedInputs.push(inputs[i].value);
        }
        return parsedInputs;
    }

    // parses a function given its class and the array of input values
    // used in creating it
    function parseFunction(className, inputArray) {
        var func = null;
        try {
            // most entries are self-explanatory - they simply call their corresponding
            // functions with the appropriate numbers extracted from the inputArray.
            // The generic types need their string inputs to be parsed individually.
            switch (className) {
                case "mathfunction":
                    func = MathFunction.parse("f(x) = "+inputArray[0])
                break;
                case "polynomialfunc":
                    var pf = new PolynomialFunc;
                    // this simply calls PolynomialFunc() with the inputArray as the coefficients (we don't know
                    // how long it is)
                    PolynomialFunc.apply(pf, inputArray);
                    func = pf;
                break;
                case "linearfunc":
                    func = new LinearFunc(inputArray[0], inputArray[1]);
                break;
                case "relationfunc":
                    func = new RelationFunc(inputArray[0], inputArray[1], inputArray[2]);
                break;
                case "polarfunction":
                    func = PolarFunction.parse("f(a) = "+inputArray[0]);
                break;
                case "parametricfunc":
                    func = ParametricFunc.parse("f(t) = "+inputArray[0], "f(t) = "+inputArray[1]);
                break;
                case "parametricfunc_variable":
                    func = ParametricFunc.Variable.parse("f(t) = "+inputArray[0], "f(t) = "+inputArray[1], inputArray[2]);
                break;
                case "ellipse":
                    func = new ParametricFunc.ellipse(inputArray[0], inputArray[1]);
                break;
                case "lissajous":
                    func = new ParametricFunc.lissajous(inputArray[0], inputArray[2], inputArray[1]);
                break;
                case "trochoid":
                    func = new ParametricFunc.trochoid(inputArray[0], inputArray[1]);
                break;
                case "hypotrochoid":
                    func = new ParametricFunc.hypotrochoid(inputArray[0], inputArray[1], inputArray[2]);
                break;
                case "butterfly":
                    func = new ParametricFunc.butterfly(inputArray[0], inputArray[1]);
                break;
            }
            // test the function
            func.eval(2);
        } catch (e) {
            // uh oh, tell the user that it messed up
            TBI.error("The function could not be parsed: "+e.message);
            // and give a bogus value for the program
            return null;
        }
        // otherwise, it's a valid function
        return func;
    }

    // previews the function represented by the given class name, the array of inputs
    // and (optionally) the style of the function.
    function companionPreview(className, inputArray, style) {
        // get the function
        func = parseFunction(className, inputArray);
        // if it isn't a bogus value (meaning that the parse operation failed)
        if (func != null) {
            // reset the companion
            previewReset();
            // and preview the function on the companion plane
            companion.addFunction(func, style);
            // also provide a description of the function below the companion
            $(".dialog .companion-function").html(func.toString(true));
        }
    }

    // resets the companion (we don't want more than one function previewed at a time)
    function previewReset() {
        // silly me, thinking this would be more complicated
        companion.functions = [];
    }
}
