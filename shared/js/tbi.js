function gebi(element) { return document.getElementById(element); };
// Checks the state of an XHR.
function checkState(request) {
    if (request.readyState == 4) {
        return 1;
    }
}
// A XMLHttpRequest object constructor.
function XHR() {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {
        xhr = new ActiveXObject("Microsoft.XMLHTTP");
    }
	else {
		throw new Error("You are not using a supported browser.");
	}
    return xhr;
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
var now = new Date();
var unqid = now.getTime();
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
        }
        else if (num == 2) {
            return [0, 1];
        }
        else if (num < 2) {
            return [0];
        }
        else if (num > 500) {
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
        }
        else if (num > 10000) {
            return "No!";
        }
        else {
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
        if (num == 1) {
            return [1];
        }
        else if (num > 1000) {
            return "No!";
        }
        var j = 1;
        var k = 0;
        var sequence = [];
        for (i = 1; i <= num; i++) {
            k += j++;
            sequence.push(k);
        }
        return sequence;
    }
}
// Determines whether or not a number is even.
function isEven(num) {
    return (num % 2 == 0);
}
// Returns the numbers that go into the specified number.
function divisors(num) {
	if (num > 10e7) {
		return "Nope!";
	}
	else {
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
// Why don't I use setInterval? Because of this.
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
// And this.
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
function updateHeight() {
	if ($("#maincontent").height() - $("#maincontent").offset().top < innerHeight) {
		$("footer nav a").hide();
	} else {
		$("footer nav a").show();
	}
}
Popup.remove = function () {
	$(".popup").remove();
}
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
})
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
