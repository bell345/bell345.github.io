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
        var a = " dwn";
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
        var a = " on";
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
// Returns whether or not two arrays are the same.
Array.prototype.isEqual = function (arr) { return isEqual(this, arr); }
// Determines whether or not an array contains a particular item.
Array.prototype.contains = function (item) {
    for (var i=0;i<this.length;i++) if (isEqual(this[i], item)) return true; return false;
}
// Replaces all instances of a specified string or regular expression with the given replacement string.
String.prototype.replaceAll = String.prototype.replaceAll || function (toReplace, replacement) {
    var str = this;
    while (str.search(toReplace) != -1) str = str.replace(toReplace, replacement);
    return str;
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
// END OF COOKIE CODES //
