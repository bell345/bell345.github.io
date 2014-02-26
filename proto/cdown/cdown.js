function gebi(element) { return document.getElementById(element); };
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
function isNull(thing) {
    if (thing instanceof Array) {
        for (i=0;i<thing.length;i++)
            if (thing[i] == undefined || thing[i] === "" || thing[i] == null)
                return true;
        return (thing.length == 0)
    }
    return (thing == undefined || thing === "" || thing == null)
}
function chromeNotification(img, title, desc, link) {
    if (isNull(window.webkitNotifications))
        return null;
    var permission = window.webkitNotifications.checkPermission();
    if (permission == 0) {
        var note = window.webkitNotifications.createNotification(
            img, title, desc
        );
        if (!isNull(link)) {
            note.onclick = function () {
                window.open(link);
                note.close();
            }
        }
        note.show();
    } else {
        window.webkitNotifications.requestPermission();
    }
}
var query = {};
function queryManager() {
	var search = location.search;
	if (!isNull(location.search)) {
		search = search.replace("?","");
		search = search.split("&");
		for (i=0;i<search.length;i++) {
			search[i] = search[i].split("=");
			query[search[i][0]] = search[i][1];
		}
	}
}
function Popup(x, y, head, text) {
	this.x = x;
	this.y = y;
	this.head = head;
	this.text = text;
	var body = $('body');
	var pup = "";
	pup += "<div class='popup' style='top:"+this.y+"px;left:"+this.x+"px;'>";
    if (!isNull(this.head))
        pup += "<h3>"+this.head+"</h3>";
	pup += "<p class='main'>"+this.text+"</p>";
	pup += "</div>";
	$(".popup").remove();
	body.append(pup);
}
var Cdown = {};
Cdown.rightNow = new Date();
Cdown.expand = true;
Cdown.active = false;
Cdown.name = "";
Cdown.monthLengths = [null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
Cdown.bypass = false;
Cdown.timestamp;
Cdown.mode = 0;
Cdown.prevTime = {};

Cdown.main = function (enddate, dest) {
    this.rightNow = new Date();
    var bStr = unixToString(enddate);
    var nStr = unixToString(this.rightNow);
    var resultStr = unixToString(this.rightNow);
    offset = [null, 2100, 12, Cdown.monthLengths[parseInt(nStr[2])], 24, 60, 60];
    var it;
    for (it = 6; it > 0; it--) {
        if (parseInt(parseInt(bStr[it]) - nStr[it]) < 0) {
            bStr[it - 1]--;
            resultStr[it] = offset[it] - Math.abs(parseInt(bStr[it]) - nStr[it]);
        }
        else {
            resultStr[it] = parseInt(bStr[it]) - nStr[it];
        }
    }
    for (it = 4; it < 7; it++) {
        if (resultStr[it] < 10) {
            resultStr[it] = "0" + resultStr[it];
        }
    }
    var plurals = [];
    var active = 6;
    var searchActive = true;
    for (it = 1; it < 7; it++) {
        if (resultStr[it] == 1) {
            plurals[it] = "";
        }
        else {
            plurals[it] = "s";
        }
        if (resultStr[it] > 0 && searchActive) {
            searchActive = false;
            active = it;
        }
    }
    var finalCountdown = "";
    if (this.expand) {
        if (active <= 1) finalCountdown += resultStr[1] + " year" + plurals[1] + " ";
        if (active <= 2) finalCountdown += resultStr[2] + " month" + plurals[2] + " ";
        if (active <= 3) finalCountdown += resultStr[3] + " day" + plurals[3] + " ";
        if (active <= 4) finalCountdown += resultStr[4] + " hour" + plurals[4] + " ";
        if (active <= 5) finalCountdown += resultStr[5] + " minute" + plurals[5] + " ";
        if (active <= 6) finalCountdown += resultStr[6] + " second" + plurals[6] + " ";
    }
    else {
        if (active <= 3) finalCountdown += Math.floor(resultStr[3] + resultStr[2] * 30 + resultStr[1] * 365) + " day(s) ";
        if (active <= 4) finalCountdown += resultStr[4] + ":";
        if (active <= 5) finalCountdown += resultStr[5] + ".";
        if (active <= 6) finalCountdown += resultStr[6];
    }
    var cDownTitle = "";
    if (active <= 3) cDownTitle += Math.floor(resultStr[3] + resultStr[2] * 30 + resultStr[1] * 365) + "d ";
    if (active <= 4) cDownTitle += resultStr[4] + ":";
    if (active <= 5) cDownTitle += resultStr[5] + ".";
    if (active <= 6) cDownTitle += resultStr[6];
    if (isNull(Cdown.prevTime))
        Cdown.prevTime = resultStr;
    if (bStr[0] >= nStr[0] && Cdown.prevTime[6] != resultStr[6]) {
        $("#" + dest).html(finalCountdown);
        this.active = true;
        Cdown.timestamp = bStr[0];
        Cdown.mode = 0;
        document.title = "CDown - "+cDownTitle;
        Cdown.prevTime = resultStr;
    }
    else if (bStr[0] < nStr[0]) {
        $("#" + dest).html("Countdown over!!!");
        this.active = false;
		eraseCookie("cDown");
		Cdown.check(false);
        chromeNotification("http://localhost:83/shared/res/clock.png","Countdown over!!!", Cdown.name);
        document.title = "CountDown";
    }
}
Cdown.up = function (startdate, dest) {
    this.rightNow = new Date();
    var startStr = unixToString(startdate);
    var nowStr = unixToString(this.rightNow);
    var resultStr = unixToString(this.rightNow);
    offset = [null, 2100, 12, Cdown.monthLengths[parseInt(startStr[2])], 24, 60, 60];
    var it;
    for (it = 6; it > 0; it--) {
        if (parseInt(parseInt(nowStr[it]) - startStr[it]) < 0) {
            nowStr[it - 1]--;
            resultStr[it] = offset[it] - Math.abs(parseInt(nowStr[it]) - startStr[it]);
        }
        else {
            resultStr[it] = parseInt(nowStr[it]) - startStr[it];
        }
    }
    for (it = 4; it < 7; it++) {
        if (resultStr[it] < 10) {
            resultStr[it] = "0" + resultStr[it];
        }
    }
    var plurals = [];
    var active = 6;
    var searchActive = true;
    for (it = 1; it < 7; it++) {
        if (resultStr[it] == 1) {
            plurals[it] = "";
        }
        else {
            plurals[it] = "s";
        }
        if (resultStr[it] > 0 && searchActive) {
            searchActive = false;
            active = it;
        }
    }
    var finalCountdown = "";
    if (this.expand) {
        if (active <= 1) finalCountdown += resultStr[1] + " year" + plurals[1] + " ";
        if (active <= 2) finalCountdown += resultStr[2] + " month" + plurals[2] + " ";
        if (active <= 3) finalCountdown += resultStr[3] + " day" + plurals[3] + " ";
        if (active <= 4) finalCountdown += resultStr[4] + " hour" + plurals[4] + " ";
        if (active <= 5) finalCountdown += resultStr[5] + " minute" + plurals[5] + " ";
        if (active <= 6) finalCountdown += resultStr[6] + " second" + plurals[6] + " ";
    }
    else {
        if (active <= 3) finalCountdown += Math.floor(resultStr[3] + resultStr[2] * 30 + resultStr[1] * 365) + " day(s) ";
        if (active <= 4) finalCountdown += resultStr[4] + ":";
        if (active <= 5) finalCountdown += resultStr[5] + ".";
        if (active <= 6) finalCountdown += resultStr[6];
    }
    var timerTitle = "";
    if (active <= 3) timerTitle += Math.floor(resultStr[3] + resultStr[2] * 30 + resultStr[1] * 365) + "d ";
    if (active <= 4) timerTitle += resultStr[4] + ":";
    if (active <= 5) timerTitle += resultStr[5] + ".";
    if (active <= 6) timerTitle += resultStr[6];
    $("#" + dest).html(finalCountdown);
    document.title = "Timer - "+timerTitle;
    this.active = true;
    Cdown.timestamp = startStr[0];
    Cdown.mode = 1;
}
timerSet("nw", 100, function () { Cdown.rightNow = new Date() });
Cdown.verifyInput = function () {
    var inYear = $("#cdsetyear"),
        inMonth = $("#cdsetmonth"),
        inDay = $("#cdsetday"),
        inHour = $("#cdsethour"),
        inMinute = $("#cdsetminute"),
        inSecond = $("#cdsetsecond"),
        inArr = [inYear, inMonth, inDay, inHour, inMinute, inSecond];
        inArrValues = [inYear.val(), inMonth.val(), inDay.val(), inMinute.val(), inSecond.val()];
    Cdown.name = $("#cdsetname").val();
    var inCurrent = [];
    var inNow = unixToString(this.rightNow);
    var out = new Date();
    if (inYear.val() <= inNow[1]) { inCurrent[1] = true }
    if (inMonth.val() == inNow[2] && inCurrent[1]) { inCurrent[2] = true }
    if (inDay.val() == inNow[3] && inCurrent[2]) { inCurrent[3] = true }
    if (inHour.val() == inNow[4] && inCurrent[3]) { inCurrent[4] = true }
    if (inMinute.val() == inNow[5] && inCurrent[4]) { inCurrent[5] = true }
    for (i=0;i<inArr.length;i++)
        if (isNaN(inArr[i].val()) && !isNull(inArr[i].val()))
            inArr[i].val("00");
    if (isNull(inArrValues)) {
        alert("The values are invalid.");
        return false;
    }
    else if (inNow[1] > inYear.val() || inYear.val() > 2100) { alert("Year is invalid.") }
    else if (inCurrent[1] && inMonth.val() < inNow[2]) { alert("Month set in past.") }
    else if (inCurrent[2] && inDay.val() < inNow[3]) { alert("Day set in past.") }
    else if (inCurrent[3] && inHour.val() < inNow[4]) { alert("Hour set in past.") }
    else if (inCurrent[4] && inMinute.val() < inNow[5]) { alert("Minute set in past.") }
    else if (inCurrent[5] && inSecond.val() < inNow[6]) { alert("Second set in past.") }
    else if (inMonth.val() > 12 || inMonth.val() < 1) { alert("Month is invalid.") }
    else if (inDay.val() > Cdown.monthLengths[inNow[3]] || inDay.val() < 1) { alert("Day is invalid.") }
    else if (inHour.val() > 23 || inHour.val() < 0) { alert("Hour is invalid.") }
    else if (inMinute.val() > 59 || inMinute.val() < 0) { alert("Minute is invalid.") }
    else if (inSecond.val() > 59 || inSecond.val() < 0) { alert("Second is invalid.") }
    else {
        out.setSeconds(inSecond.val());
        out.setMinutes(inMinute.val());
        out.setHours(inHour.val());
        out.setDate(inDay.val());
        out.setMonth(parseInt(inMonth.val())-1);
        out.setFullYear(inYear.val());
        return out.getTime();
    }
    return false;
}
Cdown.check = function (bool) {
    var out = new Date();
    if (bool) {
        var input = this.verifyInput();
        if (input) {
            createCookie("cDown", input+","+Cdown.name+",0", 365);
            out.setTime(input);
            Cdown.set(out);
        }
        else
            Cdown.reset();
    }
    if (!isNull(query["t"]) && !isNaN(query["t"]) && !Cdown.bypass) {
        if (!isNull(query["n"])) {
            Cdown.name = decodeURI(query["n"]);
        }
        out.setTime(parseInt(query["t"]));
        console.log(out);
        if (isNull(query["m"]) || query["m"] == "0") {
            if (parseInt(query["t"]) > Cdown.rightNow.getTime()) {
                Cdown.set(out);
            }
        }
        else {
            Cdown.upSet(out);
        }
    } else if (readCookie("cDown")) {
		var cookie = readCookie("cDown").split(",");
        out.setTime(cookie[0]);
        Cdown.name = cookie[1];
        if (isNull(cookie[2]) || cookie[2] == "0")
            Cdown.set(out);
        else if (cookie[2] == "1")
            Cdown.upSet(out);
    } else
        Cdown.reset();
}
Cdown.reset = function () {
    $("#cdown-full").attr("class", "cdown cdset");
    $("#cdset").css("display", "block");
	$("#cd-fn-set").css("display", "block");
    $("#countup-set").css("display", "block");
    $("#cd-text-container").css("display", "none");
    $("#cdset-sub").css("display","inline");
    $("#cdset-web").css("display","inline");
    $("#cdown-full h3")[0].innerHTML = "Countdown";
    $("#cd-set-title").show();
    $("#cd-controls").hide();
    timerClear("cDown");
    document.title = "CountDown";
}
Cdown.set = function (out) {
    $("#cdown-full").attr("class", "cdown");
    $("#cdset").css("display", "none");
	$("#cd-fn-set").css("display", "none");
    $("#countup-set").css("display", "none");
    $("#cd-text-container").css("display", "block");
    Cdown.main(out, "cdown-count");
    timerSet("cDown", 50, function () { Cdown.main(out, "cdown-count") });
    $("#cdset-sub").css("display","none");
    $("#cdset-web").css("display","none");
    if (!isNull(Cdown.name))
        $("#cdown-full h3")[0].innerHTML = "Countdown - " + Cdown.name;
    $("#cd-set-title").hide();
    $("#cd-controls").show();
    document.title = "CountDown";
}
Cdown.upSet = function (out) {
    $("#cdown-full").attr("class", "cdown");
    $("#cdset").css("display", "none");
	$("#cd-fn-set").css("display", "none");
    $("#countup-set").css("display", "none");
    $("#cd-text-container").css("display", "block");
    Cdown.up(out, "cdown-count");
    timerClear("cDown");
    timerSet("cDown", 50, function () { Cdown.up(out, "cdown-count") });
    $("#cdset-sub").css("display","none");
    $("#cdset-web").css("display","none");
    $("#cdown-full h3")[0].innerHTML = "Timer";
    if (!isNull(Cdown.name))
        $("#cdown-full h3")[0].innerHTML = "Timer - " + Cdown.name;
    $("#cd-set-title").hide();
    $("#cd-controls").show();
    document.title = "Timer";
}
Cdown.checkfn = function () {
	var fnYear = $("#cdfn-year"),
		fnMonth = $("#cdfn-month"),
		fnDay = $("#cdfn-day"),
		fnHour = $("#cdfn-hour"),
		fnMinute = $("#cdfn-minute"),
		fnSecond = $("#cdfn-second"),
        fnArr = [fnYear, fnMonth, fnDay, fnHour, fnMinute, fnSecond];
        fnArrValues = [fnYear.val(), fnMonth.val(), fnDay.val(), fnHour.val(), fnMinute.val(), fnSecond.val()];
    for (i=0;i<fnArr.length;i++)
        if (isNaN(fnArr[i].val()) && !isNull(fnArr[i].val()))
            fnArr[i].val("0");
    if (isNull(fnArrValues)) {
        alert("The values are invalid.");
        return null;
    }
	else {
		var mLength = Cdown.monthLengths[parseInt(unixToString(Cdown.rightNow)[2])];
		var out = 0;
		out += fnSecond.val()*1000;
		out += fnMinute.val()*1000*60;
		out += fnHour.val()*1000*60*60;
		out += fnDay.val()*1000*60*60*24;
		out += fnMonth.val()*1000*60*60*24*mLength;
		out += fnYear.val()*1000*60*60*24*mLength*12;
		out += Cdown.rightNow.getTime();
		Cdown.name = $("#cdfn-name").val();
		eraseCookie("cDown")
		createCookie("cDown", out+","+Cdown.name+",0", 365);
	}
}
Cdown.upCheck = function () {
    Cdown.name = $("#cup-name").val();
    eraseCookie("cDown");
    var out = Cdown.rightNow.getTime().toString();
    createCookie("cDown", out+","+Cdown.name+",1", 365);
}
$(function () {
	var cdInputs = $("#cdown-full input");
	timerSet("cdInputs",100,function () {
		for (i=1;i<cdInputs.length;i++) {
			if (isNaN($(cdInputs[i]).val())) {
                if (i != 7 && i != 14)
                    cdInputs[i].className = "inactive";
			}
			else {
				cdInputs[i].className = "";
				$(cdInputs[i]).off();
			}
		}
		$(".inactive").click(function () {
			$(this).val("");
		});
		$("#cdsetname").click(function () {
			$("#cdsetname").off();
			$("#cdsetname").attr("class","");
			gebi("cdsetname").attributes[3] = undefined;
		});
        $("#cdfn-name").click(function () {
			$("#cdfn-name").off();
			$("#cdfn-name").attr("class","");
			gebi("cdfn-name").attributes[4] = undefined;
		});
		$(".cdset").keydown(function (event) {
			if (event.which == 13)
				Cdown.check(true);
		});
		$(".cd-fn-set").keydown(function (event) {
			if (event.which == 13) {
				Cdown.checkfn();
				Cdown.check(false);
			}
		});
	});
    $("#cd-share").click(function (event) {
        var link = "http://"+location.host+"/proto/cdown?t="+Cdown.timestamp+"&m="+Cdown.mode;
        if (!isNull(Cdown.name))
            link += "&n="+encodeURI(Cdown.name);
        $("#cdtext-share").slideToggle();
        $("#cdtext-share p.main").html("Copy the URL: <a href='"+link+"'>"+link+"</a>");
    });
    queryManager();
    Cdown.check(false);
    $("button.toggle").click(function () {
        if (this.className.search("toggle-on")!=-1)
            this.className = this.className.replace("toggle-on","");
        else
            this.className+=" toggle-on";
    });
});
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