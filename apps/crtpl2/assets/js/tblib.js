'use strict';
// START INCOMPATIBILITY CODE //
document.onreadystatechange = function () {
    if (document.getElementsByTagName("html")[0].className.search("no-js") != -1) document.getElementsByTagName("html")[0].className = document.getElementsByTagName("html")[0].className.replace("no-js","js init");
    if (!window.jQuery) {
        document.body.innerHTML = "<P style='text-align:center;color:#333333;background:#EEEEEE;font-size:32px;padding:24px 48px;margin-top:300px;'>Your browser is too outdated to display this website properly. Please consider updating your browser to either <A href='http://google.com/chrome'>Google Chrome</A> or <A href='http://firefox.com'>Mozilla Firefox</A>.</P>";
    }
}
// END INCOMPATIBILITY CODE //
var TBI = { loaded: false};
var now = new Date(),
    query = {},
    path = [],
    notePrevInfo = {
        "head" : [],
        "text" : [],
        "type" : []
    };
// START CONSOLE NOTIFICATIONS //
TBI.log = function (message, timeout) {
    console.log(message);
    timeout = isNull(timeout) ? 30000 : timeout;
    TBI.notification("Log", message, timeout);
}
TBI.warn = function (message, timeout) {
    console.warn(message);
    timeout = isNull(timeout) ? 40000 : timeout;
    TBI.notification("Warning", message, timeout);
}
TBI.error = function (message, timeout) {
    console.error(message);
    var orig = message;
    if (typeof(message) == "object") message = message.message;
    timeout = isNull(timeout) ? 50000 : timeout;
    var onclick = "$($(this).parent()[0].getElementsByTagName(\"div\")[0]).slideToggle()";
    if (orig instanceof Error) {
        var stack = orig.stack ? orig.stack.replaceAll("<", "&lt;").replaceAll(">", "&gt;") : "";
        TBI.notification("Error",
            orig.message +
            "<button onclick='" + onclick + "'>Show/Hide Stack</button>\r\n" +
            "<div style='display:none'>" + stack + "</div>",
            timeout
        );
    } else TBI.notification("Error", message, timeout);
}
// END CONSOLE NOTIFICATIONS //
$(function () {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.search(/firefox/)!=-1)
        document.body.className += " gecko";
    else if (ua.search(/webkit/)!=-1)
        document.body.className += " webkit";
    else if (ua.search(/trident/)!=-1)
        document.body.className += " trident";
    else if (ua.search(/msie/)!=-1)
        document.body.className += " ie";
});
// Shorthand for document.getElementById.
function gebi(id) { return document.getElementById(id); }
HTMLElement.prototype.gebi = function (id) { return this.getElementById(id) }
// Shorthand for document.getElementsByClassName.
function gecn(className) { return document.getElementsByClassName(className); }
HTMLElement.prototype.gecn = function (className) { return this.getElementsByClassName(className) }
// Shorthand for document.getElementsByTagName.
function getn(tagName) { return document.getElementsByTagName(tagName); }
HTMLElement.prototype.getn = function (tagName) { return this.getElementsByTagName(tagName) }
// Shorthand for document.getElementsByName.
function gebn(name) { return document.getElementsByName(name); }
HTMLElement.prototype.gebn = function (name) { return this.getElementsByName(name) }
// Checks the state of an XHR.
function checkState(request) { return (request.readyState == request.DONE); }
// A XMLHttpRequest object constructor.
TBI.XHR = function () { return window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"); }
// An AJAX (Asynchronous JavaScript And XML) GET request constructor.
// When the infomation referred to in the url variable is loaded, func() is called.
TBI.AJAX = function (url, func) {
    var xhr = new TBI.XHR();
    xhr.open("GET", url, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (checkState(xhr)) {
            if (isNull(xhr.response)) xhr.response = xhr.responseText;
            if (func instanceof Function) func(xhr);
        }
    }
    return xhr;
}
// Sets up the query variable with the search criteria.
TBI.requestManager = function () {
    var search = location.search;
    if (!isNull(location.search)) {
        search = search.replace("?","").split("&");
        for (var i=0;i<search.length;i++) {
            search[i] = search[i].split("=");
            query[search[i][0]] = search[i][1];
        }
    }
    var hash = location.hash;
    if (!isNull(location.hash)) {
        hash = hash.replace("#","").split("&");
        for (var i=0;i<hash.length;i++) {
            hash[i] = hash[i].split("=");
            query[hash[i][0]] = hash[i][1];
        }
    }
    if (location.pathname.length > 1) {
        var pathname = location.pathname;
        if (pathname.indexOf("/") == 0)
            pathname = pathname.slice(1);
        if (pathname.lastIndexOf("/") == pathname.length-1)
            pathname = shorten(pathname, pathname.length-1);
        path = pathname.split("/");
    }
}
// Updates toggleable elements.
TBI.updateUI = function () {
    $("button.toggle").off("mousedown");
    $("button.toggle").mousedown(function (event) {
        if (event.button != 0 || this.className.search(" dwn") != -1) return true;
        var a = " dwn",
            c = this.className;
        this.className=c.search(a)!=-1?c:c+a;
    });
    $("button.toggle").off("mouseup");
    $("button.toggle").mouseup(function (event) {
        if (event.button != 0 || this.className.search(" dwn") == -1) return true;
        var a = " on",
            c = this.className.replace(" dwn","");
        this.className=c.search(a)!=-1?c.replace(a,""):c+a;
    });
    $(".up-down").off("mouseup");
    $(".up-down").mouseup(function (event) {
        if (event.button != 0) return true;
        var toSwitch = $($(this).attr("for"));
        if (toSwitch.length > 0) toSwitch.slideToggle();
        var a = " on",
            c = this.className;
        this.className=c.search(a)!=-1?c.replace(a,""):c+a;
    });
}
// Returns a string from the start of str that is num characters long.
function shorten(str, num) {
    var tempstr = [];
    if (str.length > 0 && !isNull(str)) {
        for (var i = 0; i < str.length; i++) {
            if (i < num) tempstr.push(str[i]);
            else if (i == num) return tempstr.join("");
        }
    }
}
// Pads a number to the specified length. Default is two (e.g. "2" to "02")
function zeroPrefix(num, len) {
    num = num.toString();
    while (num.length < (len?len:2)) num = "0" + num;
    return num;
}
// Determines whether or not a number is even.
function isEven(n) { return n%2==0 }
// Determines whether or not a variable is nothing at all.
function isNull(thing) {
    if (thing instanceof Array) {
        for (var i=0;i<thing.length;i++)
            if (isNull(thing[i])) return true;
        return (thing.length == 0)
    } else return (thing == undefined || thing === "" || thing == null || thing.toString() == "NaN")
}
// Determines whether a number is negative.
function isNegative(num) { return (Math.abs(num) != num); }
// Determines whether a one level array is equal to another.
function isEqual(arr1, arr2) {
    if (arr1 instanceof RegExp && arr2 instanceof RegExp) return arr1.source == arr2.source;
    else if (!(arr1 instanceof Array) || !(arr2 instanceof Array)) return arr1 == arr2;
    else if (arr1.length != arr2.length) return false;
    for (var i=0;i<arr1.length;i++) if (!isEqual(arr1[i], arr2[i])) return false;
    return true;
}
Object.prototype.toString = function () {
    if (JSON.stringify) return JSON.stringify(this);
    var s = "";
    for (var prop in this) if (this.hasOwnProperty(prop)) {
        if (isNull(this[prop])) s += prop+":"+(typeof(this[prop])=="string"?"":typeof(this[prop]))+",";
        else s += prop+":"+this[prop].toString()+",";
    }
    return "{"+s.substring(0, s.length-1)+"}";
}
Array.prototype.oldToString = Array.prototype.toString;
Array.prototype.toString = function () {
    return "[" + this.oldToString() + "]";
}
// Returns whether or not two arrays are the same.
Array.prototype.isEqual = function (arr) { return isEqual(this, arr); }
// Determines whether or not an array contains a particular item.
Array.prototype.contains = function (item) {
    for (var i=0;i<this.length;i++) if (isEqual(this[i], item)) return true; return false;
}
Array.prototype.reverse = Array.prototype.reverse || function () {
    for (var i=this.length-1,a=[];i>=0;i--) a.push(this[i]);
    return a;
}
Array.prototype.remove = Array.prototype.remove || function (index) {
    this.splice(index, 1);
    return this;
}
Array.prototype.copy = Array.prototype.copy || function () {
    for (var i=0,a=[];i<this.length;i++) a.push(this[i]);
    return a;
}
RegExp.quote = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
}
// Replaces all instances of a specified string or regular expression with the given replacement string.
String.prototype.replaceAll = String.prototype.replaceAll || function (toReplace, replacement) {
    if (typeof(toReplace) == "string") toReplace = new RegExp(RegExp.quote(toReplace), 'g');
    else if (toReplace instanceof RegExp) toReplace = new RegExp(toReplace.source, 'g');
    return this.replace(toReplace, replacement);
}
String.prototype.removeAll = function () {
    for (var i=0,s=this;i<arguments.length;i++)
        s = s.replaceAll(arguments[i], "");
    return s;
}
// Produces a string with characters in a reversed order.
String.prototype.reverse = String.prototype.reverse || function () {
    for (var i=this.length-1,s="";i>=0;i--) s += this.charAt(i);
    return s;
}
// Returns a bool indicating whether or not the current string contains str at the beginning.
String.prototype.beginsWith = String.prototype.beginsWith || function (str) {
    if (str.length > this.length) return false;
    return this.indexOf(str) == 0;
}
// Returns a bool indicating whether or not the current string contains str at the end.
String.prototype.endsWith = String.prototype.endsWith || function (str) {
    if (str.length > this.length) return false;
    return this.lastIndexOf(str) == this.length-str.length;
}
TBI.Timers = {};
// An externally edited replacement for setInterval.
TBI.timerSet = function (timer, seconds, func) {
    if (typeof (func) == "function") {
        $(document).on(timer + "_timertrig", func);
        TBI.Timers[timer] = setInterval(function () {
            $(document).trigger(timer + "_timertrig");
        }, seconds);
    }
    else {
        $(document).on(timer + "_timertrig", function () { return null });
        TBI.Timers[timer] = setInterval(function () {
            $(document).trigger(timer + "_timertrig");
        }, seconds);
    }
}
// Clears a timerSet.
TBI.timerClear = function (timer) {
    if (!isNull(TBI.Timers[timer])) {
        clearInterval(TBI.Timers[timer]);
        TBI.Timers[timer] = undefined;
        $(document).off(timer + "_timertrig")
    }
}
// non-recursive algorithm
function highestCommonFactor(a, b) {
    while (b != 0) {
        var c = a;
        a = b;
        b = c % b;
    }
    return a;
}
// Declares a fraction with a numerator and a denominator.
function Fraction(numerator, denominator) {
    this.numerator = numerator;
    this.denominator = denominator;
}
Fraction.prototype = {
    constructor: Fraction,
    simplify: function () {
        var factor = highestCommonFactor(this.numerator, this.denominator);
        return new Fraction(this.numerator/factor, this.denominator/factor);
    },
    multiply: function (frac2) {
        if (!(frac2 instanceof Fraction)) frac2 = new Fraction(frac2, 1);
        return new Fraction(this.numerator*frac2.numerator, this.denominator*frac2.denominator).simplify();
    },
    eval: function () { return this.numerator / this.denominator; }
};
// Declares an object of {x,y} to represent a coordinate value.
function Coords(x, y) {
    if (x instanceof Array) return new Coords(x[0], x[1]);
    this.x = x;
    this.y = y;
}
// Declares a coordinate value given a string as follows: "(x, y)".
Coords.parse = function (str) {
    var params = str.replaceAll(/[\(\)]/, "").split(/\, ?/);
    return new Coords(parseFloat(params[0]).fixFloat(), parseFloat(params[1]).fixFloat());
}
// Transforms coordinates into an array of [x,y].
Coords.prototype.toArray = function () { return [this.x,this.y] }
// Transforms coordinates into a string representation of "(x, y)".
Coords.prototype.toString = function (spacing) { return "("+this.x+","+(isNull(spacing)?" ":spacing?" ":"")+this.y+")" }
// Transforms cartesian coordinates into a polar form of (r, a).
Coords.prototype.toPolar = function () {
    return new PolarCoords(Math.pythagoras(this.x, this.y), Math.atan2(this.y, this.x));
}
Coords.prototype.toVector = function () { return new Vector2D(this.x, this.y); }
// Declares a set of polar coordinates as follows: {r,a}, where r is the radius and a is the azimuth.
function PolarCoords(radius, azimuth) {
    this.radius = radius;
    this.azimuth = azimuth;
}
// Declares a polar coordinate value using a string as follows: "(r, a)".
PolarCoords.parse = function (str) {
    var params = str.replaceAll(/[\(\)]/, "").split(/\, ?/);
    return new PolarCoords(params[0], params[1]);
}
// Transforms polar coordinates into a cartesian form of (x, y).
PolarCoords.prototype.toCartesian = function () {
    return new Coords(this.radius*Math.cos(this.azimuth), this.radius*Math.sin(this.azimuth));
}
// Transforms polar coordinates into a string representation of "(r, a)".
PolarCoords.prototype.toString = function () { return "("+this.radius+", "+this.azimuth+")" }
// Declares a line segment with the endpoints start and end.
function LineSegment(start, end) {
    if (!(start instanceof Coords) && !isNull(start[1])) start = new Coords(start[0], start[1]);
    if (!(end instanceof Coords) && !isNull(end[1])) end = new Coords(end[0], end[1]);
    this.start = start;
    this.end = end;
    this.length = Math.pythagoras(this.end.x-this.start.x, this.end.y-this.start.y);
    this.midpoint = new Coords(Math.mean([this.start.x, this.end.x]), Math.mean([this.start.y, this.end.y]));
    this.gradient = ((this.end.y-this.start.y) / (this.end.x-this.start.x)).fixFloat();
    // simple: m = rise/run
    // the trick is to use two points
    // take away the first point's y values from the second y value (rise)
    // and then divide that by the second x from the first x, same as the last step (run)
    // the .fix() is simply to reduce the chances of floating point errors
    // the formula is (y2-y1)/(x2-x1)
    this.yIntercept = this.start.y-(this.gradient*this.start.x);
    // pick a point, any point
    // I chose the "start" point, but it doesn't matter
    // the gradient was calculated previously with two of the points
    // simply take this point's y value
    // and take away from it the value of mx,
    // where m is the gradient and x is the x value of the point
    // the formula is y-mx
}
// Declares a line segment using a string of the form: "((x1,y1),(x2,y2))".
LineSegment.parse = function (str) {
    var params = str.replace("((", "(").replace("))", ")").split(/\), ?\(/);
    return new LineSegment(Coords.parse(params[0]), Coords.parse(params[1]));
}
// Finds the midpoint of a line segment.
LineSegment.prototype.midpoint = function () {
    return new Coords(Math.mean([this.start.x, this.end.x]), Math.mean([this.start.y, this.end.y]));
}
// Transforms a line segment into a linear function.
LineSegment.prototype.toLinear = function () { return new LinearFunc(this.gradient, this.yIntercept); }
// Transforms a line segment into a multi-dimensional array representation of [[x1,y1],[x2,y2]].
LineSegment.prototype.toArray = function () { return [[this.start.x, this.start.y], [this.end.x, this.end.y]]; }
// Transforms a line segment into a string representation of "((x1,y1),(x2,y2))".
LineSegment.prototype.toString = function (spacing) {
    var s = spacing ? " " : "";
    return "(" + this.start.toString(s==" ") + "," + s + this.end.toString(s==" ") + ")";
}
function Enum() {
    var removeDashes = function (str) {
        str = str.split("");
        for (var i=0,a=false,s="";i<str.length;i++) {
            if (a) {
                str[i] = str[i].toUpperCase();
                a = false;
            }
            if (str[i] == "-") a = true;
            else s += str[i];
        }
        return s;
    }
    for (var i=0;i<arguments.length;i++)
        this[removeDashes(arguments[i])] = arguments[i];
    if (Object.freeze) Object.freeze(this);
}
function MathFunction(evalFunc, type) {
    this.eval = evalFunc;
    this.type = type || MathFunction.Types.Cartesian;
    this.toString = function (useHTML) {
        return equationToString(this.eval, false, useHTML);
    }
}
MathFunction.Types = new Enum("Cartesian", "Polar", "Parametric");
function PolynomialFunc() {
    MathFunction.call(this, function (x) {
        this.correctCoefficients();
        var result = 0;
        for (var i=0;i<this.coefficients.length;i++)
            result += Math.pow(x, i) * this.coefficients[i];
        return result;
    }, MathFunction.Types.Cartesian);
    this.correctCoefficients = function () {
        for (var i=this.coefficients.length-1,r=false,a=[];i>=0;i--) {
            var curr = this.coefficients[i];
            if (curr != 0 || !isNaN(curr) || r) {
                if (isNaN(curr)) curr = 0;
                a.push(curr);
                r = true;
            }
        }
        this.coefficients = a.reverse();
    }
    var args = [];
    for (var i=0,r=false;i<arguments.length;i++) {
        if (arguments[i] != 0 || r) {
            args.push(arguments[i]);
            r = true;
        }
    }
    this.coefficients = args.reverse();
    this.correctCoefficients();
    this.toString = function (useHTML) {
        this.correctCoefficients();
        if (isNull(useHTML)) useHTML = false;
        var s = " ";
        var str = "";
        if (this.coefficients.length < 1) return "";
        for (var i=0;i<this.coefficients.length-1;i++) {
            var val = this.coefficients[i];
            if (val != 0) {
                var sign = "";
                switch (Math.sign(val)) {
                    case -1: sign = "-"; break;
                    case 0: sign = ""; break;
                    case 1: sign = "+"; break;
                }
                val = Math.abs(val);
                var variable = "";
                if (i == 0) variable = "";
                else if (i == 1) variable = "x";
                else if (useHTML) variable = "x<sup>"+i+"</sup>";
                else variable = "x^"+i;
                str = s+sign+s+(val == 1 ? "" : val.toString())+variable + str;
            }
        }
        var lastIndex = this.coefficients.length-1;
        var lastVal = this.coefficients[lastIndex];
        var variable = "";
        if (lastIndex == 0) variable = "";
        else if (lastIndex == 1) variable = "x";
        else if (useHTML) variable = "x<sup>"+i+"</sup>";
        else variable = "x^"+lastIndex;
        str = (lastVal == 1 ? "" : lastVal.toString())+variable + str;
        str = "f(x)" + s + "=" + s + str;
        return str;
    };
    var defineAliases = function (aliasObj) {
        for (var alias in aliasObj) if (aliasObj.hasOwnProperty(alias)) {
            Object.defineProperty(this, alias, {
                get: function (v) { return function () { return this.coefficients[v]; }; }(aliasObj[alias]),
                set: function (v) { return function (val) { this.coefficients[v] = val; }; }(aliasObj[alias])
            })
        }
        delete this.defineAliases;
    }
    Object.defineProperty(this, "defineAliases", {
        value: defineAliases,
        configurable: true,
        enumerable: false
    });
}
PolynomialFunc.prototype = Object.create(MathFunction.prototype);
function LinearFunc(gradient, yIntercept) {
    PolynomialFunc.call(this, gradient, yIntercept);
    this.defineAliases({
        "gradient": 1,
        "yIntercept": 0
    });
    this.intersection = function (f2) {
        if (!(f2 instanceof LinearFunc)) return null;
        var x = ((f2.yIntercept - this.yIntercept) / (this.gradient-f2.gradient)).fixFloat();
        return new Vector2D(x, this.eval(x));
    };
    this.multiply = function (f2) {
        if (f2 instanceof LinearFunc) return new QuadraticFunc(
            this.gradient*f2.gradient,
            this.yIntercept*f2.gradient+this.gradient*f2.yIntercept,
            this.yIntercept*f2.yIntercept
        );
        else return null;
    };
}
LinearFunc.prototype = Object.create(PolynomialFunc.prototype);
function QuadraticFunc(a, b, c) {
    if (a == 0) return new LinearFunc(b, c);
    PolynomialFunc.call(this, a, b, c);
    this.defineAliases({
        "a": 2,
        "b": 1,
        "c": 0
    });
    this.getSolution = function (sign) {
        return (
            -this.b // negative b
            + (sign)*Math.sqrt( // plus the plus/minus square root of
                Math.pow(this.b, 2) // b squared
                - 4 * this.a * this.c // minus 4 a c
            )
        ) / ( // over
            2 * this.a // 2 a
        );
    }
}
QuadraticFunc.prototype = Object.create(PolynomialFunc.prototype);
// ax + by = c
function RelationFunc(a, b, c) {
    MathFunction.call(this, function (x) {
        return this.gradient*x + this.yIntercept;
    }, MathFunction.Types.Cartesian);

    this.a = a;
    this.b = b;
    this.c = c;

    Object.defineProperty(this, "gradient", {
        get: function () { return -(this.a / this.b); }
    });
    Object.defineProperty(this, "yIntercept", {
        get: function () { return this.c / this.b; }
    });
    this.toLinear = function () {
        return new LinearFunc(this.gradient, this.yIntercept);
    };
    this.toString = function () {
        var s = " ";
        var str = "";
        var a = this.a;
        if (a != 0) {
            if (a == 1) a = "";
            else if (a == -1) a = "-";
            else a = a.toString();
            str += a + "x" + s;
        }
        var sign = isNegative(this.b) ? "-" : "+";
        var b = this.b;
        if (b != 0) {
            if (b == 1) b = "";
            else b = b.toString();
            str += sign + s + b + "y" + s;
        }
        str += s + "=" + s + this.c;
        return str;
    }
}
RelationFunc.prototype = Object.create(MathFunction.prototype);
function PolarFunction(func) {
    MathFunction.call(this, func, MathFunction.Types.Polar);
}
function ParametricFunc(xf, yf) {
    MathFunction.call(this, function (t) {
        return new Vector2D(this.xf(t), this.yf(t));
    }, MathFunction.Types.Parametric);
    this.xf = xf;
    this.yf = yf;
    this.toString = function (useHTML) {
        return "f(t) = ("+equationToString(this.xf, true, useHTML)+", "+equationToString(this.yf, true, useHTML)+")";
    }
}
ParametricFunc.prototype = Object.create(MathFunction.prototype);
// Declares a parametric function that generates an ellipse.
ParametricFunc.ellipse = function (a, b) {
    ParametricFunc.call(this,
        function (t) { return this.a*Math.cos(t); },
        function (t) { return this.b*Math.sin(t); }
    );
    this.a = a;
    this.b = b;
    this.toString = function () {
        return "f(t) = ("+this.a+"cos(t), "+this.b+"sin(t))";
    }
}
ParametricFunc.ellipse.prototype = Object.create(ParametricFunc.prototype);
// Declares a parametric function that generates a Lissajous curve.
ParametricFunc.lissajous = function (a, b, sigma) {
    ParametricFunc.call(this,
        function (t) { return Math.sin(this.a*t + this.sigma); },
        function (t) { return Math.sin(this.b*t); }
    );
    this.a = a;
    this.b = b;
    this.sigma = isNull(sigma) || isNaN(sigma) ? 0 : sigma;
    this.toString = function () {
        return "f(t) = (sin("+this.a+"t"+(this.sigma == 0 ? "" : " + "+this.sigma)+"), sin("+this.b+"t))";
    }
}
ParametricFunc.lissajous.prototype = Object.create(ParametricFunc.prototype);
// Declares a parametric function that generates a trochoid.
ParametricFunc.trochoid = function (a, b) {
    ParametricFunc.call(this,
        function (t) { return this.a*t - this.b*Math.sin(t); },
        function (t) { return this.a - this.b*Math.cos(t); }
    );
    this.a = a;
    this.b = b;
}
ParametricFunc.trochoid.prototype = Object.create(ParametricFunc.prototype);
// Declares a parametric function that generates a hypotrochoid.
ParametricFunc.hypotrochoid = function (R, r, d) {
    ParametricFunc.call(this,
        function (t) { var a = this.R - this.r; return a*Math.cos(t) + this.d*Math.cos(a/r*t); },
        function (t) { var a = this.R - this.r; return a*Math.sin(t) - this.d*Math.sin(a/r*t); }
    );
    this.R = R;
    this.r = r;
    this.d = d;
}
ParametricFunc.hypotrochoid.prototype = Object.create(ParametricFunc.prototype);
// because why not? I'm using UTF-8 anyway
var π = Math.PI;
// Transforms an equation into a string representation.
Function.equationToString = function (func, toReplace, replacement) {
    return equationToString(func);
}
// Magic. Obfuscated to f**k.
// Takes all instances of function r with b brackets and
// interior regex specification n in s and replaces them with t.
//               s                 r                      n                          t         b
// e.g. "sin<84 * sin<2x + 4>>", "sin", "([0-9])([a-z]) ?[\\+\\-\\*\\/] ?([0-9])", "$1, $2, $3", "<>"
// returns "sin<84 * 2, x, 4>"
function replaceNestedFunctions(s, r, n, t, b) {
    var q = RegExp.quote(r);
    if (isNull(b)) b = "()";
    var c = [RegExp.quote(b[0]), RegExp.quote(b[1])];
    for (var i=0,s2="",d=[],u="\uFFFF",l=0,f=[];i<s.length;i++) {
        if (s2.lastIndexOf(r) != -1 && s2.lastIndexOf(r) == s2.length-r.length) {
            s2 += u+l+u;
            d.push(l);
        }
        if (s[i] == b[0]) l++;
        if (s[i] == b[1] && d.indexOf(--l) != -1) {
            f.push(l);
            d = d.remove(d.indexOf(l));
            s2 += u+l+u;
        }
        s2 += s[i];
    }
    for (var i=0;i<f.length;i++) {
        var h = u+f[i]+u;
        s2 = s2.replace(new RegExp(r+h+c[0]+n+h+c[1], 'g'), t);
    }
    s2 = s2.replace(new RegExp("\uFFFF[0-9]+\uFFFF", 'g'), "");
    return s2;
};
function equationToString(func, noHeader, useHTML) {
    if (isNull(useHTML)) useHTML = false;
    var str = func.toString();

    str = str.replaceAll(/\t/, "    ");
    str = str.replaceAll(/\r?\n/, " ");
    str = str.replaceAll(/  +/, " ");
    str = str.replaceAll(/((\() +| +(\)))/, "$2")
    str = str.replaceAll(/ *(f)unction ?(\([^\)]*\)) ?\{ ?(return )?/, noHeader ? "" : "$1$2 = ");
    str = str.removeAll(/ ?return ?/);
    str = str.replaceAll(/\; ?\, ?/, ", ");
    str = str.replaceAll(/(([A-Za-z_]|\\[0-9])+)([0-9])([A-Za-z0-9_]*)\(/, "$1\\$3$4(");
    str = str.replaceAll(/([A-Za-z_]+) ?\* ?([0-9]+)/, "$2$1");
    str = str.replaceAll(/([^0-9]) *\* *([^A-Za-z_])/, "$1$2");
    str = str.replaceAll(/([^A-Za-z_]) *\* *([^0-9])/, "$1$2");
    str = str.replaceAll(/\\([0-9])/, "$1");
    str = str.removeAll("Math.");
    str = str.removeAll(/;? ?\} */);
    str = replaceNestedFunctions(str, "pow", "([^,]+), ?(.*?)", useHTML?"$1<sup>$2</sup>":"$1^$2");
    str = str.replaceAll(/[pP][iI]/, "π");
    return str;
}
MathFunction.parse = function (str, type) {
    str = str.replaceAll("pi", "π");
    str = str.replaceAll(/(^ *| *$)/, "");
    if (str.search(/^f\([^\)]*/) == -1) str = "f(x) = " + str;
    str = str.replaceAll(/^f(\([^\)]*\)) ?= ?/, "function $1 { return ");
    str = str.replaceAll(/(([A-Za-z_]|\\[0-9])+)([0-9])([A-Za-z0-9_]*)\(/, "$1\\$3$4(");
    str = str.replaceAll(/([0-9π\)]+)([\(a-zA-Z]+)/, "$1*$2");
    str = str.replaceAll(/([a-zA-Z\)]+)([0-9π]+)/, "$1*$2");
    str = str.replaceAll(/\\([0-9])/, "$1");
    str = str.replaceAll(/([0-9a-zA-Z\.]+)\^(([0-9a-zA-Z\.]+|\([^\)]+?\)))/, "Math.pow($1,$2)");
    str = str.replace(/$/, "; }");
    var funcs = str.match(/[a-zA-Z_][a-zA-Z0-9_]*\(/);
    TBI.log(funcs);
    if (funcs != null) for (var i=0;i<funcs.length;i++)
        if (typeof(Math[funcs[i].removeAll("(")]) != "undefined")
            str = str.replaceAll(new RegExp("([^\\.])("+RegExp.quote(funcs[i])+")", 'g'), "$1Math.$2");
    try {
        var func = null;
        eval("func = "+str);
        func(1);
    } catch (e) {
        TBI.error(e);
        return null;
    }
    return new MathFunction(func, isNull(type) ? MathFunction.Types.Cartesian : type);
}
// Declares a function using a string as input.
String.parseFunction = function (text) {
    var val = (text
        .replaceAll("pi", "π")
        .replaceAll(/([0-9π\)]+)([\(a-zA-Z]+)/, "$1*$2")
        .replaceAll(/([a-zA-Z\)]+)([0-9π]+)/, "$1*$2")
        .replaceAll("π", "Math.PI")
        .replaceAll(/(([^a-zA-Z\.]|^))e/, "$1Math.E")
        .replaceAll(/([0-9a-zA-Z\.]+)\^(([0-9a-zA-Z\.]+|\([^\)]+?\)))/, "Math.pow($1,$2)")
        .replaceAll(/([^\.a])(a?(sin|cos|tan))/, "$1Math.$2"));
    var regex = /f\(([a-zA-Z_]([a-zA-Z0-9_]+)?)\) ?= ?/,
        typestr = "";
    if (val.search(regex) != -1) typestr = val.match(regex)[1];
    else typestr = "x";
    val = val.replaceAll(regex, "");
    try {
        eval("var func = function ("+typestr+") { return "+val+" }");
        func(1);
    } catch (e) { TBI.error(e); return null; }
    return func;
}
// A 2 dimensional vector quantity.
function Vector2D(x, y) { this.x = x; this.y = y; }
Vector2D.fromPolar = function (azimuth, radius) { return new Vector2D(radius*Math.sin(azimuth), radius*Math.cos(azimuth)); };
Vector2D.prototype = {
    constructor: Vector2D,
    // Create a copy of the vector that won't change the original.
    copy: function () { return new Vector2D(this.x, this.y); },
    // add, subtract and multiply are self-explanatory.
    add: function (a) { if (a instanceof Vector2D) return this.addVector(a); else return this.addScalar(a); },
    // note: "scalar" here just means "number", as in "not vector".
    addScalar: function (n) { return new Vector2D(this.x + n, this.y + n); },
    addVector: function (vec) { return new Vector2D(this.x + vec.x, this.y + vec.y); },
    subtract: function (a) { if (a instanceof Vector2D) return this.subtractVector(a); else return this.subtractScalar(a); },
    subtractScalar: function (n) { return new Vector2D(this.x - n, this.y - n); },
    subtractVector: function (vec) { return new Vector2D(this.x - vec.x, this.y - vec.y); },
    // Returns the magnitude of the vector.
    magnitude: function () { return Math.pythagoras(this.x, this.y); },
    // Returns the square of the magnitude of the vector (less computationally intensive).
    magnitudeSquared: function () { return this.dot(this); },
    // Changes the vector into a unit vector.
    normalise: function () { var mag = this.magnitude(); this.x /= mag; this.y /= mag; return this; },
    inverse: function () { return new Vector2D(1/this.x, 1/this.y); },
    // Rotates the vector into the first quadrant (++).
    absolute: function () { return new Vector2D(Math.abs(this.x), Math.abs(this.y)); },
    multiply: function (a) { if (a instanceof Vector2D) return this.multiplyVector(a); else return this.multiplyScalar(a); },
    multiplyScalar: function (n) { return new Vector2D(this.x * n, this.y * n); },
    multiplyVector: function (vec) { return new Vector2D(this.x * vec.x, this.y * vec.y); },
    divide: function (a) { if (a instanceof Vector2D) return this.divideVector(a); else return this.divideScalar(a); },
    divideScalar: function (n) { return this.multiply(1/n); },
    divideVector: function (vec) { return this.multiply(vec.inverse()); },
    negate: function () { return this.multiply(-1); },
    // Returns the dot product of two vectors.
    dot: function (vec) { return this.x*vec.x + this.y*vec.y; },
    // Returns the wedge product of two vectors.
    wedge: function (vec) { return this.x*vec.y - this.y*vec.x; },
    // Clamps the vector's x and y values to a minimum and maximum vector.
    clamp: function (min, max) { return new Vector2D(Math.bound(this.x, min.x, max.x), Math.bound(this.y, min.y, max.y)); },
    toMatrix: function () { return new Matrix([this.x, this.y]); },
    toCoords: function () { return new Coords(this.x, this.y); },
    // Returns the angle formed by the vector with the positive X axis.
    angle: function () { return Math.atan2(this.y, this.x); },
    // Projects the vector onto another.
    project: function (vec) { return vec.multiplyScalar(this.dot(vec)/vec.dot(vec)); },
    // Gets the normal of a vector.
    normal: function (dir) { if (dir) return new Vector2D(-this.y, this.x); else return new Vector2D(this.y, -this.x); },
    equals: function (vec) { return this.x == vec.x && this.y == vec.y; },
    fix: function (num) { return new Vector2D(this.x.fixFloat(num), this.y.fixFloat(num)); },
    toString: function (spacing) { if (isNull(spacing)) spacing = true; var s = spacing ? " " : ""; return "("+this.x+","+s+this.y+")"; },
};
// Returns a random positive integer below the specified number.
function randomInt(num) { return parseInt(Math.random()*num) }
// Returns a random integer between two numbers.
function advRandomInt(num1, num2) { return parseInt(Math.random()*(num2-num1))+num1; }
// For legacy applications.
function intRand(num) { return randomInt(num) }
// Degrees to radians.
function dtr(deg) { return (Math.PI/180)*deg }
// Radians to degrees.
function rtd(rad) { return (180/Math.PI)*rad }
// Location of a point on a circle's circumference.
function circlePoint(a, r, x, y) { return new Vector2D((x||0)+r*Math.cos(dtr(a)),(y||0)+r*Math.sin(dtr(a))) }
// Formula for the circumference of a circle with the specified radius r.
function circum(r) { return 2*Math.PI*r }
// Formula for calculating the hypotenuse length of a right angled triangle, given sides a and b.
// If mode is true, it returns the remaining side length given a side length and the hypotenuse length.
Math.pythagoras = function (arg0, arg1, mode) {
    if (mode && arg0 > arg1) return Math.sqrt((arg0*arg0)-(arg1*arg1));
    else if (mode && arg0 < arg1) return Math.sqrt((arg1*arg1)-(arg0*arg0));
    else if (Math.hypot) return Math.hypot(arg0, arg1);
    else return Math.sqrt((arg0*arg0)+(arg1*arg1)).fixFloat();
}
// Splices an element and returns the array while preserving the original.
function splice(list, index, howMany) {
    var newlist = [];
    for (var i=0;i<list.length;i++)
        if (!(i >= index && i < index+howMany)) newlist.push(list[i]);
    return newlist;
}
// A function to compare often inaccurate floating-point values by measuring their difference against an immesurably small value.
Number.prototype.isFloatEqual = function (num) { return Math.abs(num - this) < Number.EPSILON }
// Fixes a malfunctioning floating-point value (e.g. 2.999999999995) by slightly reducing its precision.
Number.prototype.fixFloat = function (num) { return parseFloat(this.toPrecision(num?(num<13?num:12):12)) }
// Fixes a malfunctioning modulo function by fixing the arguments and the result.
Number.prototype.fixMod = function (mod, num) {
    var temp = (this.fixFloat(num) % mod.fixFloat(num)).fixFloat(num);
    if (temp.isFloatEqual(mod)) return 0;
    else return temp;
}
function createCodedStream(str, radix, len, delimit) {
    if (isNull(len)) delimit = true;
    var characters = str.split("");
    for (var i=0,s="";i<characters.length;i++) {
        var charCode = characters[i].charCodeAt();
        s += transformDecimal(charCode, radix, len);
        if (delimit && i != characters.length-1) s += " ";
    }
    return s;
}
function translateCodedStream(str, radix, len) {
    if (isNull(radix)) return "";
    var codes = [];
    if (isNull(len)) codes = str.split(/\W+/);
    else codes = str.split(new RegExp("(\\w{"+len+"})\\W*"));
    for (var i=0,s="";i<codes.length;i++) {
        if (codes[i] != "") {
            var character = String.fromCharCode(parseInt(codes[i], radix));
            s += character;
        }
    }
    return s;
}
function transformDecimal(num, radix, len) {
    var sign = "",
        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (isNull(num) ||
        isNull(radix) ||
        Math.bound(radix, 2, chars.length) != radix) return "";
    if (isNegative(num)) {
        num = Math.abs(num);
        sign = "-";
    }
    var currPlace = num % radix,
        nextPlace = Math.floor(num / radix);
    if (nextPlace < 1) return chars[currPlace];
    else return sign+zeroPrefix(transformDecimal(nextPlace, radix) + chars[currPlace], len || 0);
}
function sort(list) {
    var a = [],
        placeFromBottom = function (value) { // 2 into [1,1,2,4,5,8,9]
            for (var j=0,n=-1;j<a.length;j++) { // start at 0
                if (value >= a[j]) n = j; // try until n = 2
                else break;
            }
            if (n == -1) a.unshift(value); // if test fails
            else a.splice(n+1, 0, value); // shift after n
        },
        placeFromTop = function (value) { // 5 into [2,2,3,4,4,5,7,8,9]
            for (var j=a.length-1,n=-1;j>=0;j--) { // start at top
                if (value <= a[j]) n = j; // try until index = 4
                else break;
            }
            if (n == -1) a.push(value); // if test fails
            else a.splice(n, 0, value); // shift after n
        };
    for (var i=0;i<list.length;i++) {
        if (a.length == 0) a.push(list[i]);
        else if (list[i] <= a[Math.floor(a.length/2)]) placeFromBottom(list[i]);
        else placeFromTop(list[i]);
    }
    return a;
}
// Bounds a number by returning the low value if it is lower than it, and returns the high value if it is higher than it.
Math.bound = function (num, low, high) {
    low = isNull(low) ? -Infinity : low;
    high = isNull(high) ? Infinity : high;
    return num < low ? low : num > high ? high : num;
}
// Creates a customizable, absolutely positioned popup element.
// There can only be one at a time.
TBI.Popup = function (x, y, head, text) {
    this.x = x;
    this.y = y;
    this.head = head;
    this.text = text;
    var body = $('body');
    var pup = "";
    pup += "<div class='popup' style='top:"+this.y+"px;left:"+this.x+"px;'>";
    if (!isNull(this.head)) pup += "<h3>"+this.head+"</h3>";
    pup += this.text;
    pup += "</div>";
    $(".popup").remove();
    body.append(pup);
    if (parseInt($(".popup").css("width"))+parseInt($(".popup").css("left"))+40 > window.innerWidth) {
        $(".popup").attr("class", $(".popup").attr("class") + " right");
        $(".popup").css("left", (parseInt($(".popup").css("left")) - parseInt($(".popup").css("width")) - 40) + "px");
    }
    if (parseInt($(".popup").css("height"))+parseInt($(".popup").css("top"))+40 > window.innerHeight) {
        $(".popup").attr("class", $(".popup").attr("class") + " bottom");
        $(".popup").css("top", (parseInt($(".popup").css("top")) - parseInt($(".popup").css("height")) - 80) + "px");
    }
}
TBI.Popup.registry = [];
// Adds a popup when hovering over a specified element.
TBI.Popup.registry.add = function (element, head, text) {
    if (element instanceof HTMLElement) {
        if (element.id == null) element.id = btoa(new Date().getTime()*Math.random()).reverse().substring(0, 15);
        TBI.Popup.registry.push([element, head, text]);
        $(element).off("mousemove");
        $(element).mousemove(function (event) {
            var thisReg = [];
            for (var i=0;i<TBI.Popup.registry.length;i++)
                if (TBI.Popup.registry[i][0] == $(this)[0])
                    thisReg = TBI.Popup.registry[i];
        new TBI.Popup(event.clientX+20, event.clientY+20, thisReg[1], thisReg[2]);
        });
        $(element).mouseleave(function () {
            $('.popup').remove();
        });
    } else if (element instanceof Array) {
        element.forEach(function (el) { TBI.Popup.registry.add(el, head, text) });
    } else {
        throw new Error("Supplied element is invalid.");
    }
}
// Removes an element from the registry.
TBI.Popup.registry.remove = function (element) {
    for (var i=0;i<TBI.Popup.registry.length;i++)
        if (TBI.Popup.registry[i][0].id == $(element)[0].id)
            TBI.Popup.registry[i] = undefined;
    $(element).off("mousemove");
}
// A predefined popup element that can be added to by using the same header.
TBI.notification = function (group, text, timeout) {
    var groupId = "note-group-"+group.toLowerCase(),
        noteGroup = $("#"+groupId),
        noteGroupList = $("#"+groupId+" li");
    if ($("#note-holder").length == 0) $("body").append("<div id='note-holder'><div id='note-holder-inner'></div></div>");
    if (noteGroup.length == 0) {
        var buttonText = "<button onclick='$(this).parent().remove()'>Dismiss</button>";
        $("#note-holder-inner").append("<div class='note' id='"+groupId+"'><h3>"+group+"</h3><ul></ul>"+buttonText+"</div>");
    }
    if (noteGroupList.length > 0) {
        var el = noteGroupList[noteGroupList.length-1];
        if (el.innerHTML == text) {
            if (isNull(el.dataset.instances)) el.dataset.instances = 1;
            el.dataset.instances++;
        } else $("#"+groupId+" ul").append("<li>"+text+"</li>");
    } else $("#"+groupId+" ul").append("<li>"+text+"</li>");
    TBI.timerClear("noteRemove-"+group.toLowerCase());
    var nRemoveTotal = 0;
    TBI.timerSet("noteRemove-"+group.toLowerCase(), 10, function () {
        if (nRemoveTotal > timeout) {
            $("#"+groupId).remove();
            TBI.timerClear("noteRemove-"+group.toLowerCase());
        } else nRemoveTotal += 10;
    });
}
// Changes the specified toggleable element either according to the boolean value passed to it, or simply toggles it.
TBI.toggleButton = function (element, bool) {
    if (!isNull(element[0]) && element[0] instanceof HTMLElement) element = element[0];
    if (!element instanceof HTMLElement) return null;
    else if (!isNull(element.checked)) return element.checked = isNull(bool)?!element.checked:bool;
    var isToggled = TBI.isToggled(element);
    if (!isToggled && bool !== false) { element.className += " on"; }
    else if (isToggled && bool !== true) { element.className = element.className.replace(" on",""); }
    if (!isNull(bool) && bool !== isToggled || isNull(bool)) $(element).click();
    return TBI.isToggled(element);
}
// Returns whether or not a specified toggleable element is toggled or not.
TBI.isToggled = function (element) { return isNull(element.checked)?element.className.search(" on") != -1:element.checked; }
TBI.getRadioInput = function (name) {
    var inputs = document.querySelectorAll("input[type='radio'][name='"+name+"']");
    for (var i=0;i<inputs.length;i++)
        if (inputs[i].checked) return inputs[i].value;
    return null;
}
// Generates a desktop notification outside of the regular environment.
function Note(img, title, desc, link) {
    if (isNull(window.Notification)) return null;
    var note = {title:title,body:desc,icon:img,lang:"en"};
    if (!isNull(link))
        note.onclick = function () {
            window.open(link);
            note.close();
        }
    new Notification(title, note);
}
TBI.Dialog = function (header, body, buttons) {
    this.header = header;
    this.body = body;
    this.buttons = buttons || "ok";
    var diaDiv = document.createElement("div");
    diaDiv.className = "dialog";
    diaDiv.className += " dbuttons-"+this.buttons;
        var diaHeader = document.createElement("div");
        diaHeader.className = "dialog-header";
        var diaHeaderLoc = null,
            diaHeaderTransform = null;
        diaHeader.onmousedown = function (event) {
            diaHeaderLoc = new Vector2D(event.clientX, event.clientY);
            diaHeaderTransform = this.parentElement.style.transform;
            if (diaHeaderTransform == "") diaHeaderTransform = "translateX(0px) translateY(0px)";
        }
        diaHeader.onmousemove = function (event) {
            if (diaHeaderLoc != null) {
                var loc = new Vector2D(event.clientX, event.clientY).subtract(diaHeaderLoc);
                var xMatch = diaHeaderTransform.match(/translateX\((.*?)px\)/);
                var yMatch = diaHeaderTransform.match(/translateY\((.*?)px\)/);
                var currX = isNull(xMatch) ? 0 : parseInt(xMatch[1]);
                var currY = isNull(yMatch) ? 0 : parseInt(yMatch[1]);
                var curr = new Vector2D(currX, currY).add(loc);
                this.parentElement.style.transform = diaHeaderTransform
                    .replace(/translateX\(.*?\)/, "translateX("+curr.x+"px)")
                    .replace(/translateY\(.*?\)/, "translateY("+curr.y+"px)");
            }
        }
        diaHeader.onmouseup = function () {
            diaHeaderLoc = null;
            diaHeaderTransform = null;
        }
        diaHeader.onmouseleave = diaHeader.onmouseup;
            var diaHeaderText = document.createElement("h2");
            diaHeaderText.innerHTML = this.header;
        diaHeader.appendChild(diaHeaderText);
            var diaHeaderButtons = document.createElement("div");
            diaHeaderButtons.className = "dialog-header-buttons";
                var diaHeaderClose = document.createElement("button");
                diaHeaderClose.className = "dialog-header-close";
                diaHeaderClose.innerHTML = "\u2716";
                diaHeaderClose.onclick = function (dialog) {
                    return function (event) {
                        dialog.close(event);
                    };
                }(this);
            diaHeaderButtons.appendChild(diaHeaderClose);
        diaHeader.appendChild(diaHeaderButtons);
    diaDiv.appendChild(diaHeader);
        var diaBody = document.createElement("div");
        diaBody.className = "dialog-body";
        diaBody.innerHTML = body;
    diaDiv.appendChild(diaBody);
        var diaControl = document.createElement("div");
        diaControl.className = "dialog-control";
        var diaControlButtons = ["OK", "Cancel", "Apply", "Abort", "Retry", "Fail"];
        for (var i=0;i<diaControlButtons.length;i++) {
            var button = document.createElement("button");
            button.className = "dialog-"+diaControlButtons[i].toLowerCase();
            button.innerHTML = diaControlButtons[i];
            diaControl.appendChild(button);
        }
        var clickEvent = function (dialog) {
            return function (event) {
                dialog.close(event);
            };
        }(this);
        var okButton = diaControl.gecn("dialog-ok")[0];
        okButton.onclick = clickEvent;
        var cancelButton = diaControl.gecn("dialog-cancel")[0];
        cancelButton.onclick = clickEvent;
        var applyButton = diaControl.gecn("dialog-apply")[0];
        applyButton.onclick = function (dialog) {
            return function (event) {
                if (this.onapply) this.onapply(event);
            };
        }(this);
        var abortButton = diaControl.gecn("dialog-abort")[0];
        abortButton.onclick = clickEvent;
        var retryButton = diaControl.gecn("dialog-retry")[0];
        retryButton.onclick = clickEvent;
        var failButton = diaControl.gecn("dialog-fail")[0];
        failButton.onclick = clickEvent;
    diaDiv.appendChild(diaControl);
    this.element = diaDiv;
    var otherDialog = gecn("dialog");
    $(otherDialog).remove();
    var shadow = gecn("shadow")[0] || document.createElement("div");
    shadow.className = "shadow show";
    shadow.appendChild(diaDiv);
    this.shadow = shadow;

    this.close = function (event) {
        var cn = event.target.className.replace("dialog-", "");
        var result = TBI.DialogResult.cancel;
        for (var prop in TBI.DialogResult)
            if (TBI.DialogResult[prop] == cn) result = TBI.DialogResult[prop];
        if (this.onclose) this.onclose(result, event);
        this.element.remove();
        this.shadow.className = this.shadow.className.replace(/ ?show/, "");
    }
}
TBI.DialogButtons = new Enum("ok", "ok-cancel", "ok-cancel-apply", "abort-retry-fail");
TBI.DialogResult = new Enum("ok", "cancel", "apply", "abort", "retry", "fail");
// START INCLUDE CODE //
// Code for implementing a client-side HTML includes system.
var HTMLIncludes = {
    info: [],
    getDone: [],
    includes: [],
    getIndex: function () {
        TBI.AJAX("/assets/data/includes.json", function (xhr) {
            HTMLIncludes.info = $.parseJSON(xhr.response).includes;
            TBI.Loader.complete("HTMLIncIndex", TBI.Loader.DONE);
        });
    },
    get: function () {
        var currInc = 0;
        HTMLIncludes.getDone = new Array(HTMLIncludes.info.length);
        TBI.timerSet("includes", 1, function () {
            if (!HTMLIncludes.getDone[currInc]) {
                HTMLIncludes.getDone[currInc] = true;
                TBI.AJAX(HTMLIncludes.info[currInc].source, function (xhr) {
                    HTMLIncludes.includes[currInc] = xhr.response;
                    var info = HTMLIncludes.info[currInc];
                    var oldHTML = info.replace?"":$(info.insert).html();
                    $(info.insert).html(oldHTML + xhr.response);
                    if (currInc == HTMLIncludes.getDone.length - 1) {
                        TBI.timerClear("includes");
                        TBI.Loader.event("HTMLIncludes #"+currInc+": "+info.source);
                        TBI.Loader.complete("HTMLIncludes", TBI.Loader.DONE);
                    } else {
                        TBI.Loader.event("HTMLIncludes #"+currInc+": "+info.source);
                        currInc++;
                    }
                });
            }
        });
    }
};
// END INCLUDE CODE //
var testtime = new Date().getTime();
// Called when the HTML includes of the page have all loaded.
$(document).on("pageload", function () {
    TBI.loaded = true;
    TBI.Loader.event("Page loaded", true);
    $("html")[0].className = $("html")[0].className.replace(/ (init|loading)/, "");
    TBI.updateUI();
});
window.onerror = function (message, url, line, column, e) {
    if (TBI.error == undefined) document.body.innerHTML = "Error encountered in "+url+":"+line+":"+column+"\n"+message;
    else TBI.error("Error encountered in "+url+":"+line+":"+column+"\n"+message);
}
$(function () {
    TBI.Loader.event("Ready", true);
    TBI.requestManager();
    TBI.Loader.init();
});
TBI.Loader = {
    ERR: -2,
    TIMEOUT: -3,
    DONE: -1,
    progress: [],
    completed: [],
    timer: 0,
    settings: {
        timeout: 20000,
        time_until_load_screen: 6000,
        interval: 10
    },
    jobs: [],
    searchJobs: function (id) {
        for (var i=0;i<TBI.Loader.jobs.length;i++) if (TBI.Loader.jobs[i].id == id) return i;
        return null;
    },
    log: [],
    event: function (message, important) {
        TBI.Loader.log.push({time:new Date().getTime() - testtime,message:message});
        if (important) console.log("["+(new Date().getTime() - testtime)+"ms] "+message);
    },
    init: function () {
        TBI.Loader.event("Loader initializing");
        TBI.timerSet("loader", TBI.Loader.settings.interval, function () {
            for (var i=0;i<TBI.Loader.jobs.length;i++) {
                var job = TBI.Loader.jobs[i],
                    depSatisfied = true,
                    condSatisfied = true;
                if (TBI.Loader.progress.indexOf(job.id) == -1 && TBI.Loader.completed.indexOf(job.id) == -1) {
                    job.dependencies.forEach(function (dep) { if (TBI.Loader.completed.indexOf(dep) == -1) depSatisfied = false });
                    job.conditions.forEach(function (cond) { if (!cond()) condSatisfied = false });
                    if (depSatisfied && condSatisfied) {
                        job.func();
                        TBI.Loader.event("Executed "+job.id);
                        TBI.Loader.progress.push(job.id);
                    }
                }
            }
            if (TBI.Loader.completed.length >= TBI.Loader.jobs.length || TBI.Loader.timer > TBI.Loader.settings.timeout) {
                TBI.timerClear("loader");
                $(document).trigger("pageload");
            } else if (TBI.Loader.timer > TBI.Loader.settings.time_until_load_screen)
                $("html")[0].className = $("html")[0].className.replace(" init", " loading");
            TBI.Loader.timer+=TBI.Loader.settings.interval;
        });
    },
    complete: function (id, status) {
        var loc = TBI.Loader.searchJobs(id);
        if (!isNull(loc) && TBI.Loader.completed.indexOf(id) == -1) TBI.Loader.completed.push(id);
        if (isNull(loc)) var message = id;
        else switch (status) {
            case TBI.Loader.ERR: var message = TBI.Loader.jobs[loc].error || id + " failed"; break;
            case TBI.Loader.TIMEOUT: var message = TBI.Loader.jobs[loc].timeout || id + " timed out"; break;
            case TBI.Loader.DONE: var message = TBI.Loader.jobs[loc].done || id + " done"; break;
            default: var message = id;
        }
        TBI.Loader.event(message);
    }
}
// START OF COOKIE CODES //
function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) { createCookie(name, "", -1) }
// END OF COOKIE CODES //// PERFNOW - All thanks to Daniel Lamb <dlamb.open.source@gmail.com>
// On GitHub at: https://github.com/daniellmb/perfnow.js
function perfnow(o){"performance"in o||(o.performance={});var e=o.performance;o.performance.now=e.now||e.mozNow||e.msNow||e.oNow||e.webkitNow||Date.now||function(){return(new Date).getTime()}}perfnow(window);
// GUID GENERATOR - All thanks to the StackExchange community
// On StackExchange at: https://stackoverflow.com/a/8809472
function generateUUID(){var d=performance.now(),uuid='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=(d+Math.random()*16)%16|0;d=Math.floor(d/16);return(c=='x'?r:(r&0x3|0x8)).toString(16)});return uuid}
