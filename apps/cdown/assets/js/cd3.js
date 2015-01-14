// A utility class that provides an interface for executing date and time related functions.
var CD3 = {
    // damn you Augustus
    // we had a system
    // days in each of the months of the year (for offseting)
    months: [31,28,31,30,31,30,31,31,30,31,30,31],
    // long, proper terms for the months of the year
    monthNames: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    // short terms for the months of the year
    monthShort: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    // long, proper terms for the weekdays
    dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
    // short terms for the weekdays
    dayShort: ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    // the offsets that define when to carry over to the next value
    offset: [9001,12,0,24,60,60], // it's over NINE-THOUSAND!!!! - also by 9001AD me and this program would be long dead
    // human-readable terms for the six values to be appended accordingly
    terms: ["year","month","day","hour","minute","second"],
    LONG_CDOWN: "[0]({y} {yyy})[1]({M} {MMM})[2]({d} {ddd})[3]({h} {hhh})[4]({m} {mmm})[5]({s} {sss})",
    SHORT_CDOWN: "[2]({D} {ddd})[3]({hh}:)[4]({mm}:)[5]({ss})"
};
// Calculates the difference between two dates (given as UNIX timestamps).
CD3.difference = function (before, after, format) {
    if (before > after || isNull(before) || isNull(after)) return null; // my work here is done
    var bTime = CD3.dateToArray(new Date(before)),
        aTime = CD3.dateToArray(new Date(after)),
        diff = new Array(6),
        active = null,
        finalCountdown = "";
    if (bTime[0] % 4 == 0) CD3.months[1] = 29; // yay for leap years
    CD3.offset[2] = CD3.months[(aTime[1]+(CD3.months.length-1))%CD3.months.length];
    for (var i=5;i>=0;i--) { // where the magic happens
        if (aTime[i] - bTime[i] < 0) { // if it turns out that the before value is larger
            aTime[i-1]--; // take away from the next (to the left) value
            diff[i] = CD3.offset[i] - Math.abs(aTime[i] - bTime[i]); // and the diff uses the offset to calculate the value
        } else diff[i] = aTime[i] - bTime[i]; // otherwise it's as simple as pie (not pi, although it's not complex) {MATH JOKE}
    }
    return CD3.formatDiff(diff, format);
}
// Takes a difference array (6 length) and formats the string as specified by formatstr.
CD3.formatDiff = function (diff, formatstr) {
    // an example could be "[2]({D} {ddd})[3]({hh}:)[4]({mm}:)[5]({ss})"
    // or "[0]({y} {yyy})[1]({m} {mmm})[2]({d} {ddd})[3]({H} {HHH})[4]({M} {MMM})[5]({S} {SSS})"
    var formats = {
        "y": diff[0],
        "yy": zeroPrefix(diff[0]),
        "yyy": CD3.terms[0] + (diff[0] == 1 ? " " : "s "),
        "M": diff[1],
        "MM": zeroPrefix(diff[1]),
        "MMM": CD3.terms[1] + (diff[1] == 1 ? " " : "s "),
        "d": diff[2],
        "dd": zeroPrefix(diff[2]),
        "ddd": CD3.terms[2] + (diff[2] == 1 ? " " : "s "),
        "D": parseInt(diff[2]) + (diff[1]*CD3.offset[2]) + (diff[0]*(365+(CD3.months[1]==29?1:0))),
        "DD": zeroPrefix(parseInt(diff[2]) + (diff[1]*CD3.offset[2]) + (diff[0]*(365+(CD3.months[1]==29?1:0)))),
        "h": diff[3],
        "hh": zeroPrefix(diff[3]),
        "hhh": CD3.terms[3] + (diff[3] == 1 ? " " : "s "),
        "m": diff[4],
        "mm": zeroPrefix(diff[4]),
        "mmm": CD3.terms[4] + (diff[4] == 1 ? " " : "s "),
        "s": diff[5],
        "ss": zeroPrefix(diff[5]),
        "sss": CD3.terms[5] + (diff[5] == 1 ? " " : "s "),
        "{": "{",
        "}": "}"
    }, active = null;
    for (var format in formats) if (formats.hasOwnProperty(format))
        while (formatstr.search("{"+format+"}") != -1) formatstr = formatstr.replace("{"+format+"}", formats[format]);
    for (var i=0;i<diff.length;i++) if (diff[i] > 0 && isNull(active)) active = i; // finding the significant value(s)
    if (isNull(active)) return null; // another check for bailing out now
    for (var i=0;i<active;i++) formatstr = formatstr.replace(new RegExp("\\["+i+"\\]\\([^\\)]{1,}\\)"), ""); // removing irrelevancy
    // gets rid of the designations
    while (formatstr.search(/(\[[0-9]\]\([^\)]{1,}\)|\))/) != -1) formatstr = formatstr.replace(/(\)?\[[0-9]\]\(|\))/, "");
    // returns the string either as is, or if it has a space at the end instead of a character, return without the trailing space
    return formatstr.trim();
}
// Does what it advertises.
CD3.dateToArray = function (time) {
    return [time.getFullYear(),
            time.getMonth(),
            time.getDate(),
            time.getHours(),
            time.getMinutes(),
            time.getSeconds()
    ];
}
// Also does what it advertises.
CD3.arrayToDate = function (year, month, date, hour, minute, second) {
    var time = new Date();
    time.setFullYear(year);
    time.setMonth(month);
    time.setDate(date);
    time.setHours(hour);
    time.setMinutes(minute);
    time.setSeconds(second);
    return time;
}
// Returns an ordinal suffix of a number (3 -> rd, 12 -> th, 181 -> st)
CD3.getNth = function (num) {
    if (Math.floor(num % 100 / 10) == 1) return "th";
    else if (num % 10 == 1) return "st";
    else if (num % 10 == 2) return "nd";
    else if (num % 10 == 3) return "rd";
    else return "th";
}
// Takes a date object and returns a formatted string referring to that object as specified in formatstr.
CD3.format = function (time, formatstr) {
    // formatstr has zero or more of the following letter sequences
    // surrounded by block (curly) brackets in addition to other
    // characters to specify the format of the moment in question.
    // e.g. "{yyyy}-{MM}-{DD} {HH}:{mm}:{ss}" would deliver an ISO
    // formatted date and time.
    var formats = {
        "dddd": CD3.dayNames[time.getDay()], // long day (Sunday)
        "ddd": CD3.dayShort[time.getDay()], // short day (Sun)
        "dd": zeroPrefix(time.getDate()) + CD3.getNth(time.getDate()), // prefixed dateth (01st)
        "d": time.getDate() + CD3.getNth(time.getDate()), // dateth (1st)
        "DD": zeroPrefix(time.getDate()), // prefixed date (02)
        "D": time.getDate(), // date (2)
        "MMMM": CD3.monthNames[time.getMonth()], // long month (March)
        "MMM": CD3.monthShort[time.getMonth()], // short month (Mar)
        "MM": zeroPrefix(time.getMonth()+1), // prefixed month (03)
        "M": time.getMonth()+1, // month (3)
        "yyyy": time.getFullYear(), // long year (2004)
        "yy": time.getFullYear().toString().substring(2,4), // short year (04)
        "HH": zeroPrefix(time.getHours()), // prefixed hours (04)
        "H": time.getHours(), // hours (4)
        "hh": (time.getHours() % 12 == 0 ? "12" : zeroPrefix(time.getHours() % 12)), // prefixed 12-hour (05) from (17)
        "h": (time.getHours() % 12 == 0 ? "12" : time.getHours() % 12), // 12-hour (5) from (17)
        "mm": zeroPrefix(time.getMinutes()), // prefixed minutes (06)
        "m": time.getMinutes(), // minutes (6)
        "ss": zeroPrefix(time.getSeconds()), // prefixed seconds (07)
        "s": time.getSeconds(), // seconds (7)
        "tt": (time.getHours()<12?"AM":"PM"), // AM/PM (PM)
        "{": "{",
        "}": "}"
        // 2004-03-02 04:06:07 given as 24-hour example
        // and 17:06:07 (05:06:07 PM) given as 12-hour example
    }
    for (var format in formats) if (formats.hasOwnProperty(format))
        while (formatstr.search("{"+format+"}") != -1) formatstr = formatstr.replace("{"+format+"}", formats[format]);
    return formatstr;
}
// Validates the six values of a countdown.
CD3.validate = function (year, month, date, hour, minute, second) {
    try {
        if (isNull(year) || isNull(month) || isNull(date) || isNull(hour) || isNull(minute) || isNull(second))
            throw new TypeError("Null values are not allowed.");
        if (isNaN(year) || isNaN(month) || isNaN(date) || isNaN(hour) || isNaN(minute) || isNaN(second))
            throw new TypeError("Non-numerical values are not allowed.");
        else if (year < -9001 || month < 0 || date < 1 || hour < 0 || minute < 0 || second < 0)
            throw new RangeError("Values provided are negative.");
        else if (year >= CD3.offset[0] || month >= CD3.offset[1] || date > CD3.months[month] ||
                hour >= CD3.offset[3] || minute >= CD3.offset[4] || second >= CD3.offset[5])
            throw new RangeError("Values provided are out of range.");
    } catch (e) { TBI.error(e); return null }
    finally { return [year,month,date,hour,minute,second] }
}
function CountDown(title, time, mode) {
    this.title = title;
    this.time = time;
    this.mode = mode == null ? false : mode;
}
// The object that runs the UI, timers and persistency.
var CDown = {
    now: new Date(),
    active: null,
    fromNow: false,
    mode: false,
    title: "",
    shorten: false,
    lastUpdate: null,
    list: []
};
// Submits the values in the "form" (I hate forms, btw)
CDown.submit = function () {
    var title = $(".cds-title").val();
    if (isNull(title)) {
        if (!confirm("A title is not required but recommended. Continue anyway?")) return false;
        else title = CDown.findNewTitle();
    }
    var temp = new Date();
    if (!CDown.fromNow) {
        var dte = $(".cds-date").val().split("-");
        var valid = CD3.validate(
            dte[0],
            dte[1] - 1,
            dte[2],
            $(".cds-hour").val(),
            $(".cds-minute").val(),
            $(".cds-second").val()
        );
        if (!isNull(valid)) {
            temp = CD3.arrayToDate.apply(null, valid);
            temp.setMinutes(temp.getMinutes() + ((-CD3.now.getTimezoneOffset()) - $(".cds-zone").val()*60) + (TBI.isToggled($(".cds-dst")[0])?60:0));
        } else return false;
    } else if (!CDown.mode) {
        temp = CD3.arrayToDate(
            temp.getFullYear() + parseInt($(".cdsfn-year").val() || 0),
            temp.getMonth() + parseInt($(".cdsfn-month").val() || 0),
            temp.getDate() + parseInt($(".cdsfn-day").val() || 0),
            temp.getHours() + parseInt($(".cdsfn-hour").val() || 0),
            temp.getMinutes() + parseInt($(".cdsfn-minute").val() || 0),
            temp.getSeconds() + parseInt($(".cdsfn-second").val() || 0)
        );
    } else {
        temp = CD3.arrayToDate(
            temp.getFullYear() - parseInt($(".cdsfn-year").val() || 0),
            temp.getMonth() - parseInt($(".cdsfn-month").val() || 0),
            temp.getDate() - parseInt($(".cdsfn-day").val() || 0),
            temp.getHours() - parseInt($(".cdsfn-hour").val() || 0),
            temp.getMinutes() - parseInt($(".cdsfn-minute").val() || 0),
            temp.getSeconds() - parseInt($(".cdsfn-second").val() || 0)
        );
    }
    CDown.new(title, temp.getTime(), TBI.isToggled($(".cdh-timer")[0]));
}
CDown.searchByTitle = function (title) {
    for (var i=0;i<CDown.list.length;i++)
        if (CDown.list[i].title == title) return i;
    return -1;
}
CDown.findNewTitle = function () {
    var n = 1;
    while (CDown.searchByTitle("Untitled "+n) != -1) n++;
    return "Untitled "+n;
}
CDown.findEarliest = function () {
    for (var i=0,m=Infinity,a=0;i<CDown.list.length;i++) {
        var curr = CDown.list[i].time;
        if (curr > new Date().getTime() && curr < m) { m = curr; a = i; }
    }
    if (!isFinite(m)) return -1;
    else return a;
}
CDown.new = function (title, time, mode) {
    var cdown = new CountDown(title, time, mode);
    if (CDown.searchByTitle(cdown.title) != -1) {
        alert("There is already a countdown with the same name. Choose a different name.");
        return null;
    }
    if (CDown.set(cdown)) {
        CDown.list.push(cdown);
        CDown.setCookie();
        $(".cdm-select").append("<option value="+encodeURI(cdown.title)+">"+cdown.title+"</option>");
        $(".cdm-select").val(encodeURI(cdown.title));
        if (gecn("cdown")[0].className.search(" mul") == -1 && CDown.list.length > 1) CDown.change("mul");
        CDown.change("out");
    }
}
CDown.setCookie = function () {
    if (CDown.list.length < 1) return eraseCookie("CDown");
    var cookie = "";
    for (var i=0;i<CDown.list.length;i++) {
        var curr = CDown.list[i];
        cookie += curr.time;
        if (!isNull(curr.title)) cookie += " "+encodeURI(curr.title);
        if (curr.mode) cookie += " "+curr.mode.toString();
        cookie += "|";
    }
    if (cookie.endsWith("|")) cookie = cookie.substring(0, cookie.length-1);
    createCookie("CDown", cookie);
}
CDown.generateURL = function () {
    var url = location.origin + location.pathname,
        pairs = {};
    for (var i=0;i<CDown.list.length;i++) {
        var curr = CDown.list[i],
            j = i == 0 ? "" : i;
        pairs["t"+j] = curr.time;
        pairs["n"+j] = curr.title;
        if (curr.mode != false) pairs["m"+j] = curr.mode;
    }
    var firstVal = true;
    for (var key in pairs) if (pairs.hasOwnProperty(key)) {
        url += (firstVal ? "?" : "&");
        url += encodeURI(key.toString());
        url += "=";
        url += encodeURI(pairs[key].toString());
        firstVal = false;
    }
    return url;
}
CDown.generateTitle = function () {
    if (gecn("cdown")[0].className.search(" out") != -1) {
        var str = "";
        str += "Count" + (CDown.mode ? "Up" : "Down");
        if (!isNull(CDown.title)) str += " - " + CDown.title;
        return str;
    } else return "Set CountDown";
}
CDown.set = function (cdown) {
    CDown.title = cdown.title;
    CDown.active = cdown.time;
    CDown.mode = cdown.mode;
    TBI.timerClear("CDown");
    if (CDown.update()) {
        $(".cdm-select").val(encodeURI(CDown.title));
        TBI.timerSet("CDown", 1000, CDown.update);
        $(".cdh-title").html(CDown.generateTitle());
        $(".cdh-url").html(CDown.generateURL());
        $(".cdh-dest time").attr("datetime", new Date(CDown.active).toISOString());
        $(".cdh-dest time").attr("title", $(".cdh-dest time").attr("datetime"));
        $(".cdh-dest time").html(CD3.format(new Date(CDown.active), "{dddd} the {d} of {MMMM}, {yyyy} at {HH}:{mm}:{ss}"));
        return true;
    } else return false;
}
CDown.change = function (mode) {
    var out = gecn("cdown")[0].className.search(" out") != -1;
    if (mode == "out" || mode == "set") {
        if (mode == "out" && !out) gecn("cdown")[0].className = gecn("cdown")[0].className.replace(" set", " out");
        else if (mode == "set" && out) gecn("cdown")[0].className = gecn("cdown")[0].className.replace(" out", " set");
        if ((mode == "set") == out) for (var i=0;i<$(".cds[for]").length;i++) {
            var el = $(".cds[for]")[i];
            if (TBI.isToggled(el)) $($(el).attr("for")).slideDown();
            else $($(el).attr("for")).hide();
        }
        $(".cdh-title").html(CDown.generateTitle());
    } else if (mode == "mul") {
        var cn = gecn("cdown")[0].className;
        if (cn.search(" mul") == -1)
            gecn("cdown")[0].className = cn += " mul";
    } else if (mode == "mul-off") {
        var cn = gecn("cdown")[0].className;
        if (cn.search(" mul") != -1)
            gecn("cdown")[0].className = cn.replace(" mul", "");
    }
}
CDown.remove = function () {
    if (!isNull(CDown.active)) {
        new Note("/assets/res/icons/time48.png", isNull(CDown.title)?"CountDown":CDown.title, "CountDown completed.");
        $(".cdown-notify")[0].play();
    }
    TBI.timerClear("CDown");
    CDown.active = null;
    CDown.list.splice(CDown.searchByTitle(CDown.title), 1);
    $(".cdm-select option[value=\""+encodeURI(CDown.title)+"\"]").remove();
    $(".cdh-title").html("Set CountDown");
    $(".cdown").toggleClass("simple", false);
    CDown.setCookie();
    if (CDown.lastUpdate != "set") CDown.change("set");
    CDown.lastUpdate = "set";
    CDown.change("mul-off");
    document.title = "CountDown";
    var earliest = CDown.findEarliest();
    if (earliest != -1)
        CDown.set(CDown.list[earliest]);
}
CDown.update = function () {
    var diff = null;
    if (CDown.mode) diff = CD3.difference(CDown.active, new Date().getTime(), CDown.shorten?CD3.SHORT_CDOWN:CD3.LONG_CDOWN)
    else diff = CD3.difference(new Date().getTime(), CDown.active, CDown.shorten?CD3.SHORT_CDOWN:CD3.LONG_CDOWN);
    if (isNull(diff)) CDown.remove();
    else {
        if (CDown.lastUpdate != "out") CDown.change("out");
        $(".cdo-active").html(diff);
        document.title =
            (CDown.mode?CD3.difference(CDown.active, new Date().getTime(), CD3.SHORT_CDOWN):
            CD3.difference(new Date().getTime(), CDown.active, CD3.SHORT_CDOWN))+" - "+
            (isNull(CDown.title)?"CDown":CDown.title);
        CDown.lastUpdate = "out";
    }
    return !isNull(diff);
}
CDown.run = function (success, failure) {
    TBI.timerClear("CDown");
    if (CDown.update()) {
        TBI.timerSet("CDown", 1000, CDown.update);
        if (success) success();
    } else if (failure) failure();
}
CDown.load = function () {
    for (var i=0;!isNull(query["t"+(i==0?"":i)]);i++) {
        var j = i == 0 ? "" : i;
        CDown.new(
            !isNull(query["n"+j]) ? decodeURI(query["n"+j]) : CDown.findNewTitle(),
            parseInt(query["t"+j]),
            isNull(query["m"+j]) ? false : query["m"+j] != "false"
        );
    }
    var cookie = readCookie("CDown"),
        cookieUsed = false;
    if (!isNull(cookie)) {
        cookie = cookie.split("|");
        for (var i=0;i<cookie.length;i++) {
            var curr = cookie[i];
            curr = curr.split(" ");
            var title = !isNull(curr[1]) ? decodeURI(curr[1]) : CDown.findNewTitle();
            if (CDown.searchByTitle(title) == -1) CDown.new(
                title,
                parseInt(curr[0]),
                isNull(curr[2]) ? false : curr[2] != "false"
            );
            cookieUsed = true;
        }
    }
    var earliest = CDown.findEarliest();
    if (earliest != -1)
        CDown.set(CDown.list[earliest]);
    CDown.run(null, cookieUsed ? function () { eraseCookie("CDown"); } : function () {});
}
CDown.setup = function (mode) {
    mode = mode || false;
    CD3.now = new Date();
    var overflowfunc = function (el, sign) {
        var vals = ["cds-hour", "cds-minute", "cds-second"],
            d = new Date($(".cds-date").val()),
            ind = -1;
        for (var i=0;i<vals.length;i++)
            if (el.className.search(vals[i]) != -1) { ind = i; break; }
        if (ind == 0) {
            d.setDate(d.getDate()+sign);
            $(".cds-date").pickadate("picker").set("select", d);
            $(".cds-date").val(CD3.format(d, "{yyyy}-{MM}-{DD}"));
        } else if (ind != -1) {
            var c = $("."+vals[ind-1]);
            c.spinner(sign == 1 ? "stepUp" : "stepDown");
            $("."+vals[ind-1]).spinner().trigger("spin");
        }
    }, spinfunc = function (e,u) {
        var n = $(this).spinner("option", "min")*1 + 1,
            x = $(this).spinner("option", "max") - 1,
            v = u.value;
        if (v > x) { v = n; overflowfunc(this, 1); }
        else if (v < n) { v = x; overflowfunc(this, -1); }
        u.value = zeroPrefix(v);
        $(this).val(u.value);
        return false;
    };
    $(".cds-zone").val(-CD3.now.getTimezoneOffset()/60);
    $(".cds-date").attr("data-value",CD3.now.getFullYear()+"-"+zeroPrefix(CD3.now.getMonth()+1)+"-"+zeroPrefix(CD3.now.getDate()));
    $(".cds-date").pickadate({format:'yyyy-mm-dd',clear:false});
    $(".cds-date").pickadate().pickadate("picker").set("select", CD3.now);
    $(".cds-date").pickadate().pickadate("picker").set("min",!mode);
    $(".cds-date").pickadate().pickadate("picker").set("max",mode);
    $(".cds-hour").spinner({min:-1,max:24,spin:spinfunc});
    $(".cds-hour").val(zeroPrefix(CD3.now.getHours()));
    $(".cds-minute").spinner({min:-1,max:60,spin:spinfunc});
    $(".cds-minute").val(zeroPrefix(CD3.now.getMinutes()));
    $(".cds-second").spinner({min:-1,max:60,spin:spinfunc});
    $(".cds-second").val(zeroPrefix(CD3.now.getSeconds()));
}
CDown.reset = function () {
    if (!isNull(CDown.active)) {
        CDown.remove(CDown.title);
        CDown.setup();
        CDown.update();
    }
    if (!isNull(query.t)) location.search = "";
}
$(document).on("pageload", function () {
    CDown.setup();
    CDown.load();
    $(".cdh-mode").click(function () {
        CDown.fromNow = TBI.isToggled(this);
        if (CDown.fromNow) {
            $(".cds-defined").hide();
            $(".cds-fromnow").show();
        } else {
            $(".cds-defined").show();
            $(".cds-fromnow").hide();
        }
    });
    $(".cdh-reset").click(function () { CDown.reset(); });
    $(".cdh-tonow").click(function () { CDown.setup(false); });
    $(".cdh-submit").click(function () { CDown.submit(); });
    $(".cdh-timer").click(function () { CDown.setup(TBI.isToggled(this)); });
    $(".cdh-setnew").click(function () { CDown.change("set"); });
    $(".cdh-view").click(function () { CDown.change("out"); });
    $(".cdh-geturl").click(function () { $(".cdh-url").html(CDown.generateURL()); });
    $(".cdm-recent").click(function () {
        var earliest = CDown.findEarliest();
        if (earliest != -1)
            CDown.set(CDown.list[earliest]);
    });
    $(".cdh-simple").click(function () { $(".cdown").toggleClass("simple", TBI.isToggled(this)); });
    $(".cdh-help").click(function () {
        if (TBI.isToggled(this)) $(".cdown .help").show();
        else $(".cdown .help").hide();
    })
    $(".cdm-select").change(function () {
        var result = CDown.searchByTitle(decodeURI($(".cdm-select").val()));
        if (result != -1) { CDown.set(CDown.list[result]); CDown.change("out"); }
        else alert("The specified countdown was not found.");
    });
    TBI.Popup.registry.add($(".cds-zone-help")[0], "Time Zone",
        "Select the time zone that your input will be in. It's already setup to be your own timezone. \
        This is useful if you are given a countdown from another country and still want to track it accurately.");
    TBI.Popup.registry.add($(".cdh-mode-help")[0], "Mode Toggle",
        "This toggles between 'Offset Mode' and 'Absolute Mode'. In Absolute Mode, you select the exact \
        time and date to count down to (e.g. 25th December, 2:00PM; midnight 1st January 2020). In Offset Mode, you select \
        how long from now you wish to count down. (e.g. 5 minutes from now; 2 hours from now; 7 days and 8 hours from now)");
    TBI.Popup.registry.add($(".cdh-tonow-help")[0], "Reset To Now",
        "This resets the fields in Absolute Mode to be set to right now, so you can get your bearings back.");
    TBI.Popup.registry.add($(".cdh-timer-help")[0], "Timer Mode",
        "Instead of setting a count down, you can set a timer to count <em>up</em> from either a specific time in the past \
        or right now.");
    TBI.Popup.registry.add($(".cds-title-help")[0], "Title",
        "This is what your count down is going to be called. Give it a unique name, as no two can share the same.");
    TBI.Popup.registry.add($(".cds-date-help")[0], "Date",
        "Select the date you wish to count down to. Simply click on the date and a date picker will appear. Use it to select \
        the date that you want by navigating with the mouse. Clicking on a date will close the picker and submit your selection.");
    TBI.Popup.registry.add($(".cds-time-help")[0], "Time",
        "This is the time that you are going to count down to, along with the date. It is in 24 hour format. \
        You may use the spinners to quickly modify the hour, minute and second values.");
});
