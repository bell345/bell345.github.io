var CD3 = {
    months: [31,28,31,30,31,30,31,31,30,31,30,31],
    offset: [9001,12,0,24,60,60],
    terms: ["year","month","day","hour","minute","second"]
};
CD3.difference = function (before, after, shorten) {
    if (before > after || isNull(before) || isNull(after)) return null;
    var bTime = CD3.dateToArray(new Date(before)),
        aTime = CD3.dateToArray(new Date(after)),
        diff = new Array(6),
        active = null,
        finalCountdown = "";
    if (bTime[0] % 4 == 0) CD3.months[1] = 29;
    CD3.offset[2] = CD3.months[aTime[1]-1];
    for (var i=5;i>=0;i--) {
        if (aTime[i] - bTime[i] < 0) {
            aTime[i-1]--;
            diff[i] = zeroPrefix(CD3.offset[i] - Math.abs(aTime[i] - bTime[i]));
        } else diff[i] = zeroPrefix(aTime[i] - bTime[i]);
    }
    for (var i=0;i<diff.length;i++) if (diff[i] > 0 && isNull(active)) active = i;
    if (isNull(active)) return null;
    if (!shorten) {
        for (var i=0;i<diff.length;i++) 
            if (active <= i) finalCountdown += diff[i] + " " + CD3.terms[i] + (diff[i] == 1 ? " " : "s ");
    } else {
        if (active <= 2) finalCountdown += parseInt(diff[2])+(diff[1]*CD3.offset[1])+(diff[0]*CD3.offset[0])+" day"+(diff[2] == 1 ? " " : "s ");
        if (active <= 3) finalCountdown += diff[3] + ":";
        if (active <= 4) finalCountdown += diff[4] + ":";
        if (active <= 5) finalCountdown += diff[5];
    }
    return finalCountdown;
}
CD3.dateToArray = function (time) {
    return [time.getFullYear(), time.getMonth(), time.getDate(), time.getHours(), time.getMinutes(), time.getSeconds()];
}
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
CD3.validate = function (year, month, date, hour, minute, second) {
    try {
        if (isNull(year) || isNull(month) || isNull(date) || isNull(hour) || isNull(minute) || isNull(second))
            throw new TypeError("Null values are not allowed.");
        if (isNaN(year) || isNaN(month) || isNaN(date) || isNaN(hour) || isNaN(minute) || isNaN(second))
            throw new TypeError("Non-numerical values are not allowed.");
        else if (year < -9001 || month < 0 || date < 1 || hour < 0 || minute < 0 || second < 0)
            throw new RangeError("Values provided are negative.");
        else if (year >= CD3.offset[0] || month >= CD3.offset[1] || date >= CD3.months[month] ||
                hour >= CD3.offset[3] || minute >= CD3.offset[4] || second >= CD3.offset[5])
            throw new RangeError("Values provided are out of range.");
    } catch (e) { TBI.error(e); return null }
    finally { return [year,month,date,hour,minute,second] }
}
var CDown = {
    now: new Date(),
    active: null,
    fromNow: false,
    title: "",
    shorten: false
};
CDown.submit = function () {
    CDown.title = $(".cds-title").val();
    if (isNull(CDown.title) && !confirm("You do not have a title for your countdown yet. Continue?")) return false; 
    if (!CDown.fromNow) {
        var dte = $(".cds-date").val().split("-");
        var valid = CD3.validate(dte[0],dte[1]-1,dte[2],$(".cds-hour").val(),$(".cds-minute").val(),$(".cds-second").val());
        if (!isNull(valid)) {
            var dte = CD3.arrayToDate.apply(null, valid);
            dte.setMinutes(dte.getMinutes() + ((-CD3.now.getTimezoneOffset()) - $(".cds-zone").val()*60) + (TBI.isToggled($(".cds-dst")[0])?60:0));
            CDown.active = dte.getTime();
            TBI.timerClear("CDown");
            if (CDown.update()) {
                TBI.timerSet("CDown", 1000, CDown.update);
                createCookie("CDown", CDown.active+(isNull(CDown.title)?"":","+CDown.title));
            }
        }
    } else {
        var temp = new Date();
        temp.setFullYear(temp.getFullYear() + parseInt(isNull($(".cdsfn-year").val()) ? 0 : $(".cdsfn-year").val()));
        temp.setMonth(temp.getMonth() + parseInt(isNull($(".cdsfn-month").val()) ? 0 : $(".cdsfn-month").val()));
        temp.setDate(temp.getDate() + parseInt(isNull($(".cdsfn-day").val()) ? 0 : $(".cdsfn-day").val()));
        temp.setHours(temp.getHours() + parseInt(isNull($(".cdsfn-hour").val()) ? 0 : $(".cdsfn-hour").val()));
        temp.setMinutes(temp.getMinutes() + parseInt(isNull($(".cdsfn-minute").val()) ? 0 : $(".cdsfn-minute").val()));
        temp.setSeconds(temp.getSeconds() + parseInt(isNull($(".cdsfn-second").val()) ? 0 : $(".cdsfn-second").val()));
        CDown.active = temp.getTime();
        TBI.timerClear("CDown");
        if (CDown.update()) { 
            TBI.timerSet("CDown", 1000, CDown.update);
            createCookie("CDown", CDown.active+(isNull(CDown.title)?"":","+CDown.title));
        }
    }
}
CDown.toggle = function (bool) {
    var out = gecn("cdown")[0].className.search(" out") != -1;
    if (bool && !out) gecn("cdown")[0].className = gecn("cdown")[0].className.replace(" set", " out");
    else if (!bool && out) gecn("cdown")[0].className = gecn("cdown")[0].className.replace(" out", " set");
}
CDown.update = function () {
    var diff = CD3.difference(new Date().getTime(), CDown.active, CDown.shorten);
    if (isNull(diff)) { 
        if (!isNull(CDown.active)) 
            new Note("/assets/res/icons/time48.png", isNull(CDown.title)?"CountDown":CDown.title, "CountDown completed.");
        TBI.timerClear("CDown"); 
        CDown.active = null;
        $(".cdh-title").html("Set CountDown");
        CDown.toggle(false); 
        return false; 
    } else { 
        CDown.toggle(true); 
        $(".cdo-active").html(diff); 
        $(".cdh-title").html("CountDown"+(isNull(CDown.title)?"":" - "+CDown.title));
        $(".cdh-url").html(location.origin + location.pathname + "?t=" + CDown.active + (isNull(CDown.title) ? "" : "&n=" + CDown.title));
        return true; 
    }
}
CDown.check = function () {
    var cookie = readCookie("CDown");
    if (!isNull(query.t)) {
        CDown.active = parseInt(query.t);
        if (!isNull(query.n)) CDown.title = decodeURI(query.n);
        TBI.timerClear("CDown");
        if (CDown.update()) TBI.timerSet("CDown", 1000, CDown.update);
    } else if (!isNull(cookie)) {
        cookie = cookie.split(",");
        CDown.active = parseInt(cookie[0]);
        if (!isNull(cookie[1])) CDown.title = cookie[1];
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
    $(".cds-date").pickadate({format:'yyyy-mm-dd',min:true,clear:false});
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
    $(".cdh-submit").click(CDown.submit);
});