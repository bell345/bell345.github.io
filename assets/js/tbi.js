// *cue sirens*
// WARNING: THE FOLLOWING IS LEGACY CODE.
// AND YOU KNOW WHAT THAT MEANS: OLD AND BROKEN.
// PLEASE DO NOT USE.
// USE require.js AND tblib.
// THAT IS ALL.
// *sirens end*

// TBI.JS - V6.6
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
    ASCII = "\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~\x80\x81\x82\x83\x84\x85\x86\x87\x88\x89\x8A\x8B\x8C\x8D\x8E\x8F\x90\x91\x92\x93\x94\x95\x96\x97\x98\x99\x9A\x9B\x9C\x9D\x9E\x9F\xA0\xA1\xA2\xA3\xA4\xA5\xA6\xA7\xA8\xA9\xAA\xAB\xAC\xAD\xAE\xAF\xB0\xB1\xB2\xB3\xB4\xB5\xB6\xB7\xB8\xB9\xBA\xBB\xBC\xBD\xBE\xBF\xC0\xC1\xC2\xC3\xC4\xC5\xC6\xC7\xC8\xC9\xCA\xCB\xCC\xCD\xCE\xCF\xD0\xD1\xD2\xD3\xD4\xD5\xD6\xD7\xD8\xD9\xDA\xDB\xDC\xDD\xDE\xDF\xE0\xE1\xE2\xE3\xE4\xE5\xE6\xE7\xE8\xE9\xEA\xEB\xEC\xED\xEE\xEF\xF0\xF1\xF2\xF3\xF4\xF5\xF6\xF7\xF8\xF9\xFA\xFB\xFC\xFD\xFE\xFF";
