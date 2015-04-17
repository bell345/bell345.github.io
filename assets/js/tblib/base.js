if (!window.jQuery) {
    throw new Error("[tblib/base.js] jQuery has not been loaded");

    document.body.innerHTML = "<P style='text-align:center;color:#333333;background:#EEEEEE;font-size:32px;padding:24px 48px;margin-top:300px;'>Either jQuery has failed to load, or your browser is too outdated to display this website properly. Please consider updating your browser to either <A href='http://google.com/chrome'>Google Chrome</A> or <A href='http://firefox.com'>Mozilla Firefox</A>.</P>";
} else {

$("html").toggleClass("no-js", false);
$("html").toggleClass("js", true);

var now = new Date();

if (!window.TBI) var TBI = {};
if (!window.TBI.Files) TBI.Files = {};
if (!window.TBI.UserSettings) TBI.UserSettings = {};

var query, path;
// Sets up the query variable with the search criteria.
TBI.requestManager = function () {
    var search = location.search;
    if (!isNull(location.search)) {
        search = search.replace("?","").split("&");
        for (var i=0;i<search.length;i++) {
            search[i] = search[i].split("=");
            if (search[i] != undefined && search[i].length > 1)
                query[search[i][0]] = search[i][1];
        }
    }
    var hash = location.hash;
    if (!isNull(location.hash)) {
        hash = hash.replace("#","").split("&");
        for (var i=0;i<hash.length;i++) {
            hash[i] = hash[i].split("=");
            if (hash[i].length != undefined && hash[i].length > 1)
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
    } else path = [];
}

TBI.TimerDB = {};
// Extended wrapper for setInterval() and setTimeout().
// Also supports a lookup table for global timer fun.
TBI.Timer = function (onCompletion, duration, repeat, timerName) {
    this.completed = false;
    this.startTime = new Date().getTime();

    this.timerName = isNull(timerName) ? generateUUID() : timerName;
    this.duration = isNaN(duration) ? 0 : duration;
    this.onCompletion = typeof onCompletion == "function" ? onCompletion : function () {};
    this.repeat = isNull(repeat) ? false : repeat;

    var setFunc = this.repeat ? setInterval : setTimeout;
    this.timer = setFunc(function (timer) {
        return function () { timer.completed = true; timer.onCompletion(timer); };
    }(this), this.duration);

    this.clear = function () {
        if (this.repeat) clearInterval(this.timer);
        else clearTimeout(this.timer);
        TBI.TimerDB[this.timerName] = undefined;
    };
    this.finish = function () {
        this.clear();
        this.onCompletion(this);
    };

    if (this.elapsedTime == undefined) Object.defineProperty(this, "elapsedTime", {
        get: function () {
            return new Date().getTime() - this.startTime;
        }
    });
    TBI.TimerDB[this.timerName] = this;
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
// Determines whether or not a number is even.
function isEven(n) { return n%2==0 }
// Determines whether or not a variable is nothing at all.
function isNull(thing) {
    if (thing instanceof Array) {
        for (var i=0;i<thing.length;i++)
            if (isNull(thing[i])) return true;
        return (thing.length == 0)
    } else return (thing == undefined || thing === "" || thing == null || thing !== thing)
}
// Determines whether a number is negative.
function isNegative(num) { return (Math.abs(num) != num); }

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

$(function () {
    TBI.requestManager();
});

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

}
