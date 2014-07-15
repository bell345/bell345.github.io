// TBI.JS - V6.4
// Base functions, variables and helpers that are included and required in
// all of my website pages.
// START INCOMPATIBILITY CODE //
document.onreadystatechange = function () {
    if (document.getElementsByTagName("html")[0].className.search("no-js") != -1) document.getElementsByTagName("html")[0].className = document.getElementsByTagName("html")[0].className.replace("no-js","js init");
    if (!window.jQuery) {
        document.body.innerHTML = "<P style='text-align:center;color:#333333;background:#EEEEEE;font-size:32px;padding:24px 48px;margin-top:300px;'>Your browser is too outdated to display this website properly. Please consider updating your browser to either <A href='http://google.com/chrome'>Google Chrome</A> or <A href='http://firefox.com'>Mozilla Firefox</A>.</P>";
    }
}
// END INCOMPATIBILITY CODE //
var TBI = { loaded: false };
var now = new Date(),
    unqid = now.getTime(),
    query = {},
    path = [],
    notePrevInfo = {
        "head" : [], 
        "text" : [],
        "type" : []
    },
    navbase = [],
    ASCII = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
// START CONSOLE NOTIFICATIONS //
TBI.log = function (message, timeout) {
    console.log(message);
    timeout = isNull(timeout) ? 30000 : timeout;
    new TBI.Notification("Log", message, 0, timeout);
}
TBI.warn = function (message, timeout) {
    console.warn(message);
    timeout = isNull(timeout) ? 40000 : timeout;
    new TBI.Notification("Warning", message, 0, timeout);
}
TBI.error = function (message, timeout) {
    console.error(message);
    var orig = message;
    if (typeof(message) == "object") message = message.message;
    timeout = isNull(timeout) ? 50000 : timeout;
    var onclick = "$($(this).parent()[0].getElementsByTagName(\"div\")[0]).slideToggle()";
    if (typeof(orig) == "object")
        new TBI.Notification("Error", 
            orig.message+"<button onclick='"+onclick+"'>Show/Hide Stack</button><div style='display:none'>"+orig.stack+"</div>", 
            1, 
            timeout);
    else new TBI.Notification("Error", message, 1, timeout);
}
// END CONSOLE NOTIFICATIONS //
$(function () {
    if (navigator.userAgent.search(/[Ff]irefox/)!=-1)
        document.body.className = "gecko";
    else if (navigator.userAgent.search(/[Ww]eb[Kk]it/)!=-1)
        document.body.className = "webkit";
    else if (navigator.userAgent.search(/[Tt]rident/)!=-1)
        document.body.className = "trident";
    else if (navigator.userAgent.search(/MSIE/)!=-1)
        document.body.className = "ie";
});
// Shorthand for document.getElementById.
function gebi(id) { return document.getElementById(id); }
// Shorthand for document.getElementsByClassName.
function gecn(className) { return document.getElementsByClassName(className); }
// Shorthand for document.getElementsByTagName.
function getn(tagName) { return document.getElementsByTagName(tagName); }
// Checks the state of an XHR.
function checkState(request) { return (request.readyState == 4); }
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
            if (func instanceof Function) func();
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
// Searches the navbar menu item database.
TBI.searchNavbase = function (s) {
    for (var i=0;i<navbase.length;i++) 
        if (!isNull(navbase[i]) && navbase[i][0] == s) 
            return navbase[i][1];
    return null;
}
// Moves the navbar indicator to the specified element.
TBI.navMoveTo = function (el) {
    if ($(el).length < 1) return false;
    var loc = $(el).offset().left;
    var off = $("#top-ind").offset().left;
    var alg = loc-off;
    if (alg<0) alg=0;
    else if (alg+parseInt($("#top-ind div").css("width"))>window.innerWidth)
        alg = parseInt(window.innerWidth-$("#top-ind div").css("width"));
    var cn = $("#top-ind div")[0].className;
    $("#top-ind div")[0].className = cn.replace(" focus", "");
    $("#top-ind div").css("left", alg + "px");
}
// A blanket function that handles the navbar indicator behaviour and when and where to place the sub-menus.
TBI.checkNav = function () {
    $("#top>div:not(.nav-ind)").off("mousemove");
    /** When mouse is moving on the navbar, move to its position. */
    $("#top>div:not(.nav-ind)").mousemove(function (event) {
        var width = parseInt($("#top-ind div").css("width"));
        var half = width/2;
        var off = $("#top-ind").offset().left;
        var alg = event.clientX-half-off;
        var page = parseInt($("body").css("width"));
        if(alg<0)alg=0;
        else if(alg+off+width>page) alg=page-width-off;
        var cn = $("#top-ind div")[0].className;
        $("#top-ind div")[0].className = cn.search(" focus") != -1 ? cn : cn + " focus";
        $("#top-ind div").css("left", alg+"px");
    });
    /** When leaving or creating the navbar, move the indicator to the current menu item after 500ms. */
    $("#top>div:not(.nav-ind)").off("mouseleave");
    $("#top>div:not(.nav-ind)").mouseleave(function () { 
        TBI.timerClear("curr");
        TBI.timerSet("curr", 500, function () { TBI.navMoveTo("#curr"); TBI.timerClear("curr") });
    });
    $("#top").off("mouseleave");
    $("#top").mouseleave(function () { 
        TBI.timerClear("curr");
        TBI.timerSet("curr", 500, function () { TBI.navMoveTo("#curr"); TBI.timerClear("curr") }); 
    });
    if ($("#top").length > 0) { 
        TBI.timerClear("curr");
        TBI.timerSet("curr", 500, function () { TBI.navMoveTo("#curr"); TBI.timerClear("curr") });
    }
    /** Handles the dynamic content and section navigation. */
    if (!isNull(TBI.content)) for (var i=0;i<TBI.content.length;i++) {
        var item = TBI.content[i];
        if ($(".nav-"+item.id+" .inner-nav").length == 0) $(".nav-"+item.id).append("<ul class='inner-nav'></ul>");
        else $(".nav-"+item.id+" .inner-nav").empty();
        if (path.isEqual(item.path) && TBI.loaded) {
            if ($("#sidebar .sections").length == 0)
                $("#sidebar").html(
                    "<h3 class='span'>\
                    <a href='javascript:void(0)' class='up-down' for='.sections'>Sections</a></h3>\
                    <ul class='side para sections'></ul>"
                    + $("#sidebar").html());
            else $("#sidebar .sections").empty();
        }
        for (var j=0;j<TBI[item.name].length;j++) {
            var sect = TBI[item.name][j];
            $(".nav-"+item.id+" .inner-nav").append("<li><a href='/"+item.path+"/#"+sect.id+"'>"+sect.name+"</a></li>");
            if (path.isEqual(item.path) && TBI.loaded) $("#sidebar .sections").append("<li><a href='/"+item.path+"/#"+sect.id+"'>"+sect.name+"</a></li>");
        }
    }
    TBI.updateUI();
    
    /** A complicated for loop that handles the indicator behaviour relating to submenus. */
    var nv = "#top>div:not(.nav-ind)";
    navbase = new Array($(nv).length);
    for (var i=0;i<$(nv).length;i++) {
        var parent = nv+":nth("+i+")";
        var child = parent+" .inner-nav";
        if ($(child).length > 0) {
            navbase[i] = [$(parent)[0], $(child)[0]];
            $(parent).off("mouseover");
            $(parent).mouseover(function () {
                var child = TBI.searchNavbase(this);
                if (isNull(child)) return false;
                $(child).show();
                $(child).mouseenter(function () {
                    $($(child).parent()).off("mousemove");
                    TBI.timerClear("curr");
                    TBI.navMoveTo($($(child).parent()));
                    $(child).mouseenter(function () { TBI.navMoveTo($($(child).parent())) });
                    TBI.updateLinks();
                });
                $(child).mouseleave(function () { TBI.checkNav(); TBI.timerClear("curr"); });
            });
            $(parent).off("mouseleave");
            $(parent).mouseleave(function () {
                var child = TBI.searchNavbase(this);
                if (isNull(child)) return false;
                $(child).hide();
            });
        }
    }
    /** Whether or not to show the "to top" menu item. */
    if (window.scrollY > 0) $(".nav-top").slideDown();
    else $(".nav-top").slideUp();
}
// Updates toggleable elements.
TBI.updateUI = function () {
    for (var i=0;i<$(".img-mid:not(.done)").length;i++) {
        var currimg = $(".img-mid:not(.done)")[i];
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        if (isNull(currimg.id)) { 
            do {
                var rand = "";
                for (var i=0;i<4;i++) rand += chars[randomInt(chars.length)];
            } while ($("#unq-"+rand).length > 0)
            currimg.id = "unq-"+rand;
        }
        $(currimg.getElementsByClassName("img-toggle")[0]).attr("for", "#" + currimg.id + " img");
        currimg.className += " done";
    }
    $("button.toggle").off("mouseup");
    $("button.toggle").mouseup(function (event) {
        if (event.button != 0) return true;
        var a = " on",
            c = this.className;
        this.className=c.search(a)!=-1?c.replace(a,""):c+a;
    });
    $(".up-down").off("mouseup");
    $(".up-down").mouseup(function () {
        if (event.button != 0) return true;
        var toSwitch = $($(this).attr("for"));
        if (toSwitch.length > 0) toSwitch.slideToggle();
        var a = " on";
            c = this.className;
        this.className=c.search(a)!=-1?c.replace(a,""):c+a;
    });
    for (var i=0;i<$("table.sortable").length;i++) {
        var currtble = $("table.sortable")[i];
        var rows = currtble.querySelectorAll("tbody tr");
        for (var j=0;j<rows.length;j++) if (rows[j].className.search(" torder") == -1) rows[j].className += " torder-"+j;
        $(currtble.querySelectorAll("th.sort")).attr("class", "sort none");
        $(currtble.querySelectorAll("th.sort")).off("click");
        $(currtble.querySelectorAll("th.sort")).click(function () {
            if ($(this).parent()[0].getElementsByTagName("th").length > 0) {
                var updownList = $(this).parent()[0].getElementsByTagName("th");
                for (var j=0;j<updownList.length;j++) 
                    if (updownList[j] != this) 
                        updownList[j].className = updownList[j].className.replace(/( up| down)/, " none");
                    else var tIndex = j;
            }
            var currclass = this.className;
            if (currclass.search(" none") != -1) this.className = currclass.replace(" none", " up");
            else if (currclass.search(" up") != -1) this.className = currclass.replace(" up", " down");
            else if (currclass.search(" down") != -1) this.className = currclass.replace(" down", " none");
            if (this.className.search(" down") != -1) TBI.sortTable($(this).parent().parent().parent()[0], tIndex, true);
            else if (this.className.search(" up") != -1) TBI.sortTable($(this).parent().parent().parent()[0], tIndex, false);
            else if (this.className.search(" none") != -1) TBI.sortTable($(this).parent().parent().parent()[0], -1, false);
        });
    }
}
// Returns first-level elements in an XML index.
TBI.findIndex = function (file, name) {
    if (navigator.userAgent.search(/MSIE [0-9]/) != -1)
        var xml = $.parseXML(file.responseText);
    if (navigator.userAgent.indexOf("Trident") != -1)
        var xml = file.responseXML;
    else 
        var xml = $.parseXML(file.response);
    return xml.getElementsByTagName(name);
}
// Appends HTML to an element.
function modifyHtml(id, mod) { gebi(id).innerHTML += mod }
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
// Highlights the current navbar menu item.
TBI.findPage = function () {
    var curr = path[0];
    if (isNull(curr)) curr = "";
    var nav = "#top>div:not(.nav-ind)";
    var navbar = $(nav);
    var links = $("#top>div:not(.nav-ind)>a");
    for (var i = 0; i < links.length; i++) {
        if ($(links[i]).attr("href").split("/")[1] == curr) {
            $(navbar[i]).attr("id","curr");
            return true;
        }
    }
    $(".nav-home").attr("id","curr");
    return true;
}
// Determines whether or not a number is even.
function isEven(n) { return n%2==0 }
// Determines whether or not a variable is nothing at all.
function isNull(thing) {
    if (thing instanceof Array) {
        for (var i=0;i<thing.length;i++)
            if (thing[i] == undefined || thing[i] === "" || thing[i] == null || thing.toString() == "NaN")
                return true;
        return (thing.length == 0)
    }
    return (thing == undefined || thing === "" || thing == null || thing.toString() == "NaN")
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
// Returns whether or not two arrays are the same.
Array.prototype.isEqual = function (arr) { return isEqual(this, arr); }
// Determines whether or not an array contains a particular item.
Array.prototype.contains = function (item) {
    for (var i=0;i<this.length;i++) if (isEqual(this[i], item)) return true; return false;
}
// Returns the numbers that go into the specified number.
function divisors(num) {
    var divisors=[];
    for (var i=1;i<=num/2;i++)
        if (num%i==0)
            divisors.push(i);
    divisors.push(num);
    return divisors;
}
// Translate an octet stream into the string of ASCII characters it represents.
function translateOctetStream(str, radix, len, delimit) {
    var nw = "",
        nwArr = [];
    delimit = isNull(delimit) ? nw.search(" ") != -1 : delimit;
    len = isNull(len) ? 0 : len;
    while (Math.pow(radix, len) < ASCII.length) len++;
    var octetRegExp = new RegExp("[0-9A-Z]{"+len+"}"+(delimit?" ?":""));
    while (str.search(octetRegExp) != -1) {
        nwArr.push(str.match(octetRegExp)[0]);
        str = str.replace(octetRegExp, "");
    }
    for (var i=0;i<nwArr.length;i++) nw += isNull(ASCII[parseInt(nwArr[i], radix)])?"":ASCII[parseInt(nwArr[i], radix)];
    return nw;
}
// Changes a decimal number into a number of the specified base.
function transformDecimal(dec, radix, len) {
    var max = 0,
        nwArr = [],
        nw = "",
        neg = false,
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (radix > 10+chars.length || radix < 2) return null; // if the radix cannot be represented fully 
    if (Math.abs(dec) != dec) { neg = true; dec = Math.abs(dec) } // if this number is negative
    else if (dec == 0) return 0; // else if number is plain zero, return zero (that's what it always is)
    do { max++; } while (Math.pow(radix, max) <= dec) // finding the maximum power to raise radix to (the length of the string)
    for (var i=max-1;i>=0;i--) { // main loop
        if (Math.pow(radix, i) <= dec) { // if the raised radix is lower or equal to the number (say 16^2 = 256 <= this number)
            var pw = Math.floor(dec / Math.pow(radix, i)); // the floor of the current number over the raised radix (how many 256s go in)
            nwArr.push(pw); // push the pw value which is the current place value (if this number > 512, pw > 2)
            dec -= Math.pow(radix, i) * pw; // take away the pw value from the number
        } else nwArr.push(0); // else push zero
    }
    for (var i=0;i<nwArr.length;i++) // converting the numbers into characters (16 to F)
        if (nwArr[i] > 9) nw += chars[nwArr[i] - 10];
        else nw += nwArr[i];
    if (!isNull(len)) while (nw.length < len) nw = "0" + nw; // prepending zeroes to fit the len value
    return neg ? "-" + nw : nw; // negative or not
}
// Takes a string and transforms it into an octet-stream with the specified radix.
function octetStream(str, radix, len, delimit) {
    len = isNull(len) ? 0 : len;
    delimit = isNull(delimit) ? true : delimit;
    var dlim = delimit ? " " : "";
    var stream = "";
    if (Math.pow(radix, len) < ASCII.length) do len++; while (Math.pow(radix, len) < ASCII.length)
    for (var i=0;i<str.length;i++) {
        stream += transformDecimal(ASCII.indexOf(str[i])!=-1?ASCII.indexOf(str[i]):0, radix, len) + dlim;
    }
    return stream.substring(0, stream.length-(delimit?1:0));
}
// Aliases for the above functions.
var binToNum = function(b){return parseInt(b,2)},
    binToDec = function(b){return octetStream(binToStr(b),10)},
    binToStr = function(b){return translateOctetStream(b,2,8,false)},
    binToChar = function(b){return isNull(ASCII[parseInt(b,2)])?"":ASCII[parseInt(b,2)]},
    binToHex = function(b){return numToHex(binToNum(b))},
    numToBin = function(n){return transformDecimal(n,2,8)},
    numToDec = function(n){return n.toString()},
    numToChar = function(n){return isNull(ASCII[n])?"":ASCII[n]},
    numToHex = function(n){return transformDecimal(n,16)},
    strToBin = function(s){return octetStream(s,2,8,false)},
    charToNum = function(s){return ASCII.indexOf(s)!=-1?ASCII.indexOf(s):0},
    strToDec = function(s){return octetStream(s,10)},
    strToHex = function(s){return octetStream(s,16)};
    hexToBin = function(h){return numToBin(hexToNum(h))},
    hexToNum = function(h){return parseInt(h,16)},
    hexToStr = function(h){return translateOctetStream(h,16)};
var Timers = {};
// An externally edited replacement for setInterval.
TBI.timerSet = function (timer, seconds, func) {
    if (typeof (func) == "function") {
        $(document).on(timer + "_timertrig", func);
        Timers[timer] = setInterval(function () {
            $(document).trigger(timer + "_timertrig");
        }, seconds);
    }
    else {
        $(document).on(timer + "_timertrig", function () { return null });
        Timers[timer] = setInterval(function () {
            $(document).trigger(timer + "_timertrig");
        }, seconds);
    }
}
// Clears a timerSet.
TBI.timerClear = function (timer) {
    if (!isNull(Timers[timer])) {
        clearInterval(Timers[timer]);
        Timers[timer] = undefined;
        $(document).off(timer + "_timertrig")
    }
}
// Declares an object of {x,y} to represent a coordinate value.
function Coords(x, y) {
    this.x = x;
    this.y = y;
}
// Transforms coordinates into an array of [x,y].
Coords.prototype.toArray = function () { return [this.x,this.y] }
// Transforms coordinates into a string representation of "(x, y)".
Coords.prototype.toString = function () { return "("+this.x+", "+this.y+")" }
Coords.prototype.toPolar = function () {
    return new PolarCoords(Math.pythagoras(this.x, this.y), Math.atan2(this.y, this.x));
}
function PolarCoords(radius, azimuth) {
    this.radius = radius;
    this.azimuth = azimuth;
}
PolarCoords.prototype.toCartesian = function () { 
    return new Coords(this.radius*Math.sin(this.azimuth), this.radius*Math.cos(this.azimuth));
}
PolarCoords.prototype.toString = function () { return "("+this.radius+", "+this.azimuth+")" }
// Declares a line segment with the endpoints start and end.
function LineSegment(start, end) {
    if (!(start instanceof Coords) && !isNull(start[1])) start = new Coords(start[0], start[1]);
    if (!(end instanceof Coords) && !isNull(end[1])) end = new Coords(end[0], end[1]);
    this.start = start;
    this.end = end;
    this.length = Math.pythagoras(this.end.x-this.start.x, this.end.y-this.start.y);
    this.midpoint = new Coords(Math.mean([this.start.x, this.end.x]), Math.mean([this.start.y, this.end.y]));
    this.gradient = ((this.end.y-this.start.y) / (this.end.x-this.start.x)).fix(); 
    // simple: m = rise/run
    // the trick is to use two points
    // take away the first point's y values from the second y value
    // and then divide that by the second x from the first x, same as the last step
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
// Finds the midpoint of a line segment.
LineSegment.prototype.midpoint = function () {
    return new Coords(Math.mean([this.start.x, this.end.x]), Math.mean([this.start.y, this.end.y]));
}
LineSegment.prototype.toLinear = function () {
    return new LinearFunc(this.gradient, this.yIntercept);
}
// Declares a linear function f(x) = gradient*x+yIntercept.
function LinearFunc(gradient, yIntercept) {
    this.gradient = gradient;
    this.yIntercept = yIntercept;
}
// Passes x through the linear function and returns the y value.
LinearFunc.prototype.eval = function (x) {
    return this.gradient*x+this.yIntercept;
}
// Transforms a linear function rule into a string representation.
LinearFunc.prototype.toString = function (spacing) {
    var s = isNull(spacing) ? "" : spacing ? " " : "";
    var gradient = this.gradient == 1?"":this.gradient.toString();
    var sign = this.yIntercept==0?"":isNegative(this.yIntercept)?"-":"+";
    var yIntercept = this.yIntercept == 0?"":Math.abs(this.yIntercept).toString();
    return "f(x)="+gradient+"x"+sign+yIntercept;
}
// Finds the intersection of two linear functions.
LinearFunc.prototype.intersection = function (f2) {
    var x = ((f2.yIntercept-this.yIntercept) / (this.gradient-f2.gradient)).fix()
    return new Coords(x, this.eval(x));
}
LinearFunc.prototype.multiply = function (f2) {
    return new QuadraticFunc(
            this.gradient*f2.gradient, 
            this.yIntercept+f2.yIntercept, 
            this.yIntercept*f2.yIntercept);
}
function QuadraticFunc(a, b, c) {
    if (a == 0) return new LinearFunc(b, c);
    this.a = a;
    this.b = b;
    this.c = c;
}
QuadraticFunc.prototype.eval = function (x) {
    return this.a*x*x + this.b*x + this.c;
}
QuadraticFunc.prototype.toString = function (spacing) {
    var s = isNull(spacing) ? "" : (spacing) ? " " : "";
    var a = this.a == 1 ? s : s + this.a;
    var bsign = this.b == 0?"":isNegative(this.b)?"-":"+";
    var b = this.b == 0 ? s : s + bsign + s + Math.abs(this.b).toString();
    var csign = this.c == 0?"":isNegative(this.c)?"-":"+";
    var c = this.c == 0 ? s : s + csign + s + Math.abs(this.c).toString();
    return "f(x)"+s+"="+a+"x^2"+b+"x"+c;
}
QuadraticFunc.prototype.formula = function (sign) {
    var rt = Math.sqrt(this.b*this.b - 4*this.a*this.c);
    return (-this.b+(sign?rt:-rt)) / 2*this.a;
}
// Declares a relation ax+by=c as a function of x.
function RelationFunc(a, b, c) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.gradient = -(a/b);
    this.yIntercept = c/b;
}
// Turns a relation into its corresponding linear function.
RelationFunc.prototype.toLinear = function () {
    return new LinearFunc(this.gradient, this.yIntercept);
}
// Turns a relation into a string representation.
RelationFunc.prototype.toString = function () {
    var a = this.a==1?this.a==-1?"-":"":this.a.toString();
    var sign = isNegative(this.b) ? "-" : "+";
    var b = this.b == 1?"":Math.abs(this.b).toString();
    return a+"x"+sign+b+"y="+this.c;
}
RelationFunc.prototype.eval = function (x) {
    return this.gradient*x+this.yIntercept;
}
// Returns a preformatted array of the date object specified.
function unixToString(date) {
    var month = date.getMonth()+1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    month = zeroPrefix(month);
    day = zeroPrefix(day);
    hour = zeroPrefix(hour);
    minute = zeroPrefix(minute);
    second = zeroPrefix(second);
    return [date.getTime(), date.getFullYear(), month, day, hour, minute, second];
}
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
function circlePoint(a, r, x, y) {
    x=isNull(x)?0:x;
    y=isNull(y)?0:y;
    return new Coords(x+r*Math.cos(dtr(a)),y+r*Math.sin(dtr(a)));
}
// Formula for the circumference of a circle with the specified radius r.
function circum(r) { return 2*Math.PI*r }
// Formula for calculating the hypotenuse of a right angled triangle, given sides a and b.
Math.pythagoras = function (arg0, arg1, mode) { 
    if (mode && arg0 > arg1) return Math.sqrt((arg0*arg0)-(arg1*arg1));
    else if (mode && arg0 < arg1) return Math.sqrt((arg1*arg1)-(arg0*arg0));
    else return Math.sqrt((arg0*arg0)+(arg1*arg1)).fix();
}
// Splices an element and returns the array while preserving the original.
function splice(list, index, howMany) {
    var newlist = [];
    for (var i=0;i<list.length;i++)
        if (!(i >= index && i < index+howMany)) newlist.push(list[i]);
    return newlist;
}
// A function to compare often inaccurate floating-point values by measuring their difference against an immesurably small value.
Number.prototype.equal = function (num) { return Math.abs(num - this) < Number.EPSILON }
// Fixes a malfunctioning floating-point value (e.g. 2.999999999995) by slightly reducing its precision.
Number.prototype.fix = function () { return parseFloat(this.toPrecision(15)) }
// arr.indexOf polyfill.
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) { return i; }
        }
        return -1;
    }
}
// Sorts a number list in ascending order.
function sort(list) {
    var min = Math.min.apply(null, list),
        max = Math.max.apply(null, list);
    list = splice(list, list.indexOf(min), 1);
    list = splice(list, list.indexOf(max), 1);
    if (list.length == 0) return [min,max];
    else if (list.length == 1) return [min,list[0],max];
    else {
        var newarr = sort(list);
        newarr.push(max);
        newarr.unshift(min);
        return newarr;
    }
}
// Finds the total of a list.
Math.total = function (list) {
    var total = 0;
    for (var i=0;i<list.length;i++) total += list[i];
    return total;
}
// Finds the mean of a list.
Math.mean = function (list) {
    return Math.total(list) / list.length;
}
// Finds the median of a list.
Math.median = function (list) {
    list = sort(list);
    if (list.length % 2 == 0) return Math.mean([list[list.length/2], list[(list.length/2)-1]]);
    else return list[(list.length-1)/2];
}
// Finds the mode of a list.
Math.mode = function (list) {
    var freq = {},
        max = 0,
        modes = [];
    for (var i=0;i<list.length;i++) {
        if (freq[list[i]] == undefined) freq[list[i]] = 0;
        freq[list[i]]++;
    }
    for (var i=0;i<Object.keys(freq).length;i++) if (freq[Object.keys(freq)[i]] > max) max = freq[Object.keys(freq)[i]];
    for (var i=0;i<Object.keys(freq).length;i++) if (freq[Object.keys(freq)[i]] == max) modes.push(parseInt(Object.keys(freq)[i]));
    if (max < 2) return "none";
    return modes.length == 1?modes[0]:modes;
}
// Finds the range of a list.
Math.range = function (list) {
    list = sort(list);
    return list[list.length-1]-list[0];
}
// Finds the upper quartile, the lower quartile, median and the inter-quartile range of a list.
Math.quartiles = function (list) {
    list = sort(list);
    var med = Math.median(list);
    while (list.indexOf(med) != -1) list = splice(list, list.indexOf(med), 1);
    var up = [], lw = [];
    for (var i=0;i<list.length;i++) i<list.length/2?lw.push(list[i]):up.push(list[i]);
    return {lower:Math.median(lw),median:med,upper:Math.median(up),range:Math.median(up) - Math.median(lw)};
}
// Returns the factorial of the number specified.
Math.factorial = function (num) {
    for (var i=0,t=1;i<num;i++) t *= i+1;
    return t;
}
// Uses Eratosthenes' sieve to calculate the prime numbers up to the number specified.
Math.eratosthenes = function (num) {
    var sqrt = Math.sqrt(num),
        nums = [];
    for (var i=0;i<num;i++) 
        nums.push(true);
    for (var i=2;i<sqrt;i++)
        if (nums[i])
            for (var j=i*i;j<num;j+=i)
                nums[j] = false;
    return nums;
}
// Returns a value which, when added to a list of values, will change its mean to the specified number.
Math.newValueForMean = function (list, num) {
    return num * (list.length + 1) - Math.total(list);
}
// Converts a keypress event keycode into the character typed.
function convertKeyDown(event) {
    var chars = {
        32:" ",27:"esc",112:"f1",113:"f2",114:"f3",115:"f4",116:"f5",117:"f6",118:"f7",119:"f8",120:"f9",
        121:"f10",122:"f11",123:"f12",36:"home",35:"end",45:"insert",46:"delete",192:"`",48:"0",49:"1",
        50:"2",51:"3",52:"4",53:"5",54:"6",55:"7",56:"8",57:"9",65:"a",66:"b",67:"c",68:"d",69:"e",70:"f",
        71:"g",72:"h",73:"i",74:"j",75:"k",76:"l",77:"m",78:"n",79:"o",80:"p",81:"q",82:"r",83:"s",84:"t",
        85:"u",86:"v",87:"w",88:"x",89:"y",90:"z",189:"-",187:"=",219:"[",220:"\\",221:"]",222:"'",186:";",
        188:",",190:".",191:"/",17:"ctrl",18:"alt",16:"shift",9:"tab",20:"caps",33:"pgup",34:"pgdn",
        91:"super",38:"up",40:"down",37:"left",39:"right",13:"enter",8:"backspace",103:"7",104:"8",105:"9",
        100:"4",101:"5",102:"6",97:"1",98:"2",99:"3",96:"0",110:".",111:"/",106:"*",109:"-",107:"+"
    };
    if (event.shiftKey && event.which != 16) return shiftUp(event.which, true);
    else return chars[event.which];
}
// Converts a normal key press into a shifted one. 
// Only works on US keyboard layouts (no pounds or funny euroes)
function shiftUp(key, isKeyDown) { 
    if (isKeyDown) {
        var chars = {
            49:'!',50:'@',51:'#',52:'$',53:'%',54:'^',55:'&',56:'*',57:'(',48:')',189:'_',187:'+',192:'~',219:'{',
            221:'}',220:'|',186:':',222:'"',188:'<',190:'>',111:'?'
        };
        if (isNull(chars[key])) return key.toString();
        else return chars[key.toString()];
    } else {
        var chars = {
            '1':'!','2':'@','3':'#','4':'$','5':'%','6':'^','7':'&','8':'*','9':'(','0':')','-':'_','=':'+','`':'~','[':'{',
            ']':'}','\\':'|',';':':','\'':'"',',':'<','.':'>','/':'?'
        };
        if (key.search(/[a-z]/) != -1 && key.length == 1) return key.toUpperCase(); 
        else if (isNull(chars[key])) return key.toString();
        else return chars[key.toString()];s
    }
}
function shiftDown(key) {
    var chars = {
        '!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-','+':'=','~':'`','{':'[',
        '}':']','|':'\\',':':';','"':'\'','<':',','>':'.','?':'/'
    };
    if (key.search(/[A-Z]/) != -1 && key.length == 1) return key.toLowerCase();
    else if (isNull(chars[key])) return key.toString();
    else return chars[key.toString()];
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
    if (true) {
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
    } else {
        throw new Error("Supplied element is invalid.");
    }
}
// Removes an element from the registry.
TBI.Popup.registry.remove = function (element) {
    for (var i=0;i<TBI.Popup.registry.length;i++) 
        if (TBI.Popup.registry[i][0] == $(element)[0])
            TBI.Popup.registry[i] = undefined;
    $(element).off("mousemove");
}
// A predefined popup element that can be added to by using the same header.
// There can only be one notification type, but multiple messages and instances of messages.
TBI.Notification = function (head, text, type, timeout) {
    this.type = isNull(type) ? 0 : type;
    timeout = isNull(timeout) ? 10000 : timeout;
    this.head = head;
    this.text = text;
    this.noteNum = $(".notification").length;
    if (notePrevInfo["head"].indexOf(this.head)!=-1
    && !isNull(Timers.noteRemove) 
    && notePrevInfo["text"].indexOf(this.text)==-1) {
        for (var i=0;i<this.noteNum;i++) {
            if ($($(".notification h3")[i]).text() == this.head) {
                $($(".notification ul")[i]).append("<li>"+this.text+"</li>");
            }
        }
    } else if (notePrevInfo["text"].indexOf(this.text)==-1 && notePrevInfo["head"].indexOf(this.head)==-1) {
        $(".notification").remove();
        var body = $('body');
        var pup = "";
        pup += "<div class='notification'>";
        pup += "<h3>"+this.head+"</h3>";
        pup += "<ul><li>"+this.text+"</li></ul>";
        pup += "</div>";
        body.append(pup);
    } else if (notePrevInfo["head"].indexOf(this.head)!=-1 && notePrevInfo["text"].indexOf(this.text)!=-1) {
        for (var i=0;i<this.noteNum;i++) {
            if ($($(".notification h3")[i]).text() == this.head) {
                var lines = $(".notification ul").children(),
                    found = false;
                for (var j=0;j<lines.length;j++) {
                    if ($(lines[j]).text() == this.text) {
                        var prevNum = 0;
                        notePrevInfo["text"].forEach(function (el) {
                            if (el == text) prevNum++;
                        });
                        if (prevNum >= 9) $(lines[j]).attr("class", "list-plus")
                        else $(lines[j]).attr("class", "list-"+(++prevNum));
                        found = true;
                    }
                }
                if (!found) notePrevInfo = {head:[],text:[]};
            }
        }
    }
    TBI.timerClear("noteRemove");
    var timerCount = 0;
    TBI.timerSet("noteRemove",500,function () {
        if (timerCount >= timeout)
            $(".notification").hide();
        if ($($(".notification")[0]).css("display")=="none") {
            $(".notification").remove();
            notePrevInfo = {
                "head": [], 
                "text": []
            };
            TBI.timerClear("noteRemove");
            timerCount = 0;
        }
        timerCount+=500;
    });
    notePrevInfo["head"].push(this.head);
    notePrevInfo["text"].push(this.text);
}
// A dialog which displays a yes/no prompt and can provide functions when an option is chosen.
TBI.dialog = function (head, body, func, nfunc) {
    $("#dialog-yes").off("click");
    $("#dialog-no").off("click");
    this.head = head;
    this.body = body;
    $(".dialog").remove();
    var dia = "<div class='dialog'><h2>"+this.head+"</h2><p>"+this.body+"</p>";
    dia += "<div class='dialog-action'><button id='dialog-yes'>Confirm</button>";
    dia += "<button id='dialog-no' class='dialog-right'>Cancel</button></div></div>";
    $("body").append(dia);
    func = typeof(func) == "undefined" ? function () {} : func;
    $("#dialog-yes").click(function () { func(); $("#dialog-yes").off("click"); $("#dialog-no").off("click"); $(".dialog").remove(); });
    nfunc = typeof(nfunc) == "undefined" ? function () {} : nfunc;
    $("#dialog-no").click(function () { nfunc(); $("#dialog-yes").off("click"); $("#dialog-no").off("click"); $(".dialog").remove(); });
}
// Changes the specified toggleable element either according to the boolean value passed to it, or simply toggles it.
TBI.toggleButton = function (element, bool) {
    if (!isNull(element[0]) && element[0] instanceof HTMLElement) element = element[0];
    if (!element instanceof HTMLElement) return null;
    var isToggled = TBI.isToggled(element);
    if (!isToggled && bool !== false) { element.className += " on"; }
    else if (isToggled && bool !== true) { element.className = element.className.replace(" on",""); }
    if (!isNull(bool) && bool !== isToggled || isNull(bool)) $(element).click();
    return TBI.isToggled(element);
}
// Returns whether or not a specified toggleable element is toggled or not.
TBI.isToggled = function (element) { return element.className.search(" on") != -1; }
// Sorts a specific table element according to the column and direction specified.
TBI.sortTable = function (table, colIndex, direction) {
    if (!(table instanceof HTMLTableElement)) return null; // checks if the table is an element
    var records = table.querySelectorAll("tbody tr"), // all the rows in the table body
        refs = {}, // references to the rows using the text content as the key and the row number as the value
        fields = [], // an array of the text content inside of the specified column of the table (that can be sorted)
        numbers = true; // whether or not to use the custom number-focused sort() algorithm or use the inbuilt .sort() for text values
    if (colIndex != -1) for (var i=0;i<records.length;i++) { // this loop checks whether or not the table uses all numerical values
        var list = records[i].querySelectorAll("td");
        var item = list[colIndex].innerText;
        if (numbers && isNaN(parseFloat(item))) numbers = false;
    }
    for (var i=0;i<records.length;i++) { // this loop places the items into the fields array and adds the row reference to refs
        var list = records[i].querySelectorAll("td");
        if (colIndex != -1) {
            var item = list[colIndex].innerText.toLowerCase();
            if (numbers) item = parseFloat(item);
        } else var item = parseFloat(records[i].className.match(/ torder-[0-9]{1,}/)[0].match(/[0-9]{1,}/)[0]);
        fields.push(item);
        refs[item] = i;
    }
    if (numbers) fields = sort(fields); // sorting algorithms
    else fields.sort();
    if (direction) fields.reverse(); // whether or not to reverse the order
    $(table.getElementsByTagName("tbody")[0]).empty(); // empty the table body (too bad if anything other than <tr>s are inside of it)
    for (var i=0;i<fields.length;i++) table.getElementsByTagName("tbody")[0].appendChild(records[refs[fields[i]]]); 
    // and add in the rows in the right order
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
// A 2D canvas context constructor.
function Canvas2D(id) {
    var curr = gebi(id);
    if (curr.getContext && !isNull(curr))
        var ctx = curr.getContext("2d");
    else return null;
    return ctx;
}
Canvas2D.dotEnabled = true;
// Adds a coordinate popup to a specified canvas.
Canvas2D.inspector = function (context) {
    var cvs = context.canvas;
    $(cvs).off("mousemove");
    if (context.inspector) {
        $(cvs).mousemove(function (event) {
            new TBI.Popup(
                event.clientX + 20,
                event.clientY + 20,
                "Canvas Inspector",
                event.offsetX + "X, " + event.offsetY + "Y"
            );
        });
        $(cvs).mouseleave(function () { $('.popup').remove() });
    } else return null;
}
Canvas2D.set = function (context, type, style, width) {
    isNull(width)?1:width;
    switch (type) {
        case "stroke": context.strokeStyle = style; context.lineWidth = width; break;
        case "fill": context.fillStyle = style; break;
        case "font": context.font = style; break;
    }
}
// Processes a string of canvas commands.
Canvas2D.path = function (context, obj) {
    var path = obj.path;
    var type = obj.type;
    var style = obj.style;
    context.save();
    switch (type) { 
        case "stroke": context.strokeStyle = style; break; 
        case "fill": context.fillStyle = style; break; 
        default: return false;
    }
    context.beginPath();
    context.moveTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++) 
        context.lineTo(path[i][0], path[i][1]);
    context.closePath();
    switch (type) {
        case "stroke": context.stroke(); break;
        case "fill": context.fill(); break;
        default: return false;
    }
    context.restore();
}
Canvas2D.reset = function (context) {
    context.closePath();
    context.beginPath();
    context.firstPos = [];
    context.secondPos = [];
    return 0;
}
Canvas2D.dot = function (x, y, colour) {
    var v = Canvas2D.dotEnabled ? "visible" : "hidden";
    $("body").append("<div class='cvs-dot' style='background:"+colour+";left:"+
        x+"px;top:"+y+"px;visibility:"+v+";'></div>");
}
// A WebGL canvas constructor.
function Canvas3D(cvs) {
    var gl = null;
    try { gl = cvs.getContext("webgl") || cvs.getContext("experimental-webgl"); }
    catch (e) {} 
    if (isNull(gl)) { 
        error("WebGL failed to initialize.");
        gl = null;
    }
    return gl;
}
// Designates outgoing links.
TBI.updateLinks = function () {
    for (var i = 0; i < $("a[href]").length; i++) {
        if ($("a[href]:nth("+i+")").attr("href").search(/((http|https|mailto|news):|\/\/)/) == 0) {
            $("a[href]:nth("+i+")").attr("target", "_blank");
            if ($("a[href]:nth("+i+")")[0].className.search(" external") == -1)
                $("a[href]:nth("+i+")")[0].className += " external";
        }
    }
    $("#top a").click(function () {
        if (!isNull(location.hash) && !isNull($(location.hash))) {
            TBI.timerSet("scroll",10,function () {
                if (!isNull($(location.hash).offset())) {
                    $(document).scrollTop(parseInt($(location.hash).offset().top - 57));
                    TBI.timerClear("scroll");
                }
            });
        }
    });
}
// START INCLUDE CODE //
// Code for implementing a client-side HTML includes system.
var HTMLIncludes = {
    info: [],
    getDone: [],
    includes: [],
    getIndex: function () {
        var xhr = new TBI.AJAX("/assets/data/includes.json", function () {
            HTMLIncludes.info = $.parseJSON(xhr.response).includes;
            TBI.Loader.complete("HTMLIncIndex", TBI.Loader.DONE);
        });
    },
    get: function () {
        var curr = 0;
        HTMLIncludes.getDone = new Array(HTMLIncludes.info.length);
        TBI.timerSet("includes", 0, function () {
            if (!HTMLIncludes.getDone[curr]) {
                HTMLIncludes.getDone[curr] = true;
                var xhr = new TBI.AJAX(HTMLIncludes.info[curr].source, function () {
                    HTMLIncludes.includes[curr] = xhr.response;
                    var oldHTML = HTMLIncludes.info[curr].replace?"":$(HTMLIncludes.info[curr].insert).html();
                    $(HTMLIncludes.info[curr].insert).html(oldHTML + xhr.response);
                    if (curr == HTMLIncludes.getDone.length - 1) {
                        TBI.timerClear("includes");
                        TBI.Loader.event("HTMLIncludes #"+curr+": "+HTMLIncludes.info[curr].source);
                        TBI.Loader.complete("HTMLIncludes", TBI.Loader.DONE);
                    } else { 
                        TBI.Loader.event("HTMLIncludes #"+curr+": "+HTMLIncludes.info[curr].source); 
                        curr++; 
                    }
                });
            }
        });
    }
};
// END INCLUDE CODE //
// Fetches a dynamic content manifest.
TBI.fetchIndex = function () {
    var xhr = new TBI.AJAX("/assets/data/work.json", function () {
        TBI.content = $.parseJSON(xhr.response).content;
        for (var i=0;i<TBI.content.length;i++) {
            TBI[TBI.content[i].name] = $.parseJSON(xhr.response)[TBI.content[i].id];
            if (path.isEqual(TBI.content[i].path.split("/"))) TBI.setupContent(TBI.content[i]);
        }
        TBI.Loader.complete("protoIndex", TBI.Loader.DONE);
    });
}
// Sets up a type of dynamic content.
TBI.setupContent = function (type) {
    for (var i=0;i<TBI[type.name].length;i++) {
        var items = TBI[type.name];
        var titleText = "";
        if (!isNull(items[i].link)) titleText += "<a href='"+items[i].link+"'>";
        titleText += items[i].name;
        if (!isNull(items[i].link)) titleText += "</a>";
        $($("h2.item, h3.item")[i]).html(titleText);
        $($("h2.item, h3.item")[i]).attr("id",items[i].id);
        var toggleHTML = "";
        toggleHTML += "<span class='right'><a href='javascript:void(0)' ";
        toggleHTML += "class='up-down on' for='.item-info:nth("+i+")'>";
        toggleHTML += "Toggle</a></span>";
        $($(".version")[i]).html(items[i].version + toggleHTML);
    }
}
TBI.checkFonts = function () {
    if ($("#fontload-rw").length == 0) { 
        TBI.Loader.complete("Fonts", TBI.Loader.ERR);
        return false; 
    }
    var fonts = ["os", "rw", "rwb", "ri"],
        ftimer = 0;
    TBI.timerSet("fontload", 10, function () {
        var fontsLoaded = 0;
        for (var i=0;i<fonts.length;i++) if (parseInt($("#fontload-"+fonts[i]).css("width")) > 8) fontsLoaded++;
        if (fontsLoaded >= fonts.length || ftimer > 2000) {
            TBI.timerClear("fontload");
            $("#fontload").remove();
            TBI.Loader.complete("Fonts", TBI.Loader.DONE);
        }
        ftimer+=10;
    });
}
var testtime = new Date().getTime();
// Called when the HTML includes of the page have all loaded.
$(document).on("pageload", function () {
    TBI.loaded = true;
    TBI.Loader.event("Page loaded", true);
    $("html")[0].className = $("html")[0].className.replace(/(init|loading)/, "");
    TBI.findPage();
    TBI.checkNav();
    TBI.navMoveTo($("#curr"));
    TBI.updateLinks();
    TBI.updateUI();
    if (!isNull(location.hash) && !isNull($(location.hash.toString()))) {
        TBI.timerSet("scroll",10,function () {
            if (!isNull($(location.hash).offset())) {
                $(document).scrollTop(parseInt($(location.hash).offset().top - 57));
                TBI.timerClear("scroll");
            }
        });
    }
    var konami = ["up","up","down","down","left","right","left","right","b","a"],
        kCode = 0;
    $(document).keydown(function (event) {
        if (convertKeyDown(event) == konami[kCode]) kCode++; 
        else kCode = 0;
        if (kCode >= konami.length) 
            if (!path.isEqual(["test"])) location.href = location.origin + "/test/";
            else if (!isNull(history)) history.back();
    });
});
window.onerror = function (message, url, line, column, e) { 
    if (TBI.error == undefined) document.body.innerHTML = "Error encountered in "+url+":"+line+":"+column+"\n"+message;
    else TBI.error(e); 
    TBI.log("Error encountered in "+url+":"+line+":"+column+"\n"+message); 
    return true; 
}
$(function () {
    TBI.Loader.event("Ready", true);
    TBI.requestManager();
    TBI.checkNav();
    $(document).scroll(TBI.checkNav);
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
        timeout: 10000,
        time_until_load_screen: 2000,
        interval: 10
    },
    jobs: [
        {
            func: HTMLIncludes.getIndex,
            id: "HTMLIncIndex",
            dependencies: [],
            conditions: [],
            done: "HTMLIncludes manifest loaded"
        },
        {
            func: HTMLIncludes.get,
            id: "HTMLIncludes",
            dependencies: ["HTMLIncIndex"],
            conditions: []
        },
        {
            func: TBI.fetchIndex,
            id: "protoIndex",
            dependencies: [],
            conditions: [],
            done: "Content manifest loaded"
        },
        {
            func: TBI.checkFonts,
            id: "Fonts",
            dependencies: [],
            conditions: [function(){return $("#fontload-rw").length>0}]
        }
    ],
    searchJobs: function (id) {
        for (var i=0;i<TBI.Loader.jobs.length;i++) if (TBI.Loader.jobs[i].id == id) return i;
        return null;
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
                $("html")[0].className = $("html")[0].className.replace("init", "loading");
            TBI.Loader.timer+=TBI.Loader.settings.interval;
        });
    },
    complete: function (id, status) {
        var loc = TBI.Loader.searchJobs(id);
        if (!isNull(loc) && TBI.Loader.completed.indexOf(id) == -1) TBI.Loader.completed.push(id);
        if (isNull(loc)) var message = id;
        else switch (status) {
            case TBI.Loader.ERR: var message = isNull(TBI.Loader.jobs[loc].error)?id+" failed":TBI.Loader.jobs[loc].error; break;
            case TBI.Loader.TIMEOUT: var message = isNull(TBI.Loader.jobs[loc].timeout)?id+" timed out":TBI.Loader.jobs[loc].timeout; break;
            case TBI.Loader.DONE: var message = isNull(TBI.Loader.jobs[loc].done)?id+" loaded":TBI.Loader.jobs[loc].done; break;
            default: var message = id;
        }
        TBI.Loader.event(message);
    },
    event: function (message, important) {
        TBI.Loader.log.push({time:new Date().getTime() - testtime,message:message});
        if (important) console.log("["+(new Date().getTime() - testtime)+"ms] "+message);
    },
    log: []
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
// END OF COOKIE CODES //
