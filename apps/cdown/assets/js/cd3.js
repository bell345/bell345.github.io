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
    LONG_CDOWN: "[0]({y} {yyy})[1]({m} {mmm})[2]({d} {ddd})[3]({H} {HHH})[4]({M} {MMM})[5]({S} {SSS})",
    SHORT_CDOWN: "[2]({D} {ddd})[3]({HH}:)[4]({MM}:)[5]({SS})"
};
// Calculates the difference between two dates (given as UNIX timestamps).
CD3.difference = function (before, after, isShort) {
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
    return isShort ? 
        CD3.formatDiff(diff, CD3.SHORT_CDOWN) : 
        CD3.formatDiff(diff, CD3.LONG_CDOWN);
}
// Takes a difference array (6 length) and formats the string as specified by formatstr.
CD3.formatDiff = function (diff, formatstr) {
    // an example could be "[2]({D} {ddd})[3]({hh}:)[4]({mm}:)[5]({ss})"
    // or "[0]({y} {yyy})[1]({m} {mmm})[2]({d} {ddd})[3]({H} {HHH})[4]({M} {MMM})[5]({S} {SSS})"
    var formats = {
        "y": diff[0],
        "yy": zeroPrefix(diff[0]),
        "yyy": CD3.terms[0] + (diff[0] == 1 ? " " : "s "),
        "m": diff[1],
        "mm": zeroPrefix(diff[1]),
        "mmm": CD3.terms[1] + (diff[1] == 1 ? " " : "s "),
        "d": diff[2],
        "dd": zeroPrefix(diff[2]),
        "ddd": CD3.terms[2] + (diff[2] == 1 ? " " : "s "),
        "D": parseInt(diff[2]) + (diff[1]*CD3.offset[2]) + (diff[0]*(365+(CD3.months[1]==29?1:0))),
        "DD": zeroPrefix(parseInt(diff[2]) + (diff[1]*CD3.offset[2]) + (diff[0]*(365+(CD3.months[1]==29?1:0)))),
        "H": diff[3],
        "HH": zeroPrefix(diff[3]),
        "HHH": CD3.terms[3] + (diff[3] == 1 ? " " : "s "),
        "M": diff[4],
        "MM": zeroPrefix(diff[4]),
        "MMM": CD3.terms[4] + (diff[4] == 1 ? " " : "s "),
        "S": diff[5],
        "SS": zeroPrefix(diff[5]),
        "SSS": CD3.terms[5] + (diff[5] == 1 ? " " : "s "),
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
    return formatstr.charAt(formatstr.length-1) == ' ' ? formatstr.substring(0, formatstr.length-1) : formatstr;
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
    time.setSeconds(second);
    time.setMinutes(minute);
    time.setHours(hour);
    time.setDate(date);
    time.setMonth(month);
    time.setFullYear(year);
    return time;
}
// Takes a date object and returns a formatted string referring to that object as specified in formatstr.
CD3.format = function (time, formatstr) {
    // formatstr has zero or more of the following letter sequences 
    // surrounded by block (curly) brackets in addition to other
    // characters to specify the format of the moment in question.
    // e.g. "{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}" would deliver an ISO
    // formatted date and time.
    var formats = {
        "dddd": CD3.dayNames[time.getDay()], // long day (Sunday)
        "ddd": CD3.dayShort[time.getDay()], // short day (Sun)
        "dd": zeroPrefix(time.getDate()) + (time.getDate()%10==1?"st":time.getDate()%10==2?"nd":time.getDate()%10==3?"rd":"th"), // prefixed dateth (01st)
        "d": time.getDate() + (time.getDate()%10==1?"st":time.getDate()%10==2?"nd":time.getDate()%10==3?"rd":"th"), // dateth (1st)
        "DD": zeroPrefix(time.getDate()), // prefixed date (02)
        "D": time.getDate(), // date (2)
        "mmmm": CD3.monthNames[time.getMonth()], // long month (March)
        "mmm": CD3.monthShort[time.getMonth()], // short month (Mar)
        "MM": zeroPrefix(time.getMonth()+1), // prefixed month (03)
        "M": time.getMonth()+1, // month (3)
        "YYYY": time.getFullYear(), // long year (2004)
        "YY": time.getYear(), // short year (04)
        "HH": zeroPrefix(time.getHours()), // prefixed hours (04)
        "H": time.getHours(), // hours (4)
        "hh": (time.getHours()==0||time.getHours()==12?"12":zeroPrefix(time.getHours()%12)), // prefixed 12-hour (05) from (17)
        "h": (time.getHours()==0||time.getHours()==12?"12":time.getHours()%12), // 12-hour (5) from (17)
        "mm": zeroPrefix(time.getMinutes()), // prefixed minutes (06)
        "m": time.getMinutes(), // minutes (6)
        "ss": zeroPrefix(time.getSeconds()), // prefixed seconds (07)
        "s": time.getSeconds(), // seconds (7)
        "P": (time.getHours()<12?"AM":"PM"), // AM/PM (PM)
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
// The object that runs the UI, timers and persistency.
var CDown = {
    now: new Date(),
    active: null,
    fromNow: false,
    mode: false,
    title: "",
    shorten: false
};
// Submits the values in the "form" (I hate forms, btw)
CDown.submit = function () {
    CDown.title = $(".cds-title").val();
    if (isNull(CDown.title) && !confirm("A title is not required but recommended. Continue anyway?")) return false; 
    var temp = new Date();
    if (!CDown.fromNow) {
        var dte = $(".cds-date").val().split("-");
        var valid = CD3.validate(dte[0],dte[1]-1,dte[2],$(".cds-hour").val(),$(".cds-minute").val(),$(".cds-second").val());
        if (!isNull(valid)) {
            temp = CD3.arrayToDate.apply(null, valid);
            temp.setMinutes(temp.getMinutes() + ((-CD3.now.getTimezoneOffset()) - $(".cds-zone").val()*60) + (TBI.isToggled($(".cds-dst")[0])?60:0));
        } else return false;
    } else if (!CDown.mode) { 
        temp = CD3.arrayToDate(
            temp.getFullYear() + parseInt(isNull($(".cdsfn-year").val()) ? 0 : $(".cdsfn-year").val()),
            temp.getMonth() + parseInt(isNull($(".cdsfn-month").val()) ? 0 : $(".cdsfn-month").val()),
            temp.getDate() + parseInt(isNull($(".cdsfn-day").val()) ? 0 : $(".cdsfn-day").val()),
            temp.getHours() + parseInt(isNull($(".cdsfn-hour").val()) ? 0 : $(".cdsfn-hour").val()),
            temp.getMinutes() + parseInt(isNull($(".cdsfn-minute").val()) ? 0 : $(".cdsfn-minute").val()),
            temp.getSeconds() + parseInt(isNull($(".cdsfn-second").val()) ? 0 : $(".cdsfn-second").val())
        );
    } else {
        temp = CD3.arrayToDate(
            temp.getFullYear() - parseInt(isNull($(".cdsfn-year").val()) ? 0 : $(".cdsfn-year").val()),
            temp.getMonth() - parseInt(isNull($(".cdsfn-month").val()) ? 0 : $(".cdsfn-month").val()),
            temp.getDate() - parseInt(isNull($(".cdsfn-day").val()) ? 0 : $(".cdsfn-day").val()),
            temp.getHours() - parseInt(isNull($(".cdsfn-hour").val()) ? 0 : $(".cdsfn-hour").val()),
            temp.getMinutes() - parseInt(isNull($(".cdsfn-minute").val()) ? 0 : $(".cdsfn-minute").val()),
            temp.getSeconds() - parseInt(isNull($(".cdsfn-second").val()) ? 0 : $(".cdsfn-second").val())
        );
    }
    CDown.active = temp.getTime();
    TBI.timerClear("CDown");
    if (CDown.update()) { 
        TBI.timerSet("CDown", 1000, CDown.update);
        createCookie("CDown", CDown.active+(isNull(CDown.title)?"":" "+encodeURI(CDown.title))+(CDown.mode?" "+CDown.mode.toString():""));
    }
}
CDown.toggle = function (bool) { 
    var out = gecn("cdown")[0].className.search(" out") != -1;
    if (bool && !out) {
        gecn("cdown")[0].className = gecn("cdown")[0].className.replace(" set", " out");
        $(".cds").slideUp();
        $(".cdo").slideDown();
        for (var i=0;i<$(".cdo[for]").length;i++) {
            var el = $(".cdo[for]")[i];
            if (TBI.isToggled(el)) $($(el).attr("for")).slideDown();
            else $($(el).attr("for")).hide();
        }
    } else if (!bool && out) {
        gecn("cdown")[0].className = gecn("cdown")[0].className.replace(" out", " set");
        $(".cds").slideDown();
        for (var i=0;i<$(".cds[for]").length;i++) {
            var el = $(".cds[for]")[i];
            if (TBI.isToggled(el)) $($(el).attr("for")).slideDown();
            else $($(el).attr("for")).hide();
        }
        $(".cdo").slideUp();
    }
}
CDown.update = function () {
    var diff = CDown.mode?CD3.difference(CDown.active, new Date().getTime(), CDown.shorten):
        CD3.difference(new Date().getTime(), CDown.active, CDown.shorten);
    if (isNull(diff)) { 
        if (!isNull(CDown.active)) {
            new Note("/assets/res/icons/time48.png", isNull(CDown.title)?"CountDown":CDown.title, "CountDown completed.");
            $(".cdown-notify")[0].play();
        }
        TBI.timerClear("CDown"); 
        CDown.active = null;
        $(".cdh-title").html("Set CountDown");
        eraseCookie("CDown");
        CDown.toggle(false);
        document.title = "CountDown";
        return false; 
    } else { 
        CDown.toggle(true); 
        $(".cdo-active").html(diff); 
        $(".cdh-title").html((CDown.mode?"CountUp":"CountDown")+(isNull(CDown.title)?"":" - "+CDown.title));
        $(".cdh-url").html(location.origin + location.pathname + "?t=" + CDown.active + (isNull(CDown.title) ? "" : "&n=" + CDown.title) + (CDown.mode?"&m=" + CDown.mode.toString():""));
        $(".cdh-dest time").attr("datetime", new Date(CDown.active).toISOString());
        $(".cdh-dest time").attr("title", $(".cdh-dest time").attr("datetime"));
        $(".cdh-dest time").html(CD3.format(new Date(CDown.active), "{dddd} the {d} of {mmmm}, {YYYY} at {HH}:{mm}:{ss}"));
        document.title = (isNull(CDown.title)?"CDown":CDown.title)+" - "+
            (CDown.mode?CD3.difference(CDown.active, new Date().getTime(), true):
            CD3.difference(new Date().getTime(), CDown.active, true));
        return true; 
    }
}
CDown.check = function () {
    var cookie = readCookie("CDown");
    if (!isNull(query.t)) {
        CDown.active = parseInt(query.t);
        if (!isNull(query.n)) CDown.title = decodeURI(query.n);
        CDown.mode = isNull(query.m) ? false : query.m != "false";
        TBI.timerClear("CDown");
        if (CDown.update()) TBI.timerSet("CDown", 1000, CDown.update);
    } else if (!isNull(cookie)) {
        cookie = cookie.split(" ");
        CDown.active = parseInt(cookie[0]);
        if (!isNull(cookie[1])) CDown.title = decodeURI(cookie[1]);
        CDown.mode = isNull(cookie[2]) ? false : cookie[2] != "false";
        TBI.timerClear("CDown");
        if (CDown.update()) TBI.timerSet("CDown", 1000, CDown.update);
        else eraseCookie("CDown");
    }
}
CDown.setup = function () {
    CD3.now = new Date();
    var spinfunc = function (e,u) {
        var n=$(this).spinner("option", "min")+1,x=$(this).spinner("option", "max")-1,v=u.value;
        v=v>x?n:v<n?x:v;$(this).val(zeroPrefix(v));return false;
    };
    $(".cds-zone").val(-CD3.now.getTimezoneOffset()/60);
    $(".cds-date").attr("data-value",CD3.now.getFullYear()+"-"+zeroPrefix(CD3.now.getMonth()+1)+"-"+zeroPrefix(CD3.now.getDate()));
    $(".cds-date").pickadate({format:'yyyy-mm-dd',clear:false});
    $(".cds-hour").spinner({min:-1,max:24,spin:spinfunc});
    $(".cds-hour").val(zeroPrefix(CD3.now.getHours()));
    $(".cds-minute").spinner({min:-1,max:60,spin:spinfunc});
    $(".cds-minute").val(zeroPrefix(CD3.now.getMinutes()));
    $(".cds-second").spinner({min:-1,max:60,spin:spinfunc});
    $(".cds-second").val(zeroPrefix(CD3.now.getSeconds()));
}
CDown.reset = function () {
    if (!isNull(query.t)) location.search = "";
    if (!isNull(CDown.active)) {
        CDown.active = null; 
        eraseCookie("CDown");
        CDown.setup();
        CDown.update(); 
    }
}
$(document).on("pageload", function () {
    CDown.setup();
    CDown.check();
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
    $(".cdh-format").click(function () { CDown.shorten = TBI.isToggled(this); });
    $(".cdh-reset").click(CDown.reset);
    $(".cdh-tonow").click(CDown.setup);
    $(".cdh-submit").click(CDown.submit);
    $(".cdh-timer").click(function () { CDown.mode = TBI.isToggled(this); CDown.setup(); });
});