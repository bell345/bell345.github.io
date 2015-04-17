var PSim = {};
PSim.init = function () {
    PSim.AU = 149600000;
    PSim.PF = 100000;
    PSim.LF = 20000;
    PSim.starbank = [];
    PSim.objectbank = {};
    PSim.labels = [];
    PSim.speed = 1;
    $("#psim-speed").val(1);
    PSim.scale = 1;
    $("#psim-scale").val(1);
    PSim.zoom = 1;
    $("#psim-zoom").val(1);
    PSim.pan = [0,0];
    PSim.storedSec = Math.floor(new Date().getTime()/1000);
    PSim.ms = 10;
    PSim.fps = 1000/PSim.ms;
    PSim.frames = 0;
    PSim.planetLines = false;
    PSim.planetOrbits = true;
    PSim.debug = false;
    PSim.planetLabels = true;
    PSim.clicked = 0;
    PSim.overlay = null;
    PSim.selected = null;
    PSim.objectvars = {};
    PSim.objects = [];
    TBI.timerClear("PSim");
    var xhr = new TBI.AJAX("/assets/data/psim.json", function (xhr) {
        try { PSim.objectvars = $.parseJSON(xhr.response).objects; PSim.objects = $.parseJSON(xhr.response).list }
        catch (e) { e.message = "Planetarium load error: "+ e.message; TBI.error(e) }
        TBI.timerSet("PSim", PSim.ms, function () {
            try { PSim.simulate() }
            catch (e) { e.message = "Planetarium error: " + e.message; TBI.error(e) }
        });
    });
}
/**
    STATS FOR A NEW PLANET:
    distance : semi-major axis in AU,
    speed : average orbital speed in km/s,
    size : mean radius in km
    - Assuming perfectly circular orbit
*/
PSim.simulate = function () {
    PSim.ctx.clearRect(-300,-300,600,600);
    PSim.spawnStars(600);
    for (var i = 0; i < PSim.objects.length; i++)
        if (PSim.objects[i].type != "satellite") PSim.object(PSim.objects[i].name);
        else PSim.satellite(PSim.objects[i].parent, PSim.objects[i].name);
    PSim.sun(696342);
    if (!isNull(PSim.overlay)) PSim.cursor();
    PSim.frameControl();
    if (PSim.debug) PSim.statistics();
    return null;
}
PSim.sun = function (radius) {
    PSim.ctx.save();
    PSim.ctx.beginPath();
    PSim.ctx.arc(PSim.pan[0] * (PSim.zoom * PSim.PF), PSim.pan[1] * (PSim.zoom * PSim.PF), radius/PSim.LF * PSim.zoom, 0, dtr(360), false);
    PSim.ctx.shadowBlur = 24;
    PSim.ctx.shadowColor = "#fff";
    PSim.ctx.fillStyle = "#ff0";
    PSim.ctx.fill();
    PSim.ctx.fillStyle = "#ff0";
    PSim.ctx.arc(PSim.pan[0] * (PSim.zoom * PSim.PF), PSim.pan[1] * (PSim.zoom * PSim.PF), 2, 0, dtr(360), false);
    PSim.ctx.fill();
    PSim.ctx.closePath();
    PSim.ctx.restore();
}
PSim.spawnStars = function (num) {
    var isStarbank = PSim.starbank.length > 0;
    num = isStarbank ? PSim.starbank.length : num;
    for (var i=0;i<num;i++) {
        if (isStarbank) {
            var x = PSim.starbank[i][0];
            var y = PSim.starbank[i][1];
        } else {
            var x = advRandomInt(-600, 600);
            var y = advRandomInt(-600, 600);
        }
        PSim.ctx.save();
        PSim.ctx.beginPath();
        PSim.ctx.scale(Math.pow(PSim.zoom,0.05),Math.pow(PSim.zoom,0.05));
        PSim.ctx.arc(x+0.5+0, y+0.5+0, 0.5, 0, dtr(360), false);
        PSim.ctx.fillStyle = "#fff";
        PSim.ctx.fill();
        PSim.ctx.closePath();
        PSim.ctx.restore();
        if (!isStarbank) PSim.starbank.push([x, y]);
    }
}
PSim.planet = function (name) {
    var planet = PSim.objectvars[name];
    if (isNull(planet) || planet.type != "planet") return false;
    var rotation = isNull(PSim.objectbank[name]) ? PSim.objectvars[name].rotation : PSim.objectbank[name][0];
    rotation = isNull(rotation) ? randomInt(360) : rotation % 360;
    rotation += (360 / (planet.distance * PSim.AU * 2 * Math.PI / planet.speed)) / PSim.fps * PSim.speed;
    var distance = planet.distance * PSim.AU / PSim.LF * PSim.zoom;
    var size = planet.size / PSim.LF * PSim.scale * PSim.zoom;
    var panX = PSim.pan[0] * PSim.zoom * PSim.PF;
    var panY = PSim.pan[1] * PSim.zoom * PSim.PF;
    PSim.ctx.save();
    PSim.ctx.translate(panX, panY);
    PSim.ctx.beginPath();
    PSim.ctx.fillStyle = planet.colour;
    PSim.ctx.rotate(dtr(rotation));
    PSim.ctx.arc(distance, 0, size, 0, dtr(360), false);
    PSim.ctx.fill();
    PSim.ctx.closePath();
    if (PSim.selected == name) {
        PSim.ctx.save();
        PSim.ctx.rotate(-dtr(rotation));
        var a = circlePoint(rotation, distance);
        var x = a.x, y = a.y;
        Canvas2D.path(PSim.ctx, {type:"stroke",style:"#09f",path:[[x,y],[x+10,y],[x,y],[x-10,y],[x,y],[x,y+10],[x,y],[x,y-10]]});
        PSim.ctx.restore();
    }
    if (!isNull(planet.rings) && navigator.userAgent.search("MSIE")==-1) {
        PSim.ctx.save();
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = planet.rings.colour;
        PSim.ctx.lineWidth = (planet.rings.max_distance*PSim.AU/PSim.LF)*PSim.zoom-(planet.rings.min_distance*PSim.AU/PSim.LF)*PSim.zoom;
        var ringDistance = Math.mean([planet.rings.min_distance, planet.rings.max_distance]);
        PSim.ctx.arc(distance, 0, (ringDistance * PSim.AU / PSim.LF) * PSim.zoom, 0, dtr(360), false);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
        PSim.ctx.restore();
    }
    if (PSim.planetLabels && distance > 1) {
        PSim.ctx.save();
        PSim.ctx.rotate(-dtr(rotation));
        PSim.ctx.font = "12px Raleway";
        var loc = circlePoint(rotation, distance);
        PSim.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        PSim.ctx.fillRect(loc.x-2, loc.y-8, 70, 20);
        PSim.labels[PSim.labelFind(name)] = {
            "name":name,
            "location":[loc.x-2+panX, loc.y-8+panY],
            "dimensions":[70,20]
        };
        PSim.ctx.fillStyle = "white";
        if (PSim.selected == name) PSim.ctx.fillStyle = "#09f";
        PSim.ctx.fillText(name, loc.x+8, loc.y+6);
        PSim.ctx.restore();
    }
    if (PSim.planetLines) {
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = planet.colour;
        PSim.ctx.moveTo(0,0);
        PSim.ctx.lineTo(1000, 0);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    if (PSim.planetOrbits) {
        PSim.ctx.moveTo(0,0);
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = planet.colour;
        PSim.ctx.arc(0, 0, distance, 0, dtr(360), false);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    PSim.ctx.restore();
    PSim.objectbank[name] = [
        rotation,
        distance,
        size
    ];
    return true;
}
PSim.satellite = function (parent, name) {
    var planet = PSim.objectvars[parent];
    var satellite = planet.satellites[name];
    var parentRotation = PSim.objectbank[parent][0];
    var parentDistance = planet.distance * PSim.AU / PSim.LF * PSim.zoom;
    var rotation = isNull(PSim.objectbank[name]) ? PSim.objectvars[parent].satellites[name].rotation : PSim.objectbank[name][0];
    rotation = isNull(rotation) ? randomInt(360) : rotation % 360;
    rotation += (360 / (satellite.distance * PSim.AU * 2 * Math.PI / satellite.speed)) / PSim.fps * PSim.speed;
    var distance = satellite.distance * PSim.AU / PSim.LF * PSim.zoom;
    var size = satellite.size / PSim.LF * PSim.scale * PSim.zoom;
    var panX = PSim.pan[0] * PSim.zoom * PSim.PF;
    var panY = PSim.pan[1] * PSim.zoom * PSim.PF;
    PSim.ctx.save();
    PSim.ctx.translate(panX, panY);
    PSim.ctx.beginPath();
    var position = circlePoint(parentRotation, parentDistance);
    PSim.ctx.fillStyle = satellite.colour;
    PSim.ctx.translate(position.x, position.y);
    PSim.ctx.rotate(dtr(rotation));
    PSim.ctx.arc(distance, 0, size, 0, dtr(360), false);
    PSim.ctx.fill();
    PSim.ctx.closePath();
    if (PSim.planetLabels && distance > 1) {
        PSim.ctx.save();
        PSim.ctx.rotate(-dtr(rotation));
        PSim.ctx.font = "8px Raleway";
        PSim.ctx.fillStyle = "white";
        var loc = circlePoint(rotation, distance);
        PSim.ctx.fillText(name, loc.x+6, loc.y+4);
        PSim.ctx.restore();
    }
    if (PSim.planetLines) {
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = satellite.colour;
        PSim.ctx.moveTo(0,0);
        PSim.ctx.lineTo(1000,0);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    if (PSim.planetOrbits) {
        PSim.ctx.moveTo(0,0);
        PSim.ctx.beginPath();
        PSim.ctx.strokeStyle = satellite.colour;
        PSim.ctx.arc(0, 0, distance, 0, dtr(360), false);
        PSim.ctx.stroke();
        PSim.ctx.closePath();
    }
    PSim.ctx.restore();
    PSim.objectbank[name] = [rotation];
    return true;
}
PSim.field = function (name) {
    var field = PSim.objectvars[name];
    if (isNull(field) || field.type != "field") return false;
    var rotation = isNull(PSim.objectbank[name]) ? PSim.objectvars[name].rotation : PSim.objectbank[name][1];
    rotation = isNull(rotation) ? 0 : rotation;
    rotation += field.speed * PSim.speed;
    PSim.ctx.save();
    PSim.ctx.fillStyle = field.colour;
    PSim.ctx.rotate(dtr(rotation));
    var isObjbank = !isNull(PSim.objectbank[name]); // [distance, size, rotation]
    var single;
    var fieldArr = [];
    for (var i=0;i<field.density;i++) {
        if (isObjbank) single = PSim.objectbank[name][0][i];
        else single = [
            advRandomInt(field.distance*7480, field.distance*7480 + field.distance_range*7480),
            advRandomInt(field.size, field.size + field.size_range),
            randomInt(360)];
        PSim.ctx.save();
        PSim.ctx.beginPath();
        PSim.ctx.rotate(dtr(single[2]));
        PSim.ctx.arc(single[0] * PSim.zoom, 0, single[1] * PSim.scale * PSim.zoom, 0, dtr(360), false);
        PSim.ctx.fill();
        PSim.ctx.closePath();
        PSim.ctx.restore();
        fieldArr.push(single);
    }
    PSim.ctx.restore();
    PSim.objectbank[name] = [fieldArr, rotation];
    return true;
}
PSim.object = function (name) {
    if (isNull(PSim.objectvars[name])) return false;
    if (PSim.objectvars[name].type == "planet") return PSim.planet(name);
    else if (PSim.objectvars[name].type == "field") return PSim.field(name);
    else return false;
}
PSim.frameControl = function () {
    PSim.frames++;
    if (PSim.storedSec != Math.floor(new Date().getTime()/1000)) {
        PSim.storedSec = Math.floor(new Date().getTime()/1000);
        PSim.fps = PSim.frames;
        PSim.frames = 0;
    }
}
PSim.statistics = function () {
    PSim.ctx.beginPath();
    var uX=-300,uY=-300,lX=-100,lY=-150;
    Canvas2D.path(PSim.ctx, {type:"fill",style:"rgba(240,240,240,0.6)",path:[[uX,uY],[uX,lY],[lX,lY],[lX,uY],[uX,uY]]});
    PSim.ctx.fill();
    PSim.ctx.closePath();
    PSim.ctx.font = "bold 16px Raleway";
    PSim.ctx.fillStyle = "black";
    PSim.ctx.fillText("Statistics", -285, -275);
    PSim.ctx.font = "normal 12px Open Sans";
    var y = -275;
    PSim.ctx.fillText("Zoom: "+PSim.zoom+"x", -280, y += 16);
    PSim.ctx.fillText("Scale: "+PSim.scale+"x", -280, y += 16);
    PSim.ctx.fillText("Speed: "+PSim.speed+"x", -280, y += 16);
    var panx = PSim.pan[0].toFixed(8);
    panx=panx==PSim.pan[0]?PSim.pan[0]:panx;
    var pany = PSim.pan[1].toFixed(8);
    pany=pany==PSim.pan[1]?PSim.pan[1]:pany;
    var pant = (panx==PSim.pan[0]&&pany==PSim.pan[1])?"Pan: ":"Pan ≈ ";
    PSim.ctx.fillText(pant+panx+", "+pany, -280, y += 16);
    PSim.ctx.fillText("FPS: "+PSim.fps, -280, y += 16);
    PSim.ctx.fillText("Selection: "+PSim.selected, -280, y += 16);
}
PSim.cursor = function () {
    var x = PSim.overlay.pageX - $("#psim-canvas").offset().left - 300.5;
    var y = PSim.overlay.pageY - $("#psim-canvas").offset().top - 300.5;
    Canvas2D.path(PSim.ctx, {type:"stroke",style:"white",path:[[x,y],[x+10,y],[x,y],[x-10,y],[x,y],[x,y+10],[x,y],[x,y-10]]});
    if (PSim.clicked == 1) {
        var zoom = PSim.zoom;
        PSim.zoom = zoom>1?1:zoom;
        if (zoom>1) { $("#psim-zoom").val(1) }
        PSim.clicked = 2;
        PSim.pan = [0, 0];
        PSim.selected = null;
        for (var i = 0; i < PSim.labels.length; i++) {
            var label = PSim.labels[i];
            if ((x > label.location[0] && x < label.location[0] + label.dimensions[0] &&
                y > label.location[1] && y < label.location[1] + label.dimensions[1]) &&
                label.name != PSim.selected) {
                PSim.focus(label.name);
                PSim.speed = 1;
                $("#psim-speed").val(1);
                PSim.selected = label.name;
                PSim.zoom = zoom;
                return true;
            }
        }
        return false;
    }
    return null;
}
PSim.labelFind = function (name) {
    for (var i = 0; i < PSim.labels.length; i++) if (PSim.labels[i].name == name) return i;
    return PSim.labels.length;
}
PSim.focus = function (name) {
    var object = PSim.objectbank[name];
    var location = circlePoint(object[0] % 360, object[1]);
    PSim.pan = [-location.x/(PSim.zoom * PSim.PF), -location.y/(PSim.zoom * PSim.PF)];
}
$(document).on("pageload", function () {
    PSim.ctx = new Canvas2D("psim-canvas");
    PSim.ctx.translate(300, 300);
    var zoomed = false,
        scaled = false,
        speeded = false,
        panned = false;
    // Zoom
    $("#psim-zoom").mousedown(function () { zoomed = true });
    $("#psim-zoom").mouseup(function () { zoomed = false });
    $("#psim-zoom").mousemove(function () { if (zoomed) PSim.zoom = +Math.pow($("#psim-zoom").val(), 8).toFixed(6) });
    $("#psim-zoom").val(PSim.zoom = 1);
    TBI.HoverPopup.bindElement(gebi("psim-zoom-help"), "Zoom", "Zooms in and out relative to the simulation's center point.<br /><em>\
    The sun stops zooming out when it appears to be around 4 pixels wide.</em>");
    // Scale
    $("#psim-scale").mousedown(function () { scaled = true });
    $("#psim-scale").mouseup(function () { scaled = false });
    $("#psim-scale").mousemove(function () { if (scaled) PSim.scale = +Math.pow($("#psim-scale").val(), 4).toFixed(6) });
    $("#psim-scale-reset").click(function () { $("#psim-scale").val(PSim.scale = 1) });
    $("#psim-scale-reset").trigger("click");
    TBI.HoverPopup.bindElement(gebi("psim-scale-help"), "Scale", "Scales the planet sizes to make them more easily visible.<br /><em>Does not \
    increase the size of the Sun.</em>");
    TBI.HoverPopup.bindElement(gebi("psim-scale-reset"), "Scale Reset", "Resets the planet sizes to realistic values.");
    // Speed
    $("#psim-speed").mousedown(function () { speeded = true });
    $("#psim-speed").mouseup(function () { speeded = false });
    $("#psim-speed").mousemove(function () {
        if (speeded && !isNegative($("#psim-speed").val())) PSim.speed = +Math.pow($("#psim-speed").val(), 6).toFixed(6)
        else if (speeded) PSim.speed = -Math.pow($("#psim-speed").val(), 6).toFixed(6)
    });
    $("#psim-speed-reset").click(function () { $("#psim-speed").val(PSim.speed = 1) });
    $("#psim-speed-pause").click(function () { $("#psim-speed").val(PSim.speed = 0) });
    $("#psim-speed-reset").trigger("click");
    TBI.HoverPopup.bindElement(gebi("psim-speed-help"), "Speed", "Speeds up or pauses the simulation.");
    TBI.HoverPopup.bindElement(gebi("psim-speed-reset"), "Speed Reset", "Resets the simulation speed to realistic values.");
    TBI.HoverPopup.bindElement(gebi("psim-speed-pause"), "Speed Pause", "Stops the simulation completely.");
    // Checkboxes / Boolean values
    $("#psim-plines").click(function () { PSim.planetLines = TBI.isToggled(this); });
    $("#psim-porbits").click(function () { PSim.planetOrbits = TBI.isToggled(this); });
    $("#psim-debug").click(function () { PSim.debug = TBI.isToggled(this); });
    $("#psim-plabels").click(function () { PSim.planetLabels = TBI.isToggled(this); });
    // Canvas
    $("#psim-canvas").mousemove(function (event) { PSim.overlay = event });
    $("#psim-canvas").mouseleave(function (event) { PSim.overlay = null; PSim.clicked = 0 });
    $("#psim-canvas").mousedown(function () { PSim.clicked = 1 });
    $("#psim-canvas").mouseup(function () { PSim.clicked = 0 });
    $("#psim-reset").click(function () { if (confirm("Are you sure? The current position will be reset.")) PSim.init() });
    $("#psim-power").click(function () {
        if (TBI.isToggled(this)) PSim.init();
        else { TBI.timerClear("PSim"); PSim.ctx.clearRect(-300,-300,600,600); }
    });
    PSim.init();
});
