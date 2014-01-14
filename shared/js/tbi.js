var now = new Date();
var unqid = now.getTime();
// Shorthand for getElementById.
function gebi(element) { return document.getElementById(element); };
// Checks the state of an XHR.
function checkState(request) { return (request.readyState == 4); };
// A XMLHttpRequest object constructor.
function XHR() {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    } else {
		throw new Error("You are not using a supported browser.");
	}
    return xhr;
}
// Returns first-level elements in an XML index.
function findIndex(file, name) {
    if (navigator.userAgent.indexOf("Trident") != -1)
        var xml = file.responseXML;
    else 
        var xml = $.parseXML(file.response);
    return xml.getElementsByTagName(name);
}
// Appends HTML to an element.
function modifyHtml(id, mod) {
	var thing = document.getElementById(id);
	thing.innerHTML += mod;
}
// Shortens a string by an index.
function shorten(str, index) {
    var tempstr = [];
    for (i = 0; i < str.length; i++) {
        if (i < index) {
            tempstr.push(str[i]);
        }
        else if (i == index){
            var out = tempstr.join("");
            return out;
        }
    }
}
// Highlights a nav link to the same page.
function findPage() {
    var currpage = location.pathname;
    var children = $("nav").children();
    for (i = 0; i < $("nav").children().length; i++) {
        if (children[i].getAttribute("href") == currpage) {
            children[i].id = "curr";
        }
    }
}
// Returns a fibonacci sequence.
function fibonacci(num) {
    if (!isNaN(num)) {
        if (num > 2) {
            var sequence = [0, 1];
        } else if (num == 2) {
            return [0, 1];
        } else if (num < 2) {
            return [0];
        } else if (num > 500) {
            return "No!";
        }
        for (i = 2; i < num; i++) {
            sequence.push(sequence[i - 1] + sequence[i - 2]);
        }
        return sequence;
    }
}
// Returns a list of the square numbers up to the specified root.
function squares(num) {
    if (!isNaN(num)) {
        if (num == 1) {
            return [1];
        } else if (num > 10000) {
            return "No!";
        } else {
            var sequence = [1]
        }
        for (i = 2; i <= num; i++) {
            sequence.push(Math.pow(i, 2));
        }
        return sequence;
    }
}
// Returns triangular numbers up to the specified number.
function tris(num) {
    if (!isNaN(num)) {
        var sequence = [];
        if (num == 1) {
            return [1];
        } else if (num > 1000) {
            return "No!";
        }
        for (i = 1, j = 1, k = 0; i <= num; i++) {
            k += j++;
            sequence.push(k);
        }
        return sequence;
    }
}
// Determines whether or not a number is even.
function isEven(num) { return (num % 2 == 0); }
// Returns the numbers that go into the specified number.
function divisors(num) {
	if (num > 10e7) {
		return "Nope!";
	} else {
		var divisors = [];
		for (i=1;i<=num/2;i++) {
			if (num%i == 0) {
				divisors.push(i);
			}
		}
		divisors.push(num);
		return divisors;
	}
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
	if (month < 10) {month="0"+month};
	if (day < 10) {day="0"+day};
	if (hour < 10) {hour="0"+hour};
	if (minute < 10) {minute="0"+minute};
	if (second < 10) {second="0"+second};
	return [date.getTime(), date.getFullYear(), month, day, hour, minute, second];
}
// Returns a random integer.
function randomInt(num) {
	return parseInt(Math.random()*num);
}
// Creates a customizable, absolutely positioned popup element.
// There can only be one at a time.
function Popup(x, y, head, text) {
	this.x = x;
	this.y = y;
	this.head = head;
	this.text = text;
	var body = $('body');
	var pup = "";
	pup += "<div class='popup' style='top:"+this.y+"px;left:"+this.x+"px;'>";
	pup += "<h3>"+this.head+"</h3>";
	pup += "<p class='main'>"+this.text+"</p>";
	pup += "</div>";
	Popup.remove();
	body.append(pup);
}
// Updates the footer element based on the window size.
function updateHeight() {
	if ($("#maincontent").height() - $("#maincontent").offset().top < innerHeight) {
		$("footer nav a").hide();
	} else {
		$("footer nav a").show();
	}
}
function updateLinks() {
    for (i = 0; i < $("a").length; i++) {
        if ($($("a")[i]).attr("href").search(/((http|https|mailto|news):|\/\/)/) == 0) {
            $($("a")[i]).attr("target", "_blank");
            $($("a")[i]).attr("class", "external");
        }
    }
}
// Removes all Popups.
Popup.remove = function () {
	$(".popup").remove();
}
// START INCLUDE CODE //
// Code for implementing a client-side HTML includes system.
// An alternative to PHP includes.
var HTMLIncludes = {};
HTMLIncludes.index;
HTMLIncludes.info = [];
HTMLIncludes.getDone = [];
HTMLIncludes.includes = [];
HTMLIncludes.getIndex = function () {
    var xhr = new XHR();
    xhr.open("GET", "/shared/html/includes.xml?"+unqid, true);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (checkState(xhr)) {
            HTMLIncludes.index = findIndex(xhr, "include");
            HTMLIncludes.list();
        }
    }
}
HTMLIncludes.list = function () {
    var indx = HTMLIncludes.index;
    var len = indx.length;
    for (i = 0; i < len; i++) {
        var tempIncl = [];
        try {
            for (j = 0; j < indx[0].children.length; j++) {
                tempIncl.push(indx[i].children[j].textContent);
            }
        } catch (e) {
            for (j = 0; j < indx[0].childNodes.length; j++) {
                if (indx[i].childNodes[j].localName != null)
                    tempIncl.push(indx[i].childNodes[j].textContent);
            }
        }
        HTMLIncludes.info.push(tempIncl);
    }
    HTMLIncludes.get();
}
HTMLIncludes.get = function () {
    var current = 0;
    for (i = 0; i < HTMLIncludes.info.length; i++) {
        HTMLIncludes.getDone[i] = false;
    }
    timerSet("includes", 200, function () {
        if (!HTMLIncludes.getDone[current]) {
            HTMLIncludes.getDone[current] = true;
            var xhr = new XHR();
            xhr.open("GET", HTMLIncludes.info[current][0], true);
            xhr.send();
            xhr.onreadystatechange = function () {
                if (checkState(xhr)) {
                    HTMLIncludes.includes[current] = xhr.response;
                    $(HTMLIncludes.info[current][1]).html(HTMLIncludes.includes[current]);
                    if (current == HTMLIncludes.getDone.length - 1) {
                        timerClear("includes");
                        updateHeight();
                        updateLinks();
                    } else {
                        current++;
                    }
                }
            }
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
    updateHeight();
    $(document).scroll(function () {
        var navHeight = parseInt($("#top").css("height")) + (parseInt($("#top").css("paddingTop")) * 2);
        if ($(document).scrollTop() > parseInt($("header").css("height"))+parseInt($("header").css("paddingBottom"))) {
            $("#top").css("position", "fixed");
            $("#top").css("width", "100%");
            $("#top").css("zIndex", "9");
            $("#content").css("top", navHeight + "px");
        } else {
            $("#top").css("position", "relative");
            $("#top").css("width", "auto");
            $("#top").css("zIndex", "0");
            $("#content").css("top", "0");
        }
    });
    HTMLIncludes.getIndex();
    $(document).resize(function () { updateHeight(); });
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
function checkSession() {return readCookie("session")};
// END OF COOKIE CODES //
