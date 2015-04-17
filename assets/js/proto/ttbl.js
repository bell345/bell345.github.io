var TTBL = {};
TTBL.ttables = {};
TTBL.curr = "default";
TTBL.dayKeys = ["sun","mon","tue","wed","thu","fri","sat"];
TTBL.days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
TTBL.input = { "default" : { "variables" : { "days" : []}, "defs" : {}, "info" : {}, "table" : {}}};
TTBL.setup = function () {
    var valid = true;
    try {
        $.parseJSON(localStorage.TTBL2);
    } catch (e) {
        valid = !valid;
    }
    if (valid) {
        TTBL.ttables = $.parseJSON(localStorage.TTBL2);
        TTBL.periods = [];
        TTBL.breaks = [];
        TTBL.blocks = [];
        TTBL.cr = TTBL.ttables[TTBL.curr];
        TTBL.tb = TTBL.cr.table;
        TTBL.vr = TTBL.cr.variables;
        TTBL.df = TTBL.cr.defs;
        TTBL.info = TTBL.cr.info;
        TTBL.df.days = [];
        TTBL.df.dayKeys = [];
        for (var it = 0; it < TTBL.vr.days.length; it++) {
            TTBL.df.days.push(TTBL.days[TTBL.vr.days[it]]);
            TTBL.df.dayKeys.push(TTBL.dayKeys[TTBL.vr.days[it]]);
        }
        TTBL.vr.maxlength = 0;
        for (it = 0; it < TTBL.vr.length.length; it++)
            if (TTBL.vr.length[it] > parseInt(TTBL.vr.maxlength))
                TTBL.vr.maxlength = parseInt(TTBL.vr.length[it]);
        TTBL.fillIn();
        TTBL.generate();
        TTBL.set();
    }
}
TTBL.generate = function () {
    $(".ttb-body").empty();
    $(".ttb-body").append("<div class='ttable-head'></div>");
    $(".ttable-head").append("<span></span>");
    for (var it = 0; it < TTBL.df.days.length; it++)
        $(".ttable-head").append("<span>"+TTBL.df.days[it]+"</span>");
    var firstWidth = $(".ttable-head span")[0].style.width;
    $(".ttable-head span").css("width",100/TTBL.df.days.length-(100/TTBL.df.days.length/20)+"%");
    $(".ttable-head span:first-child").css("width",firstWidth);
    for (it = 0; it < TTBL.vr.maxlength; it++) {
        if (TTBL.blocks[0][it].type == "period") {
            $(".ttb-body").append("<div class='ttable-row'></div>");
            $(".ttb-body > div:nth("+(it+1)+")").append("<div></div>");
            for (var jt = 0; jt < TTBL.df.days.length; jt++) {
                var divtext = "<div class='ttable-cell ttb-"+TTBL.df.dayKeys[jt]+"'></div>";
                $(".ttb-body > div:nth("+(it+1)+")").append(divtext);
                var cellh = "<div class='ttable-cellh'>header</div>";
                $(".ttb-body > div:nth("+(it+1)+") > .ttable-cell:nth("+jt+")").append(cellh);
                var celli = "";
                for (var kt = 1; kt < TTBL.vr.display.period.length; kt++) {
                    celli += "<div class='ttable-celli'>info</div>";
                }
                $(".ttb-body > div:nth("+(it+1)+") > .ttable-cell:nth("+jt+")").append(celli);
            }
        } else if (TTBL.blocks[0][it].type == "break")
            $(".ttb-body").append("<div class='ttable-break'></div>");
    }
    if (TTBL.vr.length.length > 0) {
        for (it = 0; it < TTBL.vr.length.length; it++) {
            $(".ttable-row:nth("+it+") > div:first-child").text(it+1);
        }
        var it = 0;
        var jt = 0;
        while (it < TTBL.vr.length[0]) {
            if (TTBL.blocks[0][it].type != "break") {
                $(".ttable-row:nth("+jt+") > div:first-child").text(jt+1);
                jt++;
            } it++;
        }
    }
    $(".ttb-body .ttable-cell").css("width",100/TTBL.df.days.length-(100/TTBL.df.days.length/20)+"%");
}
TTBL.addTime = function (timeString, minCount) {
    minCount = parseInt(minCount);
    var time = timeString.split(".");
    time[0] = parseInt(time[0]);
    time[1] = parseInt(time[1]);
    while (time[1] + minCount >= 60) {
        if (time[0]+1 < 24)
            time[0]++;
        else
            time[0] = 0;
        minCount -= 60;
    }
    time[1] += minCount;
    if (time[0] < 10) { time[0] = "0"+time[0]; }
    if (time[1] < 10) { time[1] = "0"+time[1]; }
    return time[0].toString()+"."+time[1].toString();
}
TTBL.fillIn = function () {
    for (var it = 0; it < TTBL.tb.length; it++) {
        var thisDay = TTBL.tb[it];
        var periods = [];
        var blocks = [];
        for (var jt = 0; jt < thisDay.length; jt++) {
            if (isNull(thisDay[jt].start))
                if (!isNull(thisDay[jt-1].end))
                    thisDay[jt].start = thisDay[jt-1].end;
            if (isNull(thisDay[jt].end))
                if (!isNull(thisDay[jt].start))
                    thisDay[jt].end = TTBL.addTime(thisDay[jt].start, TTBL.vr.periodLength);
            if (!isNull(thisDay[jt].group)) {
                var info = TTBL.vr.display.group;
                var group = thisDay[jt].group;
                for (var kt = 0; kt < info.length; kt++) {
                    if (kt == 0) {
                        var ref = TTBL.df[info[0]][TTBL.df.group[group][0]];
                        if (isNull(thisDay[jt][info[0]]))
                            thisDay[jt][info[0]] = ref.name;
                        if (isNull(thisDay[jt].colour))
                            thisDay[jt].colour = ref.colour;
                        if (isNull(thisDay[jt].text))
                            thisDay[jt].text = ref.text;
                        else
                            thisDay[jt].text = "#000";
                    } else if (TTBL.vr.display.gpshort.indexOf(info[kt]) != -1
                        && isNull(thisDay[jt][info[kt]]))
                        thisDay[jt][info[kt]] = TTBL.df[info[kt]][TTBL.df.group[group][kt]];
                    else if (isNull(thisDay[jt][info[kt]]))
                        thisDay[jt][info[kt]] = TTBL.df.group[group][kt];
                }
            }
            if (isNull(thisDay[jt].type) || thisDay[jt].type != "break") {
                if (isNull(thisDay[jt].type))
                    thisDay[jt].type = "period";
                periods.push(thisDay[jt]);
            } else if (thisDay[jt].type == "break" && TTBL.breaks.indexOf(thisDay[jt].name) == -1) {
                TTBL.breaks.push(thisDay[jt].name);
            }
            blocks.push(thisDay[jt]);
        }
        TTBL.periods.push(periods);
        TTBL.blocks.push(blocks);
    }
}
TTBL.set = function () {
    for (var it = 0; it < TTBL.periods.length; it++) {
        var cells = $(".ttb-"+TTBL.df.dayKeys[it]);
        for (var jt = 0; jt < cells.length; jt++) {
            var currPeriod = TTBL.periods[it][jt];
            cells[jt].style.backgroundColor = currPeriod.colour;
            var header = cells[jt].getElementsByClassName("ttable-cellh")[0];
            header.innerHTML = currPeriod[TTBL.vr.display.period[0]];
            header.style.color = currPeriod.text;
            var info = cells[jt].getElementsByClassName("ttable-celli");
            for (var kt = 0; kt < info.length; kt++) {
                if (TTBL.vr.display.period[kt+1] == "time") {
                    var time = currPeriod.start+"-"+currPeriod.end;
                    info[kt].innerHTML = time;
                } else if (!isNull(currPeriod[TTBL.vr.display.period[kt+1]]))
                    info[kt].innerHTML = currPeriod[TTBL.vr.display.period[kt+1]];
                else
                    info[kt].innerHTML = "&nbsp;";
            }
            cells[jt].style.visibility = currPeriod.type == "blank" ? "hidden" : "visible";
        }
    }
    for (it = 0; it < TTBL.breaks.length; it++)
        $(".ttable-break")[it].innerHTML = TTBL.breaks[it];
    $(".ttb-info").empty();
    for (it = 0; it < TTBL.vr.display.info.length; it++) {
        var tempElement = "";
        tempElement += "<div class='ttbi-field'>";
        tempElement += "<div class='ttbi-fieldh'></div>";
        tempElement += "<div class='ttbi-fieldi'></div>";
        tempElement += "</div>"
        $(".ttb-info").append(tempElement);
        var header = TTBL.vr.display.info[it];
        var content = TTBL.info[TTBL.vr.display.info[it]];
        $(".ttbi-fieldh")[it].innerHTML = header;
        $(".ttbi-fieldi")[it].innerHTML = content;
    }
}
TTBL.find = function (day, hour, minute) {
    if (TTBL.vr.days.indexOf(day) == -1) return false;
    var td = TTBL.tb[TTBL.vr.days.indexOf(day)];
    for (var i = 0; i < td.length; i++) {
        var start = td[i].start.split(".");
        var end = td[i].end.split(".");
        if (hour >= start[0] &&
            hour <= end[0] &&
            (hour > start[0] || minute >= start[1]) &&
            (hour < end[0] || minute <= end[1]))
            return [TTBL.vr.days.indexOf(day), i];
    }
    return false;
}
TTBL.highlight = function (col, row) {
    var cell = $(".ttb-body>div:not(.ttable-head):nth("+row+")>div:not(:first-child):nth("+col+")")[0];
    if (isNull(cell)) cell = $(".ttb-body>div:not(.ttable-head):nth("+row+")")[0];
    if (isNull(cell)) return false;
    var highlighted = $(".ttb-highlight");
    for (var i = 0; i < highlighted.length; i++)
        highlighted[i].className = highlighted[i].className.replace(" ttb-highlight", "");
    if (cell.className.search(" ttb-highlight") == -1) {
        cell.className = cell.className += " ttb-highlight";
        return true;
    }
    return false;
}
$(document).on("pageload", function () {
    TTBL.setup();
    $("#ttb-test").click(function () {
        if ((isNull(TTBL.data) && isNull(localStorage.TTBL2)) ||
        (!isNull(localStorage.TTBL2) && confirm("Do you want to overwrite your current timetable?"))) {
            var xhr = new TBI.AJAX("/assets/data/ttb1.json", function (xhr) {
                localStorage.TTBL2 = xhr.response;
                TTBL.data = localStorage.TTBL2;
                TTBL.setup();
            });
        } else if (!isNull(TTBL.data) && isNull(localStorage.TTBL2)) {
            localStorage.TTBL2 = TTBL.data;
            TTBL.setup();
        }
    });
    $("#ttb-clear").click(function () {
        localStorage.removeItem("TTBL2");
        $(".ttb-body").empty();
        $(".ttb-info").empty();
        $("#ttb-test").css("visibility","hidden");
        setTimeout(function () {
            $("#ttb-test").css("visibility","visible");
        }, 10000);
    });
    TBI.HoverPopup.bindElement($("#ttb-clear")[0], "Clear timetable",
    "The 'Test timetable' button will be unavailable for a few seconds");
    //$(".ttbs-mode").buttonset();
    if (!isNull(localStorage.TTBL2)) {
        try {
            $(".ttb-set textarea").val(JSON.stringify($.parseJSON(localStorage.TTBL2), null, 4));
        } catch (e) {
            new TBI.error("Error: "+e.message);
            localStorage.removeItem("TTBL2");
        }
    }
    $("#ttbs-modee").click(function () {
        if ($(this).val() == "on") {
            $(".ttb-set textarea").attr("disabled", false);
        }
    });
    $("#ttbs-modev").click(function () {
        if ($(this).val() == "on") {
            $(".ttb-set textarea").attr("disabled", true);
            localStorage.TTBL4 = localStorage.TTBL2;
            try {
                localStorage.TTBL2 = JSON.stringify($.parseJSON($(".ttb-set textarea").val()));
                TTBL.setup();
            } catch (e) {
                TBI.error(e);
                localStorage.TTBL2 = localStorage.TTBL4;
                localStorage.removeItem("TTBL4");
            }
        }
    });
    $("#ttbs-hlnow").click(function () {
        var found = TTBL.find(now.getDay(), now.getHours(), now.getMinutes());
        TTBL.highlight(found[0], found[1]);
    });
    if (!isNull(localStorage.TTBL4)) $("#ttbs-hlnow").trigger("click");
});