// "
// ^ this required because reasons
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
    if (typeof(orig) == "object") {
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
HTMLElement.prototype.gecn = function (className) { return this.getElementsByClassName(className); }
// Shorthand for document.getElementsByTagName.
function getn(tagName) { return document.getElementsByTagName(tagName); }
HTMLElement.prototype.getn = function (tagName) { return this.getElementsByTagName(tagName); }
// Shorthand for document.getElementsByName.
function gebn(name) { return document.getElementsByName(name); }
HTMLElement.prototype.gebn = function (name) { return this.getElementsByName(name); }
HTMLElement.prototype.getStyle = function (name) { return getComputedStyle(this)[name]; }
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
            if (search[i].length > 1) query[search[i][0]] = search[i][1];
        }
    }
    var hash = location.hash;
    if (!isNull(location.hash)) {
        hash = hash.replace("#","").split("&");
        for (var i=0;i<hash.length;i++) {
            hash[i] = hash[i].split("=");
            if (hash[i].length > 1) query[hash[i][0]] = hash[i][1];
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
    for (var i=0;i<TBI.navbase.length;i++)
        if (!isNull(TBI.navbase[i]) && TBI.navbase[i][0] == s)
            return TBI.navbase[i][1];
    return null;
}
// Moves the navbar indicator to the specified element.
TBI.navMoveTo = function (ind, el) {
    if ($(el).length < 1) return false;
    var inr = $(ind + " div"),
        loc = $(el).offset().left,
        off = $(ind).offset().left,
        wid = parseInt($(inr).css("width")),
        lim = parseInt(window.innerWidth - wid),
        alg = Math.bound(loc - off, 0, lim),
        cn = $(inr)[0].className;
    $(inr)[0].className = cn.replace(" focus", "");
    $(inr).css("left", alg + "px");
}
// A blanket function that handles the navbar indicator behaviour and dynamic navigation related content.
TBI.checkNav = function (nav) {
    $(nav+">div:not(.nav-indicator)").off("mousemove");
    // When mouse is moving on the navbar, move the indicator its position.
    $(nav+">div:not(.nav-indicator)").mousemove(function (event) {
        var width = parseInt($(nav+" .nav-indicator div").css("width"));
        var half = width/2;
        var off = $(nav+" .nav-indicator").offset().left;
        var alg = event.clientX-half-off;
        var page = parseInt($("body").css("width"));
        if(alg<0)alg=0;
        else if(alg+off+width>page) alg=page-width-off;
        var cn = $(nav+" .nav-indicator div")[0].className;
        $(nav+" .nav-indicator div")[0].className = cn.search(" focus") != -1 ? cn : cn + " focus";
        $(nav+" .nav-indicator div").css("left", alg+"px");
    });
    // When leaving or creating the navbar, move the indicator to the current menu item after 500ms.
    $(nav).off("mouseleave");
    $(nav).mouseleave(function () {
        TBI.timerClear("curr");
        TBI.timerSet("curr", 500, function () { TBI.navMoveTo(nav+" .nav-indicator", "#curr"); TBI.timerClear("curr") });
    });
    if ($(nav).length > 0) {
        TBI.timerClear("curr");
        TBI.timerSet("curr", 500, function () { TBI.navMoveTo(nav+" .nav-indicator", "#curr"); TBI.timerClear("curr") });
    }
    // Handles the dynamic content.
    // Soon to be redone without gratuitous jQuery usage.
    if (!isNull(TBI.content)) for (var i=0;i<TBI.content.length;i++) {
        var item = TBI.content[i];
        if ($(".nav-"+item.id+" .inner-nav").length == 0) $(".nav-"+item.id).append("<ul class='inner-nav'></ul>");
        else $(".nav-"+item.id+" .inner-nav").empty();
        for (var j=0;j<TBI[item.name].length;j++) {
            var sect = TBI[item.name][j],
                text = "<li>";
            if (!isNull(sect.link)) text += "<a href='"+sect.link+"' class='external'></a>";
            text += "<a href='/"+item.path+"/#"+sect.id+"'>"+sect.name+"</a></li>";
            $(".nav-"+item.id+" .inner-nav").append(text);
        }
    }
    TBI.updateUI();

    // Handles the indicator behaviour relating to inner navigation menus.
    var navItems = $(nav+" > div:not(.nav-indicator):not(.done)"); // gets array of unhandled items
    for (var i=0;i<navItems.length;i++) {
        var parent = navItems[i]; // the div containing the inner nav
        var child = parent.gecn("inner-nav")[0]; // the inner nav itself
        parent.className += " done"; // marks event handled-ness so you don't do it again and waste time
        if (!isNull(child)) { // if the parent has an inner nav
            $(child).off("mouseenter");
            $(child).mouseenter(function (nav, parent) { // when you move into the inner nav...
                return function () {
                    $(parent).off("mousemove"); // remove indicator mouse tracking (for the moment)
                    var moveFunc = function (nav, parent) {
                        return function () { TBI.navMoveTo(nav+" .nav-indicator", parent); }; // move the indicator to the parent
                    }(nav, parent);
                    $(this).mousemove(moveFunc); // both when the mousemoves,
                    moveFunc(); // and straight away
                    TBI.updateLinks(); // update behaviour for inner nav links
                }
            }(nav, parent));
            $(child).off("mouseleave");
            $(child).mouseleave(function (nav) { // when you leave the inner nav...
                return function () { TBI.checkNav(nav); } // restore mouse tracking
            }(nav));
        }
    }
    /** Whether or not to show the "to top" menu item. */
    if (window.scrollY > 0) $(".nav-top").slideDown();
    else $(".nav-top").slideUp();
}
// Updates toggleable elements.
TBI.updateUI = function () {
    var items = $("h2.item[id], h2.section[id]");
    if (items.length > 0 && TBI.loaded) {
        if ($("#sidebar #sections").length == 0) {
            var header = document.createElement("h3");
            header.className = "span";
                var link = document.createElement("a");
                link.href = "javascript:void(0)";
                link.className = "up-down";
                link.setAttribute("for", "#sections");
                link.innerText = "Sections";
            header.appendChild(link);
            var list = document.createElement("ul");
            list.className = "side para";
            list.id = "sections";
            var sidebar = gebi("sidebar");
            sidebar.insertBefore(list, sidebar.firstChild);
            sidebar.insertBefore(header, sidebar.firstChild);
        } else $("#sidebar #sections").empty();
        for (var i=0;i<items.length;i++) {
            var sectionsList = $("#sidebar #sections")[0];
            var item = document.createElement("li");
                var link = document.createElement("a");
                link.href = location.origin + location.pathname + "#" + items[i].id;
                link.innerText = items[i].innerText;
            item.appendChild(link);
            sectionsList.appendChild(item);
        }
    }

    for (var i=0;i<$(".img-mid:not(.done)").length;i++) {
        var currimg = $(".img-mid:not(.done)")[i];
        currimg.id = generateUUID();
        currimg.getElementsByClassName("img-toggle")[0].setAttribute("for", "#" + currimg.id + " img");
        currimg.className += " done";
    }
    $("button.toggle:not(.done)").click(function (event) {
        if (event.button != 0) return true;
        $(this).toggleClass("on");
    });
    $("button.toggle:not(.done)").toggleClass("done", true);
    $(".up-down:not(.done)").click(function (event) {
        if (event.button != 0) return true;
        var toSwitch = $($(this).attr("for"));
        if (toSwitch.length > 0) toSwitch.slideToggle();
        $(this).toggleClass("on");
    });
    $(".up-down:not(.done)").toggleClass("done", true);
    var popups = $("*[data-popup-title]:not(.popup-done), *[data-popup-body]:not(.popup-done)");
    for (var i=0;i<popups.length;i++) {
        TBI.HoverPopup.bindElement(popups[i],
            popups[i].attributes["data-popup-title"].value,
            popups[i].attributes["data-popup-body"].value);
    }
    popups.toggleClass("popup-done", true);
    for (var i=0;i<$("table.sortable:not(.done)").length;i++) {
        var curr = $("table.sortable:not(.done)")[i];

        // recording original table order
        var rows = curr.querySelectorAll("tbody tr");
        for (var j=0;j<rows.length;j++)
            if (rows[j].className.search(" torder") == -1) rows[j].className += " torder-"+j;

        var sortHeaders = curr.querySelectorAll("thead th.sort");
        $(sortHeaders).toggleClass("none", true);
        $(sortHeaders).click(function (table) {
            return function () {
                var upDownList = table.querySelectorAll("thead th.sort");
                var index = -1;
                // find current column index
                for (var i=0;i<upDownList.length;i++) {
                    if (upDownList[i] == this) index = i;
                    else upDownList[i].className = upDownList[i].className.replace(/( )*(up|down)/, "$1none");
                }

                var conditions = ["none", "up", "down"];
                if (index != -1) for (var i=0;i<conditions.length;i++) {
                    var condition = conditions[i];
                    if (this.className.search(condition) != -1) {
                        var futureCondition = conditions[(i + 1) % conditions.length];
                        // switch condition to next in line
                        $(this).toggleClass(condition, false);
                        $(this).toggleClass(futureCondition, true);
                        // according to current condition...
                        switch (futureCondition) {
                            // sort up
                            case "up": TBI.sortTable(table, index, false); break;
                            // sort down
                            case "down": TBI.sortTable(table, index, true); break;
                            // or restore original order
                            default: TBI.sortTable(table, -1, false);
                        }
                        break;
                    }
                // if index is invalid, sort table anyway to restore order
                } else TBI.sortTable(table, -1, false);
            }
        }(curr));
    }
    $("table.sortable:not(.done)").toggleClass("done", true);
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
// Optionally with a custom padding character (e.g. "  2" instead of "002")
function zeroPrefix(num, len, char) {
    num = num.toString();
    while (num.length < (len?len:2)) num = (char?char:"0") + num;
    return num;
}
// Highlights the current navbar menu item.
TBI.findPage = function (nav) {
    var curr = path[0];
    if (isNull(curr)) curr = "";
    var navdivs = nav+">div:not(.nav-indicator)";
    var navbar = $(navdivs);
    var links = $(navdivs+">a");
    for (var i = 0; i < links.length; i++) {
        if ($(links[i]).attr("href").split("/")[1] == curr) {
            $(navbar[i]).attr("id","curr");
            return true;
        }
    }
    $(".nav-home").attr("id","curr");
}
// Determines whether or not a number is even.
function isEven(n) { return n%2==0 }
// Determines whether or not a variable is nothing at all.
function isNull(thing) {
    if (thing instanceof Array) {
        for (var i=0;i<thing.length;i++)
            if (isNull(thing[i])) return true;
        return (thing.length == 0)
    } else return (thing == undefined || thing === "" || thing == null || thing !== thing);
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
// Creates a multi-dimensional array given the depths of the dimensions.
Array.dimensional = function (lengths, initial) {
    if (isNull(lengths)) lengths = [0];
    Array.call(this);
    var len = lengths.shift();
    for (var i=0;i<len;i++) this.push(lengths.length==0?initial:new Array.dimensional(lengths, initial));
    var _checkDimension = function (arr) {
        var checked = false;
        arr.forEach(function (el) {
            if (el instanceof Array && !checked) {
                currDimension++;
                checked = true;
                return _checkDimension(el, currDimension);
            }
        });
        return currDimension;
    }
    Object.defineProperty(this, "dimension", {
        get: function () { return _checkDimension(this, 1) },
        enumerable: true
    });
    return this;
}
Array.dimensional.prototype = new Array();
Array.dimensional.prototype.constructor = Array.dimensional;
// Gemerates a dimensional array given a regular array.
Array.dimensional.fromArray = function (arr) {
    var a = new Array.dimensional([arr.length]);
    for (var i in arr) {
        if (arr[i] instanceof Array) a[i] = Array.dimensional.fromArray(arr[i]);
        else a[i] = arr[i];
    }
    return a;
}
// Copies a multi-dimensional array into another.
Array.dimensional.prototype.copy = function () {
    var a = new Array.dimensional([0]);
    for (var i=0;i<this.length;i++) a.push(this[i]);
    return a;
}
// replaces elements of an array given the source entry dimensions, the new array and its dimensions.
Array.dimensional.prototype.replace = function (sdim, d, ddim) {
    if (!(d instanceof Array.dimensional)) d = Array.dimensional.fromArray(d);
    if (!(sdim instanceof Array.dimensional)) sdim = Array.dimensional.fromArray(sdim);
    if (!(ddim instanceof Array.dimensional)) ddim = Array.dimensional.fromArray(ddim);
    var sd = sdim.shift(),
        dd = ddim.shift();
    for (var i=sd[0],j=dd[0];i<sd[1],j<dd[1];i++,j++) {
        if (this[i] instanceof Array.dimensional) this[i].replace(sdim.copy(), d[j], ddim.copy());
        else this[i] = d[j];
    }
    return this;
}
// Turns a multi-dimensional array into a regular array.
Array.dimensional.prototype.flatten = function () {
    for (var i=0,a=[];i<this.length;i++) {
        if (this[i] instanceof Array.dimensional) a = a.concat(this[i].flatten());
        else a = a.concat(this[i]);
    }
    return a;
}
// Gets a section of a multi-dimensional array given entry and exit points for each dimension.
Array.dimensional.prototype.getSection = function (sdim) {
    var sd = sdim.shift(),
        a = new Array.dimensional([0]);
    if (!(sdim instanceof Array.dimensional)) sdim = Array.dimensional.fromArray(sdim);
    for (var i=sd[0];i<sd[1];i++) {
        if (this[i] instanceof Array.dimensional) a.push(this[i].getSection(sdim.copy()));
        else a.push(this[i]);
    }
    return a;
}
// Transposes a two dimensional array.
Array.dimensional.prototype.transpose2d = function (r) {
    r = isNull(r) ? 1 : r;
    for (var i=0,l=this[0].length,m=this.length,n=new Array.dimensional([l,m]);i<l;i++)
        for (var j=0;j<m;j++) n[i][j] = this[j][i];
    if (r > 1) return n.transpose2d(r-1);
    else return n;
}
// Random midpoint displacement terrain generation algorithm.
// Please ignore, as it is, like, fundamentally broken.
function randomDisplacement(seeds, complexity, modifier, debug) {
    var ln = wd = 2*complexity+1,
        hf = (ln-1)/2,
        sd = Array.dimensional.fromArray(seeds),
        ar = new Array.dimensional([wd,ln], 0),
        midpoint = Math.mean(sd) + modifier * (Math.random() * complexity),
        joinArrays = function (arrays) {
            var idim = arrays[0].length,
                l = 2*idim-1,
                t = new Array.dimensional([l,l], 0),
                h = (l-1)/2;

            t.replace([[0,h],[0,h]], arrays[0], [[0,h+1],[0,h+1]]);
            t.replace([[0,h],[h,l]], arrays[1], [[0,h+1],[0,h+1]]);
            t.replace([[h,l],[0,h]], arrays[2], [[0,h+1],[0,h+1]]);
            t.replace([[h,l],[h,l]], arrays[3], [[0,h+1],[0,h+1]]);

            if (debug) TBI.log(t);

            return t;
        };

    ar[0][0] = sd[0];
    ar[0][hf] = Math.mean([sd[0], sd[1]]);
    ar[0][wd-1] = sd[1];
    ar[hf][0] = Math.mean([sd[0], sd[2]]);
    ar[hf][hf] = midpoint;
    ar[hf][wd-1] = Math.mean([sd[1], sd[3]]);
    ar[ln-1][0] = sd[2];
    ar[ln-1][hf] = Math.mean([sd[2], sd[3]]);
    ar[ln-1][wd-1] = sd[3];

    var recSeeds = [
        [sd[0], ar[0][hf], ar[hf][0], midpoint],
        [ar[0][hf], sd[1], midpoint, ar[hf][wd-1]],
        [ar[hf][0], midpoint, sd[2], ar[ln-1][hf]],
        [midpoint, ar[hf][wd-1], ar[ln-1][hf], sd[3]]
    ];

    if (debug) TBI.log(recSeeds);

    if (complexity == 1) return ar;
    else return joinArrays([
        randomDisplacement(recSeeds[0], complexity-1, modifier),
        randomDisplacement(recSeeds[1], complexity-1, modifier),
        randomDisplacement(recSeeds[2], complexity-1, modifier),
        randomDisplacement(recSeeds[3], complexity-1, modifier)
    ]);
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
// Takes an array and reverses the order of its elements (e.g. [0,1,2,3] to [3,2,1,0])
Array.prototype.reverse = Array.prototype.reverse || function () {
    for (var i=this.length-1,a=[];i>=0;i--) a.push(this[i]);
    return a;
}
// Shorthand for removing a specific element index from an array.
Array.prototype.remove = Array.prototype.remove || function (index) {
    this.splice(index, 1);
    return this;
}
// Copies the elements from one array to another to prevent unintended changes to another array.
Array.prototype.copy = Array.prototype.copy || function () {
    for (var i=0,a=[];i<this.length;i++) a.push(this[i]);
    return a;
}
// Makes sure that a string doesn't get mistaken for meta-characters when constructing a RegExp from a string.
RegExp.quote = function (str) {
    return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
}
// Replaces all instances of a specified string or regular expression with the given replacement string.
// When using parentheses in a regular expression; the contents of them will
// replace "$1"-"$9" in the replacement string in the order of where they are in the RegExp.
String.prototype.replaceAll = String.prototype.replaceAll || function (toReplace, replacement) {
    if (typeof(toReplace) == "string") toReplace = new RegExp(RegExp.quote(toReplace), 'g');
    else if (toReplace instanceof RegExp) toReplace = new RegExp(toReplace.source, 'g');
    return this.replace(toReplace, replacement);
}
// Removes all instances of each of the arguments from a string.
String.prototype.removeAll = function () {
    for (var i=0,s=this;i<arguments.length;i++)
        s = s.replaceAll(arguments[i], "");
    return s;
}
// Takes a string and reverses the order of its characters (e.g. "Hello world!" to "!dlrow olleH").
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
// A brute-force algorithm to generate the divisors of a number.
function oldDivisors(num) {
    for (var i=1,d=[],b=new Date().getTime();i<=num/2;i++)
        if (num%i==0)
            d.push(i);
    d.push(num);
    return d;
}
// Returns the numbers that divide perfectly into the specified number.
// Thanks to Eratosthenes, one of my favourite Ancient Greeks.
function getDivisors(num) {
    var factors = [];
    for (var i=1;i<=Math.sqrt(num);i++)
        if (num%i==0 && factors.indexOf(i) == -1)
            factors.push(i, num/i);
    return factors;
}
var divisors = getDivisors;
// Returns groups of numbers, that when multiplied together, return
// the original number passed to the function.
function getDivisorPairs(num) {
    var factors = [], factorPairs = [];
    for (var i=1,r=Math.sqrt(num);i<r;i++) {
        if (num % i == 0 && factors.indexOf(i) == -1) {
            factors.push(i, num/i);
            factorPairs.push([i, num/i]);
        }
    }
    return factorPairs;
}
function factoriseTrinomial(a, b, c) {
    var factors = [];
    // searching for common factors...
    var hcf = highestCommonFactor(a, b, c);
    if (hcf != 1) {
        factors.push(hcf.toString());
        a /= hcf; b /= hcf; c /= hcf;
    }

    var goodPair;
    var divisorPairs = getDivisorPairs(a * c);
    for (var i=0;i<divisorPairs.length;i++) {
        var pair = divisorPairs[i];
        if (pair[0] + pair[1] == b) { goodPair = pair; break; }
        else if (pair[0] - pair[1] == b) { goodPair = [pair[0], -pair[1]]; break; }
        else if (pair[1] - pair[0] == b) { goodPair = [pair[1], -pair[0]]; break; }
        else if (-pair[1] - pair[0] == b) { goodPair = [-pair[1], -pair[0]]; break; }
    }
    TBI.log(goodPair);

    var aHcf = highestCommonFactor(a, goodPair[0]);
    var cHcf = highestCommonFactor(goodPair[1], c);

    var divvedFactorsA = [a/aHcf, goodPair[0]/aHcf];
    var divvedFactorsC = [goodPair[1]/cHcf, c/cHcf];

    TBI.log(divvedFactorsA);
    TBI.log(divvedFactorsC);

    if ((
            divvedFactorsA[0] == divvedFactorsC[0]
            && divvedFactorsA[1] == divvedFactorsC[1]
        ) || (
            divvedFactorsA[1] == divvedFactorsC[0]
            && divvedFactorsA[0] == divvedFactorsC[1]
        )) {
        factors.push(new LinearFunc(divvedFactorsA[0], divvedFactorsA[1]).toString());
        factors.push(new LinearFunc(aHcf, cHcf).toString());
    } else factors.push(new QuadraticFunc(a, b, c));

    return factors;
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
        chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
        nw += chars[nwArr[i]];
    nw = zeroPrefix(num, len?len:0);
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
    var s = spacing == true ? " " : "";
    var gradient = this.gradient == 1?"":this.gradient.toString();
    var sign = this.yIntercept==0?"":isNegative(this.yIntercept)?"-":"+";
    var yIntercept = this.yIntercept == 0?"":Math.abs(this.yIntercept).toString();
    return "f(x)"+s+"="+s+gradient+"x"+s+sign+s+yIntercept;
}
// Finds the intersection of two linear functions.
LinearFunc.prototype.intersection = function (f2) {
    var x = ((f2.yIntercept-this.yIntercept) / (this.gradient-f2.gradient)).fixFloat();
    // A is running at 50m/s, 120m ahead of B, running at 80m/s.
    // At which point will B pass A, and how long will it take to get there?
    // A(x) = 50x + 120
    // B(x) = 80x
    // (0-120) / (50-80)
    // -120 / -30 = 4
    // x = 4 seconds
    // A(4) = 50*4 + 120
    // y = 320 metres
    return new Coords(x, this.eval(x));
}
// Multiplies a linear function with another one to create a quadratic function.
LinearFunc.prototype.multiply = function (f2) {
    if (f2 instanceof LinearFunc) return new QuadraticFunc(
            this.gradient*f2.gradient,
            this.yIntercept*f2.gradient+this.gradient*f2.yIntercept,
            this.yIntercept*f2.yIntercept);
    else return new LinearFunc(this.gradient*f2, this.yIntercept*f2);
}
// Declares a quadratic function of the form ax^2 + bx + c.
function QuadraticFunc(a, b, c) {
    if (a == 0) return new LinearFunc(b, c);
    this.a = a;
    this.b = b;
    this.c = c;
}
// Passes x through the quadratic function and returns the y value.
QuadraticFunc.prototype.eval = function (x) {
    return this.a*Math.pow(x,2) + this.b*x + this.c;
}
// Transforms a quadratic function into a string representation of "f(x) = ax^2 + bx + c".
QuadraticFunc.prototype.toString = function (spacing) {
    var s = isNull(spacing) ? "" : (spacing) ? " " : "";
    var a = this.a == 1 ? s : s + this.a;
    var bsign = this.b == 0?"":isNegative(this.b)?"-":"+";
    var b = this.b == 0 ? s : s + bsign + s + Math.abs(this.b).toString();
    var csign = this.c == 0?"":isNegative(this.c)?"-":"+";
    var c = this.c == 0 ? s : s + csign + s + Math.abs(this.c).toString();
    return "f(x)"+s+"="+a+"x^2"+b+"x"+c;
}
// Solves the quadratic formula given whether or not the result is going to be positive.
QuadraticFunc.prototype.formula = function (sign) {
    var rt = Math.sqrt(Math.pow(this.b,2) - 4*this.a*this.c);
    return (-this.b+(sign?rt:-rt)) / (2*this.a);
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
RelationFunc.prototype.toString = function (spacing) {
    var s = isNull(spacing) ? "" : spacing ? " " : "",
        a = this.a==1?this.a==-1?"-":"":this.a.toString(),
        sign = isNegative(this.b) ? "-" : "+",
        b = this.b == 1?"":Math.abs(this.b).toString();
    return a+"x"+s+sign+s+b+"y"+s+"="+s+this.c;
}
// Passes x through a relation and returns the y value.
RelationFunc.prototype.eval = function (x) {
    return this.gradient*x+this.yIntercept;
}
// Declares a parametric function given a function to evaulate x and a function to evaluate y.
function Parametric(xfunc, yfunc) {
    this.xfunc = xfunc;
    this.yfunc = yfunc;
}
// Passes a parameter, t, through the parametric function to return a set of coordinates.
Parametric.prototype.eval = function (t) {
    return new Coords(this.xfunc(t), this.yfunc(t));
}
// Transforms a parametric function into a string representation of "f(t) = (fx, fy)".
Parametric.prototype.toString = function (spacing) {
    var s = spacing ? " " : "",
        formstr = function (str) {
            return str
            .replaceAll("Math.E", "e")
            .replaceAll(/(function ?\([A-Za-z_]([A-Za-z0-9_]+)?\) ?\{ ?return ?|\}$|Math\.|\*)/, "")
            .replaceAll(/pow\(([^,]+), ?((\([^\)]+\)|[^\)]+))\)/, "$1^$2")
            .replaceAll("PI", "π");
        },
        xstr = formstr(this.xfunc.toString());
        ystr = formstr(this.yfunc.toString());
    return "f(t) = ("+xstr+","+s+ystr+")";
}
// Declares a parametric function that generates an ellipse.
Parametric.ellipse = function (a, b) {
    return eval("new Parametric(\
        function(t){return "+a+"*Math.cos(t)},\
        function(t){return "+b+"*Math.sin(t)})");
}
// Declares a parametric function that generates a Lissajous curve.
Parametric.lissajous = function (a, b, sigma) {
    return eval("new Parametric(\
        function(t){return Math.sin("+a+"*t+"+(isNull(sigma)?"0":sigma)+")},\
        function(t){return Math.sin("+b+"*t)})");
}
// Declares a parametric function that generates a trochoid.
Parametric.trochoid = function (a, b) {
    return eval("new Parametric(\
        function(t){return "+a+"*t - "+b+"*Math.sin(t)},\
        function(t){return "+a+" - "+b+"*Math.cos(t)})");
}
// Declares a parametric function that generates a hypotrochoid.
Parametric.hypotrochoid = function (R, r, d) {
    var a = R-r;
    return eval("new Parametric(\
        function(t){return "+a+"*Math.cos(t)+"+d+"*Math.cos("+a+"/"+r+"*t)},\
        function(t){return "+a+"*Math.sin(t)-"+d+"*Math.sin("+a+"/"+r+"*t)})")
}
// Transforms an equation into a string representation.
Function.equationToString = function (func, toReplace, replacement) {
    var str = func.toString(),
        regex = /function ?\(([a-zA-Z_]([a-zA-Z0-9_]+)?)\) ?= ?/,
        typestr = "";
    if (str.search("native code") != -1) return null;
    else if (str.search(regex) != -1) typestr = str.match(regex)[1];
    else typestr = "x";
    str = str
        .replaceAll("Math.E", "e")
        .replaceAll(/(function ?\([A-Za-z_]([A-Za-z0-9_]+)?\) ?\{ ?return ?|;? ?\}$|Math\.|\*)/, "")
        .replaceAll(/pow\(([^,]+), ?((\([^\)]+\)|[^\)]+))\)/, "$1^$2")
        .replaceAll("PI", "π");
    str = "f("+typestr+") = "+str;
    return isNull(toReplace) || isNull(replacement) ? str : str
        .replaceAll(new RegExp("([^A-Za-z_])"+toReplace+"([^A-Za-z_])"), "$1"+replacement+"$2")
        .replace(new RegExp("^"+toReplace+"([^A-Za-z_])"), replacement+"$1")
        .replace(new RegExp("([^A-Za-z_])"+toReplace+"$"), "$1"+replacement);
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
    normal: function (dir) { if (dir) return new Vector2D(-this.y, this.x); else return new Vector2D(this.y, -this.x); }
};
// Returns the highest common factor of two numbers.
// thx euclid
/* recursive algorithm
function highestCommonFactor(a, b) {
    if (b == 0) return a;
    else return highestCommonFactor(b, a%b);
} */
// non-recursive algorithm
function highestCommonFactor() {
    var args = [];
    for (var i=0;i<arguments.length;i++) args.push(arguments[i]);
    while (args.length > 2) {
        var l2 = args.length-2, l1 = args.length-1;
        args[l2] = highestCommonFactor(args[l2], args[l1]);
        args.remove(l1);
    }

    var a = args[0], b = args[1];
    if (b == 0) return a;
    else return highestCommonFactor(b, a % b);
}
/* these are code golfed versions of the above
function h(a,b){return b?h(b,a%b):a}
function h(a,b){while(b){c=a;a=b;b=c%b}return a} */
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
/* Chemical reaction balancing
function Atom(symbol, number) {
    this.symbol = symbol;
    this.number = number || 1;
}
Atom.prototype.toString = function (bool) {
    return this.symbol + (this.number < 2 ? "" : (bool ? "" : "_") + this.number);
}
Atom.fromString = function (str) {
    if (str.search("_") != -1) return new Atom(str.split("_")[0], str.split("_")[1]*1);
    else if (str.search(/[0-9]/) == -1) return new Atom(str.match(/[A-Z][a-z]* ?/)[0]);
    else return new Atom(str.match(/[A-Z][a-z]* ?/)[0], str.match(/[0-9]+/)[0]*1);
}
function AtomGroup(atoms, number) {
    this.atoms = atoms;
    this.number = number || 1;
}
AtomGroup.prototype.toString = function (bool) {
    for (var i=0,s="(";i<this.atoms.length;i++) s += this.atoms[i].toString(bool);
    return s + ")" + (this.number < 2 ? "" : "_" + this.number);
}
AtomGroup.prototype.getAtomTotals = function () {
    for (var i=0,o={};i<this.atoms.length;i++) {
        var c = this.atoms[i];
        o[c.symbol] = o[c.symbol] || 0;
        o[c.symbol] += c.number;
    }
    for (var e in o) if (o.hasOwnProperty(e)) o[e] *= this.number;
    return o;
}
AtomGroup.fromString = function (str) {
    var numberRegExp = /\)_([0-9]+)/,
        num = str.match(numberRegExp)[1],
        atoms = [],
        atomRegExp = /[A-Z][a-z]*(_?[0-9]+)?/;
    str = str.replace("(", "").replace(numberRegExp, "");
    while (str.search(atomRegExp) != -1) {
        atoms.push(Atom.fromString(str.match(atomRegExp)[0]));
        str = str.replace(atomRegExp, "");
    }
    return new AtomGroup(atoms, num*1);
}
function Molecule(atoms, number) {
    this.atoms = atoms;
    this.number = number || 1;
}
Molecule.prototype.toString = function (bool) {
    for (var i=0,s="";i<this.atoms.length;i++) s += this.atoms[i].toString(bool);
    return (this.number < 2 ? "" : this.number) + s;
}
Molecule.prototype.getAtomTotals = function () {
    for (var i=0,o={};i<this.atoms.length;i++) {
        var c = this.atoms[i];
        if (c instanceof AtomGroup) {
            var t = c.getAtomTotals();
            for (var e in t) if (t.hasOwnProperty(e)) {
                o[e] = o[e] || 0;
                o[e] += t[e];
            }
        } else {
            o[c.symbol] = o[c.symbol] || 0;
            o[c.symbol] += c.number;
        }
    }
    for (var e in o) if (o.hasOwnProperty(e)) o[e] *= this.number;
    return o;
}
Molecule.fromString = function (str) {
    var atoms = [],
        num = 1,
        prefixNumberRegExp = /^[0-9]+/,
        atomRegExp = /[A-Z][a-z]*(_?[0-9]+)?/,
        atomGroupRegExp = /^\([^\)]+\)_?[0-9]+/;
    if (!isNull(str.match(prefixNumberRegExp))) {
        num = str.match(prefixNumberRegExp)[0];
        str = str.replace(prefixNumberRegExp, "");
    }
    while (str.search(atomRegExp) != -1) {
        if (str.search(atomGroupRegExp) != -1) {
            atoms.push(AtomGroup.fromString(str.match(atomGroupRegExp)[0]));
            str = str.replace(atomGroupRegExp, "");
        } else {
            atoms.push(Atom.fromString(str.match(atomRegExp)[0]));
            str = str.replace(atomRegExp, "");
        }
    }
    return new Molecule(atoms, num*1);
}
function MoleculeGroup(molecules) {
    this.molecules = molecules;
}
MoleculeGroup.prototype.toString = function (bool) {
    for (var i=0,s="",l=this.molecules.length;i<l;i++)
        s += this.molecules[i].toString(bool) + (i >= l-1 ? "" : " + ");
    return s;
}
MoleculeGroup.prototype.getAtomTotals = function () {
    for (var i=0,o={};i<this.molecules.length;i++) {
        var c = this.molecules[i].getAtomTotals();
        for (var e in c) if (c.hasOwnProperty(e)) {
            o[e] = o[e] || 0;
            o[e] += c[e];
        }
    }
    return o;
}
MoleculeGroup.prototype.increaseElement = function (symbol) {
    for (var i=0;i<this.molecules.length;i++) {
        var c = this.molecules[i], f = false;
        for (var j=0;j<c.atoms.length;j++) if (c.atoms[j].symbol == symbol) f = true;
        if (f) { this.molecules[i].number++; return; }
    }
}
MoleculeGroup.fromString = function (str) {
    var group = str.split(/ ?\+ ?/),
        garr = [];
    for (var i=0;i<group.length;i++) garr.push(Molecule.fromString(group[i]));
    return new MoleculeGroup(garr);
}
function ChemicalEquation(reactant, product) {
    this.reactant = reactant;
    this.product = product;
}
ChemicalEquation.prototype.toString = function (bool) {
    return this.reactant.toString(bool) + " -> " + this.product.toString(bool);
}
ChemicalEquation.prototype.isBalanced = function () {
    var before = this.reactant.getAtomTotals(),
        after = this.product.getAtomTotals();
    for (var e in before) if (before.hasOwnProperty(e)) {
        if (!after.hasOwnProperty(e)) return false;
        if (before[e] != after[e]) return false;
    }
    for (var e in after) if (after.hasOwnProperty(e)) {
        if (!before.hasOwnProperty(e)) return false;
        if (before[e] != after[e]) return false;
    }
    return true;
}
ChemicalEquation.prototype.findDeficiencies = function () {
    var before = this.reactant.getAtomTotals(),
        after = this.product.getAtomTotals(),
        deficiencies = null;
    for (var e in before) if (before.hasOwnProperty(e)) {
        if (!after.hasOwnProperty(e)) return false;
        if (isNull(deficiencies)) deficiencies = {};
        deficiencies[e] = before[e] - after[e];
    }
    for (var e in after) if (after.hasOwnProperty(e))
        if (!before.hasOwnProperty(e)) return false;
    return deficiencies;
}
ChemicalEquation.prototype.findMostSignificantDeficiency = function () {
    var def = this.findDeficiencies(),
        max = -Infinity,
        maxSign = 0,
        maxSymbol = null;
    for (var e in def) if (def.hasOwnProperty(e)) {
        if (def[e] != 0 && Math.abs(def[e]) > max) {
            max = Math.abs(def[e]);
            maxSign = Math.sign(def[e]);
            maxSymbol = e;
        }
    }
    return new Atom(maxSymbol, max*maxSign);
}
ChemicalEquation.prototype.findLeastSignificantDeficiency = function () {
    var def = this.findDeficiencies(),
        min = Infinity,
        minSign = 0,
        minSymbol = null;
    for (var e in def) if (def.hasOwnProperty(e)) {
        if (def[e] != 0 && Math.abs(def[e]) < min) {
            min = Math.abs(def[e]);
            minSign = Math.sign(def[e]);
            minSymbol = e;
        }
    }
    return new Atom(minSymbol, min*minSign);
}
ChemicalEquation.prototype.balance = function (max, mode) {
    var counter = 0;
    while (!this.isBalanced() && counter++ < (max || 50)) {
        if (mode) var def = this.findLeastSignificantDeficiency();
        else var def = this.findMostSignificantDeficiency();
        if (def.number > 0) this.product.increaseElement(def.symbol);
        else if (def.number < 0) this.reactant.increaseElement(def.symbol);
    }
    return this;
}
ChemicalEquation.fromString = function (str) {
    var compoundGroups = str.split(/ ?-> ?/);
    var before = MoleculeGroup.fromString(compoundGroups[0])
        after = MoleculeGroup.fromString(compoundGroups[1]);
    return new ChemicalEquation(before, after);
}*/
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
function circlePoint(a, r, x, y) { return new Coords((x||0)+r*Math.cos(dtr(a)),(y||0)+r*Math.sin(dtr(a))) }
// Formula for the circumference of a circle with the specified radius r.
function circum(r) { return 2*Math.PI*r }
function formulaToCalc(formula, vars) {
    var rxv = "";
    for (var prop in vars) if (vars.hasOwnProperty(prop) && prop.length == 1) rxv += prop;
    var val = (formula
        .replaceAll("pi", "π")
        .replaceAll(new RegExp("([0-9π\\)]+)([\\("+rxv+"]+)"), "$1*$2")
        .replaceAll(new RegExp("(["+rxv+"\\)]+)([0-9π\\(]+)"), "$1*$2")
        .replaceAll(new RegExp("(["+rxv+"])(["+rxv+"])"), "$1*$2")
        .replaceAll("π", "Math.PI")
        .replaceAll(/(([^a-zA-Z\.]|^))e/, "$1Math.E")
        .replaceAll(/([0-9a-zA-Z\.]+) ?\^ ?(([0-9a-zA-Z\.]+|\([^\)]+?\)))/, "Math.pow($1,$2)")
        .replaceAll(/(([0-9a-zA-Z\.]+|\([^\)]+?\))) ?\^ ?([0-9a-zA-Z\.]+)/, "Math.pow($1,$3)")
        .replaceAll(/([^\.a])(a?\*?(s\*?i\*?n|c\*?o\*?s|t\*?a\*?n))/, "$1Math.$2")
        .replaceAll(/(([^\.]|^))s\*?q\*?r\*?t/, "$1Math.sqrt"));
    try { eval("var result = function () { with (vars) { return "+val+" } }()") }
    catch (e) { return false; }
    return result;
}
// Formula for calculating the hypotenuse length of a right angled triangle, given sides a and b.
// If mode is true, it returns the remaining side length given a side length and the hypotenuse length.
Math.pythagoras = function (arg0, arg1, mode) {
    if (mode && arg0 > arg1) return Math.sqrt((arg0*arg0)-(arg1*arg1));
    else if (mode && arg0 < arg1) return Math.sqrt((arg1*arg1)-(arg0*arg0));
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
Number.prototype.fixFloat = function (num) { return parseFloat(this.toPrecision(num?(num<16?num:15):15)) }
// Fixes a malfunctioning modulo function by fixing the arguments and the result.
Number.prototype.fixMod = function (mod, num) {
    var temp = (this.fixFloat(num) % mod.fixFloat(num)).fixFloat(num);
    if (temp.isFloatEqual(mod)) return 0;
    else return temp;
}
// arr.indexOf polyfill.
Array.prototype.indexOf = Array.prototype.indexOf || function (obj, start) {
    for (var i = (start || 0), j = this.length; i < j; i++) if (this[i] === obj) return i;
    return -1;
}
// Sorts a number list in ascending order.
function oldSort(templst) {
    // while an acceptable algorithm, it does not take very long to overcome the call stack limit.
    var min = Math.min.apply(null, templst),
        max = Math.max.apply(null, templst);
    templst = splice(templst, templst.indexOf(min), 1);
    templst = splice(templst, templst.indexOf(max), 1);
    if (templst.length == 0) return [min,max];
    else if (templst.length == 1) return [min,templst[0],max];
    else {
        var newarr = sort(templst);
        newarr.push(max);
        newarr.unshift(min);
        return newarr;
    }
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
function isSorted(list) {
    for (var i=1;i<list.length;i++)
        if (list[i-1] > list[i]) return false;
    return true;
}
// Proportions a number given from a function with limits a (top) to b (bottom), to a different function with limits c to d.
Math.proportion = function (n, a, b, c, d) { return (c-d)/(a-b)*n+(d-b); }
// Transforms a HSV colour value into its equivalent RGB value.
function hsvToRgb(h,s,v) {
    var bt = (1-s)*v,
        sv = v-bt,
        a = 0, b = 60, c = 180, d = 240,
        g = function (k) { return k>=b&&h<=c?1:k<b&&k>a?(k-a)/(b-a):h>c&&h<d?(h-c)/(d-c):0 };
    return [sv*g(h+120,a,b,c,d)+bt, sv*g(h,a,b,c,d)+bt, sv*g(h-120,a,b,c,d)+bt];
}
// Transforms an RGB colour value into its equivalent HSV value. (Not written by me)
function rgbToHsv(r,g,b) {
    var max = Math.max(r,g,b),
        min = Math.min(r,g,b),
        h = 0;
    if (r == max) h = (g-b)/d;
    else if (g == max) h = 120 + (b-r)/d;
    else if (b == max) h = 240 + (r-g)/d;
    return [h,1-min/max,max];
}
// Returns a set of instructions (chars) given a starting value and a set of rules that change characters into other sequences.
function lsystem(start, rules, n) {
    if (n < 1) return start;
    var a = lsystem(start, rules, n-1);
    for (var i=0,s="";i<a.length;i++) {
        var b = a[i];
        for (var rule in rules) if (rules.hasOwnProperty(rule)) if (a[i] == rule) b = rules[rule];
        s += b;
    }
    return s;
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
    if (!isSorted(list)) list = sort(list);
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
    for (var key in freq) if (freq.hasOwnProperty(key) && freq[key] > max) max = freq[key];
    for (var key in freq) if (freq.hasOwnProperty(key) && freq[key] == max) {
        if (parseFloat(key).toString() != key) modes.push(key);
        else modes.push(parseFloat(key));
    }
    if (max < 2) return null;
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
// Bounds a number by returning the low value if it is lower than it, and returns the high value if it is higher than it.
Math.bound = function (num, low, high) {
    low = isNull(low) ? -Infinity : low;
    high = isNull(high) ? Infinity : high;
    return num < low ? low : num > high ? high : num;
}
//         /|
//        / |
//       /  |
//      /   |
//  hyp/    |opp
//    /     |
//   /a     |
//  /_______|
//     adj
//
// sin = opp/hyp
// when given hyp and a, hyp*sin(a) gives opp
// when given opp and a, opp/sin(a) gives hyp
// when given opp and hyp, arcsin(opp/hyp) gives a
// cos = adj/hyp
// when given hyp and a, hyp*cos(a) gives adj
// when given adj and a, adj/cos(a) gives hyp
// when given adj and hyp, arccos(adj/hyp) gives a
// tan = opp/adj
// when given adj and a, adj*tan(a) gives opp
// when given opp and a, opp/tan(a) gives adj
// when given opp and adj, arctan(opp/adj) gives a
//
// A set of keycode definitions. Used for ease of use when writing programs with onkeydown events.
var Keys = {
    SPACE:32,ESC:27,F1:112,F2:113,F3:114,F4:115,F5:116,F6:117,F7:118,F8:119,F9:120,F10:121,F11:122,F12:123,
    HOME:36,END:35,INSERT:45,DELETE:46,GRAVE:192,ZERO:48,ONE:49,TWO:50,THREE:51,FOUR:52,FIVE:53,SIX:54,
    SEVEN:55,EIGHT:56,NINE:57,A:65,B:66,C:67,D:68,E:69,F:70,G:71,H:72,I:73,J:74,K:75,L:76,M:77,N:78,O:79,P:80,
    Q:81,R:82,S:83,T:84,U:85,V:86,W:87,X:88,Y:89,Z:90,HYPHEN:189,EQUALS:187,LBRAC:219,BACKSLASH:220,
    RBRAC:221,QUOTE:222,SEMICOLON:186,COMMA:188,PERIOD:190,SLASH:191,CTRL:17,ALT:18,SHIFT:16,TAB:9,
    CAPS_LOCK:20,PAGE_UP:33,PAGE_DOWN:34,SUPER:91,UP:38,DOWN:40,LEFT:37,RIGHT:39,RETURN:13,BACKSPACE:8,
    NUM_7:103,NUM_8:104,NUM_9:105,NUM_4:100,NUM_5:101,NUM_6:102,NUM_1:97,NUM_2:98,NUM_3:99,NUM_0:96,
    NUM_PERIOD:110,NUM_DIVIDE:111,NUM_MULTIPLY:106,NUM_SUBTRACT:109,NUM_ADD:107
};
// Converts a keypress event into a string that represents the face value of the key.
function convertKeyDown(event, mode) {
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
        else return chars[key.toString()];
    }
}
// Converts shifted characters back down into normal ones.
function shiftDown(key) {
    var chars = {
        '!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-','+':'=','~':'`','{':'[',
        '}':']','|':'\\',':':';','"':'\'','<':',','>':'.','?':'/'
    };
    if (key.search(/[A-Z]/) != -1 && key.length == 1) return key.toLowerCase();
    else if (isNull(chars[key])) return key.toString();
    else return chars[key.toString()];
}
// A set of functions designed to be used with the Pointer Lock API.
var PointerLock = {
    check: function (l) {
        return document.pointerLockElement == l || document.mozPointerLockElement == l || document.webkitPointerLockElement == l;
    },
    set: function (l, callback) {
        l.requestPointerLock = l.requestPointerLock || l.mozRequestPointerLock || l.webkitRequestPointerLock;
        l.requestPointerLock();
        if (callback) $(el).on("pointerlockchange", callback);
    },
    release: function (l) {
        document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        document.exitPointerLock();
        $(el).off("pointerlockchange");
    }
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
// *stolen* off
// http://www.fleegix.org/articles/2006/05/30/getting-the-scrollbar-width-in-pixels
var scrollerWidth = -1;
function getScrollerWidth() {
    if (scrollerWidth != -1) return scrollerWidth;

    var scr = null;
    var inn = null;
    var wNoScroll = 0;
    var wScroll = 0;

    // Outer scrolling div
    scr = document.createElement('div');
    scr.style.position = 'absolute';
    scr.style.top = '-1000px';
    scr.style.left = '-1000px';
    scr.style.width = '100px';
    scr.style.height = '50px';
    // Start with no scrollbar
    scr.style.overflow = 'hidden';

    // Inner content div
    inn = document.createElement('div');
    inn.style.width = '100%';
    inn.style.height = '200px';

    // Put the inner div in the scrolling div
    scr.appendChild(inn);
    // Append the scrolling div to the doc
    document.body.appendChild(scr);

    // Width of the inner div sans scrollbar
    wNoScroll = inn.offsetWidth;
    // Add the scrollbar
    scr.style.overflow = 'auto';
    // Width of the inner div width scrollbar
    wScroll = inn.offsetWidth;

    // Remove the scrolling div from the doc
    document.body.removeChild(
        document.body.lastChild);

    // Pixel width of the scroller
    scrollerWidth = (wNoScroll - wScroll);
    return scrollerWidth;
}
TBI.HoverPopup = function (x, y, title, body) {
    this.position = new Vector2D(x, y);
    var popDiv = document.createElement("div");
    popDiv.className = "popup";
    popDiv.style.left = (this.position.x + 20) + "px";
    popDiv.style.top = (this.position.y + 20) + "px";
        var popHead = document.createElement("h3");
        popHead.innerHTML = title;
    popDiv.appendChild(popHead);
        var popBody = document.createElement("div");
        popBody.className = "popup-body";
        popBody.innerHTML = body;
    popDiv.appendChild(popBody);

    $(".popup").remove();
    document.body.appendChild(popDiv);
    this.element = popDiv;

    if (this.element.offsetWidth + this.element.offsetLeft + getScrollerWidth() >= window.innerWidth) {
        this.element.className += " right";
        this.element.style.left = (this.element.offsetLeft - this.element.offsetWidth - getScrollerWidth() - 20) + "px";
    }
    if (this.element.offsetHeight + this.element.offsetTop + getScrollerWidth() >= window.innerHeight) {
        this.element.className += " bottom";
        this.element.style.top = (this.element.offsetTop - this.element.offsetHeight - getScrollerWidth() - 20) + "px";
    }

    Object.defineProperty(this, "title", {
        get: function () { return this.element.getn("h3")[0].innerHTML; },
        set: function (title) { this.element.getn("h3")[0].innerHTML = title; }
    });
    Object.defineProperty(this, "body", {
        get: function () { return this.element.gecn("popup-body")[0].innerHTML; },
        set: function (body) { this.element.gecn("popup-body")[0].innerHTML = body; }
    });
}
TBI.HoverPopup.bindElement = function (element, title, body) {
    if (element instanceof Array || element instanceof $) TBI.HoverPopup.bindElements(element, title, body);
    else {
        $(element).mousemove(function (title, body) {
            return function (event) {
                var popup = new TBI.HoverPopup(event.clientX, event.clientY, title, body);
            }
        }(title, body));
        $(element).mouseleave(function () {
            $(".popup").remove();
        });
    }
}
TBI.HoverPopup.bindElements = function (elementArray, title, body) {
    for (var i=0;i<elementArray.length;i++)
        TBI.HoverPopup.bindElement(elementArray[i], title, body);
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
    else if (!isNull(element.checked)) return element.checked = isNull(bool)?!element.checked:bool;
    var isToggled = TBI.isToggled(element);
    if (!isToggled && bool !== false) { element.className += " on"; }
    else if (isToggled && bool !== true) { element.className = element.className.replace(" on",""); }
    if (!isNull(bool) && bool !== isToggled || isNull(bool)) $(element).click();
    return TBI.isToggled(element);
}
// Returns whether or not a specified toggleable element is toggled or not.
TBI.isToggled = function (element) { return isNull(element.checked)?element.className.search(" on") != -1:element.checked; }
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
        } else var item = parseFloat(records[i].className.match(/ torder-[0-9]+/)[0].match(/[0-9]+/)[0]);
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
// Adds a coordinate popup to a specified canvas. (DO NOT USE)
Canvas2D.inspector = function (context) {
    var cvs = context.canvas;
    $(cvs).off("mousemove");
    if (context.inspector) {
        $(cvs).mousemove(function (event) {
            new TBI.HoverPopup(
                event.clientX,
                event.clientY,
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
    if (path[0] instanceof Coords) context.moveTo(path[0].x, path[0].y);
    else context.moveTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++)
        if (path[i] instanceof Coords) context.lineTo(path[i].x, path[i].y)
        else context.lineTo(path[i][0], path[i][1]);
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
CanvasRenderingContext2D.prototype.endPath =
CanvasRenderingContext2D.prototype.finishPath =
CanvasRenderingContext2D.prototype.closePath;
CanvasRenderingContext2D.prototype.startPath =
CanvasRenderingContext2D.prototype.openPath =
CanvasRenderingContext2D.prototype.beginPath;
CanvasRenderingContext2D.prototype.drawCircle = function (x, y, r, s) {
    this.beginPath();
    this.arc(x, y, r, 0, dtr(360), false);
    if (s) this.stroke();
    else this.fill();
    this.closePath();
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
        var url = new URL(this.href),
            hash = url.hash;
        if (path.isEqual(url.pathname.split('/')) && !isNull(hash) && !isNull($(hash))) {
            $(document).scrollTop(parseInt($(hash).offset().top - 64));
            return false;
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
// Fetches a dynamic content manifest.
TBI.fetchIndex = function () {
    TBI.AJAX("/assets/data/work.json", function (xhr) {
        TBI.content = $.parseJSON(xhr.response).content;
        for (var i=0;i<TBI.content.length;i++) {
            TBI[TBI.content[i].name] = $.parseJSON(xhr.response).content[i].projects;
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
        toggleHTML += "<span class='right span'><a href='javascript:void(0)' ";
        toggleHTML += "class='up-down on' for='.item-info:nth("+i+")'>";
        toggleHTML += "Toggle</a></span>";
        $($(".version")[i]).html(items[i].version + toggleHTML);
    }
}
// Checks for when the web fonts have loaded.
TBI.checkFonts = function () {
    if ($("#fontload").length == 0) {
        TBI.Loader.complete("Fonts", TBI.Loader.ERR);
        return false;
    }
    var fonts = $("#fontload span"),
        refWidths = [],
        ftimer = 0;
    for (var i=0;i<fonts.length;i++) refWidths.push(parseInt(fonts[i].css("width")));
    $("#fontload").toggleClass("eval", true);
    TBI.timerSet("fontload", 10, function () {
        for (var i=0,t=0;i<fonts.length;i++) if (parseInt(fonts[i].css("width")) != refWidths[i]) t++;
        if (t >= fonts.length || ftimer > 2000) {
            TBI.timerClear("fontload");
            $("#fontload").remove();
            if (t >= fonts.length) TBI.Loader.complete("Fonts", TBI.Loader.DONE);
            else TBI.Loader.complete("Fonts", TBI.Loader.TIMEOUT);
        }
        ftimer += 10;
    });
}
var testtime = new Date().getTime();
// Called when the HTML includes of the page have all loaded.
$(document).on("pageload", function () {
    TBI.loaded = true;
    TBI.Loader.event("Page loaded", true);
    $("html")[0].className = $("html")[0].className.replace(/ (init|loading)/, "");
    TBI.findPage();
    var nav = "#top";
    TBI.checkNav(nav);
    TBI.navMoveTo(nav+" .nav-indicator", $(nav));
    TBI.updateLinks();
    TBI.updateUI();
    // interactive scrolling - marks the closest item to the scroll position
    var tempscroll = false,
        headers = $("h2.item[id], h2.section[id]"),
        tries = 0;
    $(document).scroll(function () {
        var hash = "",
            currScroll = new Coords(window.scrollX, window.scrollY);
        if (currScroll.y > 0) $(".nav-top").slideDown();
        else $(".nav-top").slideUp();
        if (tempscroll) return tempscroll = false;
        for (var i=0;i<headers.length;i++) if ($(headers[i]).offset().top < currScroll.y + 100) hash = "#"+headers[i].id;
        if (hash != location.hash) {
            location.hash = hash;
            tempscroll = true;
            scrollTo(currScroll.x, currScroll.y);
        }
    });
    // scroll to current hash
    if (!isNull(location.hash) && !isNull($(location.hash.toString()))) {
        TBI.timerSet("scroll",10,function () {
            if (!isNull($(location.hash).offset())) {
                $(document).scrollTop(parseInt($(location.hash).offset().top - 58));
                TBI.timerClear("scroll");
            } else if (location.hash.length < 2) TBI.timerClear("scroll");
        });
    }
    // test page konami code (w/o enter)
    var konami = [Keys.UP,Keys.UP,Keys.DOWN,Keys.DOWN,Keys.LEFT,Keys.RIGHT,Keys.LEFT,Keys.RIGHT,Keys.B,Keys.A],
        kCode = 0;
    $(document).keydown(function (event) {
        if (event.which == konami[kCode]) kCode++;
        else kCode = 0;
        if (kCode >= konami.length)
            if (!path.isEqual(["test"])) location.href = location.origin + "/test/";
            else if (!isNull(history)) history.back();
    });
    $(window).blur(function () { $("body").toggleClass("in-focus", false) });
    $(window).focus(function () { $("body").toggleClass("in-focus", true) });
    $("body").toggleClass("in-focus", true);
});
window.onerror = function (message, url, line, column, e) {
    if (TBI.error == undefined) document.body.innerHTML = "Error encountered in "+url+":"+line+":"+column+"\n"+message;
    else TBI.error(e);
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
                if (isNull(job.dependencies)) job.dependencies = [];
                if (isNull(job.conditions)) job.conditions = [];
                if (isNull(job.msg)) job.msg = {};
                if (TBI.Loader.progress.indexOf(job.id) == -1 && TBI.Loader.completed.indexOf(job.id) == -1) {
                    job.dependencies.forEach(function (dep) {
                        if (TBI.Loader.completed.indexOf(dep) == -1) depSatisfied = false
                    });
                    job.conditions.forEach(function (cond) {
                        if (!cond()) condSatisfied = false
                    });
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
            case TBI.Loader.ERR: var message = TBI.Loader.jobs[loc].msg.error || id + " failed"; break;
            case TBI.Loader.TIMEOUT: var message = TBI.Loader.jobs[loc].msg.timeout || id + " timed out"; break;
            case TBI.Loader.DONE: var message = TBI.Loader.jobs[loc].msg.done || id + " done"; break;
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
// END OF COOKIE CODES //
// PERFNOW - All thanks to Daniel Lamb <dlamb.open.source@gmail.com>
// On GitHub at: https://github.com/daniellmb/perfnow.js
function perfnow(o){"performance"in o||(o.performance={});var e=o.performance;o.performance.now=e.now||e.mozNow||e.msNow||e.oNow||e.webkitNow||Date.now||function(){return(new Date).getTime()}}perfnow(window);
// GUID GENERATOR - All thanks to the StackExchange community
// On StackExchange at: https://stackoverflow.com/a/8809472
function generateUUID(){var d=performance.now(),uuid='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=(d+Math.random()*16)%16|0;d=Math.floor(d/16);return(c=='x'?r:(r&0x3|0x8)).toString(16)});return uuid}
