// TBI.JS - V4.11.1
// Base functions, variables and helpers that are included and required in
// all of my website pages.
// START INCOMPATIBILITY CODE //
document.onreadystatechange = function () {
    if (!window.jQuery) {
        var incompat = "";
        incompat += "<DIV style='width:100%;height:100%;background-color:#fff;color:#000;font-size:24px;padding:16px;'>";
        incompat += "<H1 style='font-size:64px;font-family:monospace;color:#000;margin-bottom:48px;'>Your browser is unsupported.</H1>";
        incompat += "<P style='text-align:center;margin:0 200px 0 200px;'>Your browser is too out of date to view the website content properly. ";
        incompat += "";
        incompat += "Please upgrade your browser, preferably to either <A href='http://google.com/chrome'>Google Chrome</A> ";
        incompat += "or <A href='http://firefox.com'>Mozilla Firefox</A>.</P>";
        incompat += "</DIV>";
        document.body.innerHTML = incompat;
    }
}
// END INCOMPATIBILITY CODE //
var now = new Date(),
    unqid = now.getTime(),
    query = {},
    path = [],
    notePrevInfo = {
        "head" : [], 
        "text" : [],
        "type" : []
    };
// START CONSOLE NOTIFICATIONS //
function log(message, timeout) {
    console.log(message);
    timeout = isNull(timeout) ? 30000 : timeout;
    new Notification("Log", message, 0, timeout);
}
function warn(message, timeout) {
    console.warn(message);
    timeout = isNull(timeout) ? 40000 : timeout;
    new Notification("Warning", message, 0, timeout);
}
function error(message, timeout) {
    console.error(message);
    var orig = message;
    if (typeof(message) == "object")
        message = message.message;
    timeout = isNull(timeout) ? 50000 : timeout;
    var onclick = "$($(this).parent()[0].getElementsByTagName(\"div\")[0]).slideToggle()";
    if (typeof(orig) == "object")
        new Notification("Error", 
            orig.message+"<button onclick='"+onclick+"'>Show/Hide Stack</button><div style='display:none'>"+orig.stack+"</div>", 
            1, 
            timeout);
    else
        new Notification("Error", message, 1, timeout);
}
// END CONSOLE NOTIFICATIONS //
$(function () {
    if (navigator.userAgent.search(/[Ff]irefox/)!=-1)
        document.body.className = "gecko";
    else if (navigator.userAgent.search(/[Ww]eb[Kk]it/)!=-1)
        document.body.className = "webkit";
    else if (navigator.userAgent.search(/[Tt]rident/)!=-1)
        document.body.className = "trident";
});
// Shorthand for getElementById.
function gebi(element) { return document.getElementById(element); }
// Checks the state of an XHR.
function checkState(request) { return (request.readyState == 4); }
// A XMLHttpRequest object constructor.
function XHR() { return window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"); }
// An AJAX (Asynchronous JavaScript And XML) GET request constructor.
function AJAX(url, func) {
    var xhr = new XHR();
    xhr.open("GET",url,true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (checkState(xhr)) {
            if (isNull(xhr.response))
                xhr.response = xhr.responseText;
            if (func instanceof Function)
                func();
        }
    }
    return xhr;
}
// Sets up the query variable with the search criteria.
function requestManager() {
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
		if (pathname.indexOf("/") == 0) {
			pathname = pathname.slice(1);
		}
		if (pathname.lastIndexOf("/") == pathname.length-1) {
			pathname = shorten(pathname, pathname.length-1);
		}
		path = pathname.split("/");
	}
}
function checkNav() {
    var navHeight = parseInt($("#top").css("height")) + (parseInt($("#top").css("paddingTop")) * 2);
    if ($(document).scrollTop() > parseInt($("header").css("height"))+parseInt($("header").css("paddingBottom"))) {
        $("#top").attr("class","floating");
        $("#content").css("top", navHeight + "px");
    } else {
        $("#top").attr("class","");
        $("#content").css("top", "0");
    }
    $("#top").off("mousemove");
    $("#top").off("mouseleave");
    $("#top a").mousemove(function (event) {
        var half = parseInt($("#navtop-container div").css("width"))/2;
        $("#navtop-container div").css("left", (event.clientX-half)+"px");
        $("#navtop-container div").css("transition", "all 0s");
        $("#navtop-container div").css("background", "#eee");
    });
    $("#top a").mouseleave(function (event) {
        $("#navtop-container div").css("transition", "all .4s");
        var pad = parseInt($("#curr").css("paddingLeft"))*2;
        var loc = $("#curr").offset().left + (parseInt($("#curr").css("width"))+pad)/2;
        var half = parseInt($("#navtop-container div").css("width"))/2;
        $("#navtop-container div").css("left", (loc - half) + "px");
        $("#navtop-container div").css("background", "#0094ff");
    });
    if ($("#top").length > 0) {
        $("#navtop-container div").css("transition", "all .4s");
        var pad = parseInt($("#curr").css("paddingLeft"))*2;
        var loc = $("#curr").offset().left + (parseInt($("#curr").css("width"))+pad)/2;
        var half = parseInt($("#navtop-container div").css("width"))/2;
        $("#navtop-container div").css("left", (loc - half) + "px");
        $("#navtop-container div").css("background", "#0094ff");
    }
}
// Returns first-level elements in an XML index.
function findIndex(file, name) {
    if (navigator.userAgent.search(/MSIE [0-9]/) != -1)
        var xml = $.parseXML(file.responseText);
    if (navigator.userAgent.indexOf("Trident") != -1)
        var xml = file.responseXML;
    else 
        var xml = $.parseXML(file.response);
    return xml.getElementsByTagName(name);
}
// Appends HTML to an element.
function modifyHtml(id, mod) {
	var thing = gebi(id);
	thing.innerHTML += mod;
}
// Shortens a string by an index.
function shorten(str, index) {
    var tempstr = [];
    if (str.length > 0 && !isNull(str)) {
        for (var i = 0; i < str.length; i++) {
            if (i < index)
                tempstr.push(str[i]);
            else if (i == index)
                return tempstr.join("");
        }
    }
}
function zeroPrefix(num) { return (num<10?"0":"")+num; }
// Highlights a nav link to the same page.
function findPage() {
    var curr = path[0];
	if (isNull(curr))
		curr = "";
	var navbar = $("#top a");
    for (var i = 0; i < navbar.length; i++)
        if ($(navbar[i]).attr("href").split("/")[1] == curr)
            $(navbar[i]).attr("id","curr");
}
// Determines whether or not a number is even.
function isEven(num) { return (num % 2 == 0); }
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
// Returns the numbers that go into the specified number.
function divisors(num) {
    var divisors=[];
    for (var i=1;i<=num/2;i++)
        if (num%i==0)
            divisors.push(i);
    divisors.push(num);
    return divisors;
}
// An externally edited replacement for setInterval.
function timerSet(timer, seconds, func) {
    if (typeof (func) == "function") {
        $(document).on(timer + "_timer" + "trig", func);
        window[timer + "_timer"] = setInterval(function () {
            $(document).trigger(timer + "_timer" + "trig");
        }, seconds);
    }
    else {
        $(document).on(timer + "_timer" + "trig", function () { return null; });
        window[timer + "_timer"] = setInterval(function () {
            $(document).trigger(timer + "_timer" + "trig");
        }, seconds);
    }
}
// Clears a timerSet.
function timerClear(timer) {
    if (window[timer + "_timer"]) {
        clearInterval(window[timer + "_timer"]);
        window[timer + "_timer"] = undefined;
        $(document).off(timer + "_timertrig")
    }
}
// Returns a preformatted array of the date object specified.
function unixToString(date) {
	if (date.getMonth() == 0) {var month=1}
	else {var month = date.getMonth()+1};
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
// Returns a random integer.
function randomInt(num) { return parseInt(Math.random()*num) }
// Returns a random integer between two numbers.
function advRandomInt(num1, num2) { return parseInt(Math.random()*(num2-num1))+num1; }
// For legacy applications.
function intRand(num) { return randomInt(num) }
// Degrees to radians.
function dtr(deg) { return (Math.PI/180)*deg }
// For keypress events.
// Converts a keypress event keycode into the character typed.
// Returns null when an invisible character is typed (shift, alt, etc.)
function convertKeyDown(event) {
    var which = event.which;
    if (which>8&&which<47) {
        var chars = ["backspace","tab","","","","return","","","shift","control","alt","pause","caps",
            "","","","","","","escape","","","","","","page up","page down","end","home","left","up","right",
            "down","","","","","insert","delete"];
        return chars[which-8];
    } else if (which>47&&which<91) {
        if (event.shiftKey)
            var chars = ")!@#$%^&*(ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        else
            var chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        return chars[which%48];
    } else if (which>95&&which<112) {
        var chars = "0123456789*+ -./";
        return chars[which%96];
    } else if (which>185&&which<193) {
        if (event.shiftKey)
            var chars = ":+<_>?~";
        else
            var chars = ";=,-./`";
        return chars[which%186];
    } else if (which>218&&which<223) {
        if (event.shiftKey)
            var chars = "{|}\"";
        else
            var chars = "[\\]'";
        return chars[which%219];
    } else return null;
}
// Creates a customizable, absolutely positioned popup element.
// There can only be one at a time.
Popup.registry = [];
function Popup(x, y, head, text) {
	this.x = x;
	this.y = y;
	this.head = head;
	this.text = text;
	var body = $('body');
	var pup = "";
	pup += "<div class='popup' style='top:"+this.y+"px;left:"+this.x+"px;'>";
    if (!isNull(this.head)) pup += "<h3>"+this.head+"</h3>";
	pup += "<p class='main'>"+this.text+"</p>";
	pup += "</div>";
	$(".popup").remove();
	body.append(pup);
    if (parseInt($(".popup").css("width"))+parseInt($(".popup").css("left"))+120 > window.innerWidth) {
        $(".popup").attr("class", $(".popup").attr("class") + " right");
        $(".popup").css("left", (parseInt($(".popup").css("left")) - parseInt($(".popup").css("width")) - 40) + "px");
    }
    if (parseInt($(".popup").css("height"))+parseInt($(".popup").css("top"))+20 > window.innerHeight) {
        $(".popup").attr("class", $(".popup").attr("class") + " bottom");
        $(".popup").css("top", (parseInt($(".popup").css("top")) - parseInt($(".popup").css("height")) - 40) + "px");
    }
}
// Adds a popup when hovering over a specified element.
Popup.registry.add = function (element, head, text) {
    if (true) {
        Popup.registry.push([element, head, text]);
        $(element).off("mousemove");
        $(element).mousemove(function (event) {
            var thisReg = [];
            for (var i=0;i<Popup.registry.length;i++)
                if (Popup.registry[i][0] == $(this)[0])
                    thisReg = Popup.registry[i];
        new Popup(event.clientX+20, event.clientY+20, thisReg[1], thisReg[2]);
        });
        $(element).mouseleave(function () {
            $('.popup').remove();
        });
    } else {
        throw new Error("Supplied element is invalid.");
    }
}
// Removes an element from the registry.
Popup.registry.remove = function (element) {
    for (var i=0;i<Popup.registry.length;i++) 
        if (Popup.registry[i][0] == $(element)[0])
            Popup.registry[i] = undefined;
    $(element).off("mousemove");
}
// A predefined popup element that can be added to by using the same header.
// There can only be one notification type, but multiple messages and instances of messages.
function Notification(head, text, type, timeout) {
    this.type = isNull(type) ? 0 : type;
    timeout = isNull(timeout) ? 10000 : timeout;
    var states = ["ui-state-highlight", "ui-state-error"];
	this.head = head;
	this.text = text;
    this.noteNum = $(".notification").length;
    if (notePrevInfo["head"].indexOf(this.head)!=-1
    && !isNull(noteRemove_timer) 
    && notePrevInfo["text"].indexOf(this.text)==-1) {
        for (var i=0;i<this.noteNum;i++) {
            if ($($(".notification h3")[i]).text() == this.head) {
                $($(".notification ul.main")[i]).append("<li>"+this.text+"</li>");
            }
        }
    } else if (notePrevInfo["text"].indexOf(this.text)==-1 && notePrevInfo["head"].indexOf(this.head)==-1) {
        $(".notification").remove();
        var body = $('body');
        var pup = "";
        pup += "<div class='notification "+states[this.type]+" ui-corner-all'>";
        pup += "<h3>"+this.head+"</h3>";
        pup += "<ul class='main'><li>"+this.text+"</li></ul>";
        pup += "</div>";
        body.append(pup);
    } else if (notePrevInfo["head"].indexOf(this.head)!=-1 && notePrevInfo["text"].indexOf(this.text)!=-1) {
        for (var i=0;i<this.noteNum;i++) {
            if ($($(".notification h3")[i]).text() == this.head) {
                var lines = $(".notification ul.main").children();
                for (var j=0;j<lines.length;j++) {
                    if ($(lines[j]).text() == this.text) {
                        var prevNum = 0;
                        notePrevInfo["text"].forEach(function (el) {
                            if (el == text)
                                prevNum++;
                        });
                        var divStart = "<div class='list-num list-num-";
                        if (prevNum >= 9)
                            $(lines[j]).html(divStart+"plus'></div>"+$(lines[j]).text());
                        else 
                            $(lines[j]).html(divStart+(prevNum+1)+"'></div>"+$(lines[j]).text());
                    }
                }
            }
        }
    }
    timerClear("noteRemove");
    var timerCount = 0;
    timerSet("noteRemove",500,function () {
        if (timerCount >= timeout)
            $(".notification").hide();
        if ($($(".notification")[0]).css("display")=="none") {
            $(".notification").remove();
            notePrevInfo = {
                "head" : [], 
                "text" : [],
                "type" : []
            };
            timerClear("noteRemove");
            timerCount = 0;
        }
        timerCount+=500;
    });
    notePrevInfo["head"].push(this.head);
    notePrevInfo["text"].push(this.text);
    notePrevInfo["type"].push(this.type);
}
// For Blink only.
// Generates a desktop notification outside of the regular environment.
function chromeNotification(img, title, desc, link) {
    if (isNull(window.webkitNotifications)) return null;
    var permission = window.webkitNotifications.checkPermission();
    if (permission == 0) {
        var note = window.webkitNotifications.createNotification(
            img, title, desc
        );
        if (!isNull(link))
            note.onclick = function () {
                window.open(link);
            }
        note.show();
    } else window.webkitNotifications.requestPermission();
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
            new Popup(
                event.clientX + 20,
                event.clientY + 20,
                "Canvas Inspector",
                event.offsetX + "X, " + event.offsetY + "Y"
            );
        });
        $(cvs).mouseleave(function () { $('.popup').remove() });
    } else return null;
}
// Processes a string of canvas commands.
Canvas2D.path = function (context, obj) {
    var path = obj.path;
    var type = obj.type;
    var style = obj.style;
    context[type+"Style"] = style;
    context.beginPath();
    context.moveTo(path[0][0], path[0][1]);
    for (var i = 1; i < path.length; i++)
        context.lineTo(path[i][0], path[i][1]);
    context.closePath();
    context[type]();
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
// Updates the footer element based on the window size.
function updateHeight() {
	if ($("#maincontent").length > 0 && $("#maincontent").height() - $("#maincontent").offset().top < innerHeight)
		$("footer nav a").hide();
	else
		$("footer nav a").show();
}
// Designates outgoing links.
function updateLinks() {
    for (var i = 0; i < $("a[href]").length; i++) {
        if ($("a[href]:nth("+i+")").attr("href").search(/((http|https|mailto|news):|\/\/)/) == 0) {
            $("a[href]:nth("+i+")").attr("target", "_blank");
            $("a[href]:nth("+i+")").attr("class", "external");
        }
    }
}
// START INCLUDE CODE //
// Code for implementing a client-side HTML includes system.
// An alternative to PHP includes.
var HTMLIncludes = {};
HTMLIncludes.info = [];
HTMLIncludes.getDone = [];
HTMLIncludes.includes = [];
HTMLIncludes.getIndex = function () {
    var xhr = new AJAX("/shared/data/includes.json", function () {
        HTMLIncludes.info = $.parseJSON(xhr.response).includeIndex;
        HTMLIncludes.get();
    });
}
HTMLIncludes.get = function () {
    var curr = 0;
    for (var i = 0; i < HTMLIncludes.info.length; i++)
        HTMLIncludes.getDone[i] = false;
    timerSet("includes", 200, function () {
        if (!HTMLIncludes.getDone[curr]) {
            HTMLIncludes.getDone[curr] = true;
            var xhr = new AJAX(HTMLIncludes.info[curr].source, function () {
                HTMLIncludes.includes[curr] = xhr.response;
                $(HTMLIncludes.info[curr].insert).html(HTMLIncludes.includes[curr]);
                if (curr == HTMLIncludes.getDone.length - 1) {
                    timerClear("includes");
                    updateHeight();
                    updateLinks();
                    $(document).trigger("includesDone");
                } else curr++;
            });
        }
    });
}
// END INCLUDE CODE //
// For *special* browsers.
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj, start) {
        for (var i = (start || 0), j = this.length; i < j; i++) {
            if (this[i] === obj) { return i; }
        }
        return -1;
    }
}
$(function () {
	requestManager();
    updateHeight();
    checkNav();
    $(document).scroll(function () { checkNav() });
    $(".ajaxProgress").progressbar({ value: false });
    HTMLIncludes.getIndex();
    $(document).resize(function () { updateHeight(); });
    $("button.toggle").click(function () {
        var a = " toggle-on";
        var c = this.className;
        this.className=c.search(a)!=-1?c.replace(a,""):c+a;
    });
    $(".switch").click(function () {
        var toSwitch = $("#"+$(this).attr("for"));
        if (toSwitch.length > 0)
            toSwitch.fadeToggle();
    });
});
// START OF COOKIE CODES //
function createCookie(name, value, days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
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
function eraseCookie(name) {
    createCookie(name, "", -1);
}
// END OF COOKIE CODES //
// json2.js -- Credit to Douglas Crockford -- //
// START JSON2.JS //
if(typeof JSON!=='object'){JSON={};}
(function(){'use strict';function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(){return this.valueOf();};}
var cx,escapable,gap,indent,meta,rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(var i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(var i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(var i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());
// END JSON2.JS //