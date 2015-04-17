var Complex = function (real, imaginary) { this.real = real; this.imaginary = imaginary; }
Complex.prototype.add = function (cNum) { return new Complex(this.real + cNum.real, this.imaginary + cNum.imaginary); }
Complex.prototype.multiply = function (c0) {
    return new Complex(this.real*c0.real - this.imaginary*c0.imaginary,
            this.real*c0.imaginary + this.imaginary*c0.real);
}
var CmpCvs = {};
CmpCvs.setup = function () {
    CmpCvs.HEIGHT = 300;
    CmpCvs.WIDTH = 300;
    CmpCvs.BOUNDARY = 600;
    CmpCvs.hue = 130;
    CmpCvs.hueFreq = 1;
    CmpCvs.mode = 1;
    CmpCvs.UPSCALE = 2;
    CmpCvs.$ = new Canvas2D("cmp-canvas");
    CmpCvs.$.translate(300, 300);
    CmpCvs.$_ = new Canvas2D("cmp-mouse");
    CmpCvs.$_.translate(300, 300);
    //$("#cmp-factor").spinner({step:0.5,min:1,page:2});
    //$("#cmp-maxiter").spinner({step:10,min:30,page:20});
    TBI.toggleButton($("#cmp-tracking")[0], true);
    $(".cmp-jonly").hide();
}
CmpCvs.reset = function () {
    CmpCvs.asisIncrement = 0.5;
    CmpCvs.maxIter = 30;
    CmpCvs.factor = 110;
    CmpCvs.pan = [-0.75, 0];
    CmpCvs.tracking = false;
    TBI.toggleButton($("#cmp-tracking")[0], CmpCvs.tracking);
    CmpCvs.jfunc = new Complex(0.3, 0.25);
    $("#cmp-asisinc").val(CmpCvs.asisIncrement);
    $("#cmp-maxiter").val(CmpCvs.maxIter);
    $("#cmp-factor").val(CmpCvs.factor.toString().length-1);
    $("#cmp-panx").val(CmpCvs.pan[0]);
    $("#cmp-pany").val(CmpCvs.pan[1]);
    $("#cmp-jreal").val(CmpCvs.jfunc.real);
    $("#cmp-jimaginary").val(CmpCvs.jfunc.imaginary);
}
CmpCvs.init = function () {
    CmpCvs.location = [0,0];
    CmpCvs.$.clearRect(-600, -600, 1200, 1200);
    CmpCvs.analyse();
    TBI.timerClear("cmpPlane");
    TBI.timerSet("cmpPlane", 50, CmpCvs.loop);
    return new Date().getTime();
}
CmpCvs.loop = function () {
    CmpCvs.$_.clearRect(-600, -600, 1200, 1200);
    if (!CmpCvs.tracking) return false;
    CmpCvs.drawAxis();
    var f = CmpCvs.factor;
    if (CmpCvs.mode == 1) {
        var func = function (cmpvalue, comp) { return cmpvalue.multiply(cmpvalue).add(comp); }
        var cmp = new Complex(CmpCvs.location[0]/f, CmpCvs.location[1]/f);
        var fate = new Complex(0,0);
        CmpCvs.plot(fate, func(fate, cmp));
        for (var i=0;i<CmpCvs.maxIter;i++) {
            fate = func(fate, cmp);
            CmpCvs.plot(fate, func(fate, cmp));
        }
    } else {
        var cmp = new Complex(CmpCvs.location[0]/f, CmpCvs.location[1]/f);
        CmpCvs.plot(cmp, CmpCvs.func(cmp));
        for (var i=0;i<CmpCvs.maxIter;i++) {
            cmp = CmpCvs.func(cmp);
            CmpCvs.plot(cmp, CmpCvs.func(cmp));
        }
    }
    CmpCvs.drawCentre();
}
CmpCvs.drawAxis = function () {
    CmpCvs.$_.save();
    CmpCvs.$_.lineWidth = 1;
    var p = CmpCvs.pan, u = CmpCvs.UPSCALE, h = 0.5;
    Canvas2D.path(CmpCvs.$_, {type:"stroke",style:"#333",path:[[-300+h,-p[1]*u+h],[300+h,-p[1]*u+h]]});
    Canvas2D.path(CmpCvs.$_, {type:"stroke",style:"#333",path:[[-p[0]*u+h,-300+h],[-p[0]*u+h,300+h]]});
    Canvas2D.path(CmpCvs.$_, {type:"stroke",style:"#77a",path:[[-300+h,h],[300+h,h]]});
    Canvas2D.path(CmpCvs.$_, {type:"stroke",style:"#77a",path:[[h,-300+h],[h,300+h]]});
    CmpCvs.$_.restore();
}
CmpCvs.drawCentre = function () {
    CmpCvs.$_.beginPath();
    CmpCvs.$_.fillStyle = "#333";
    CmpCvs.$_.arc(.5,.5,3,0,dtr(360),false);
    CmpCvs.$_.fill();
    CmpCvs.$_.closePath();
    CmpCvs.$_.beginPath();
    CmpCvs.$_.fillStyle = "#eee";
    CmpCvs.$_.arc(.5,.5,1,0,dtr(360),false);
    CmpCvs.$_.fill();
    CmpCvs.$_.closePath();
    CmpCvs.$.beginPath();
    CmpCvs.$.fillStyle = "#333";
    CmpCvs.$.arc(.5,.5,3,0,dtr(360), false);
    CmpCvs.$.fill();
    CmpCvs.$.closePath();
    CmpCvs.$.beginPath();
    CmpCvs.$.fillStyle = "#eee";
    CmpCvs.$.arc(.5,.5,1,0,dtr(360), false);
    CmpCvs.$.fill();
    CmpCvs.$.closePath();
}
CmpCvs.plot = function (cmp, cmp2) {
    CmpCvs.$_.lineWidth = 1;
    var f = CmpCvs.factor, p = CmpCvs.pan, u = CmpCvs.UPSCALE;
    var colour = "hsl("+((new Date().getTime()/8)%360)+",100%,50%)";
    Canvas2D.path(CmpCvs.$_,{type:"stroke",style:"#eee",path:[[(cmp.real*f-p[0])*u,(cmp.imaginary*f-p[1])*u],[(cmp2.real*f-p[0])*u,(cmp2.imaginary*f-p[1])*u]]});
}
CmpCvs.func = function (cmp) {
    return cmp.multiply(cmp).add(CmpCvs.jfunc);
    // z^2 + j
}
CmpCvs.conditions = function (cmp) {
    switch (CmpCvs.mode) {
        case 0: return CmpCvs.julia(cmp);
        case 1: return CmpCvs.mandelbrot(cmp);
    }
}
CmpCvs.isBounded = function (cmp) {
    if (isNaN(cmp.real)||isNaN(cmp.imaginary)) var result = false; // when it craps out
    else var result = !(Math.abs(cmp.real)>CmpCvs.BOUNDARY||Math.abs(cmp.imaginary)>CmpCvs.BOUNDARY); // beyond boundary
    return result;
}
CmpCvs.mandelbrot = function (cmp) {
    var func = function (cmpvalue, comp) { return cmpvalue.multiply(cmpvalue).add(comp); }; // z^2 + comp
    var fate = new Complex(0,0);
    for (var i=0;i<CmpCvs.maxIter;i++) {
        fate = func(fate, cmp); // test to see if julia plot center is bounded
        if (!CmpCvs.isBounded(fate)) return i;
    }
    return null;
}
CmpCvs.julia = function (cmp) {
    for (var i=0;i<CmpCvs.maxIter;i++) {
        cmp = CmpCvs.func(cmp);
        if (!CmpCvs.isBounded(cmp)) return i;
    }
    return null;
}
CmpCvs.analyse = function () {
    var f = CmpCvs.factor,
        h = CmpCvs.HEIGHT,
        w = CmpCvs.WIDTH,
        p = CmpCvs.pan,
        r = CmpCvs.hue,
        y = CmpCvs.hueFreq,
        a = CmpCvs.asisIncrement,
        b = a*2,
        u = CmpCvs.UPSCALE;
    p[0]*=f;
    p[1]*=f;
    for (var i=-h/2+p[0];i<h/2+p[0];i+=a) { // i starts as negative half height plus pan, less than half height plus pan
        for (var j=-w/2+p[1];j<w/2+p[1];j+=a) { // j starts as negative half width plus pan, less than half width plus pan
            var result = CmpCvs.conditions(new Complex(i/f,j/f));
            if (!isNull(result)) CmpCvs.$.fillStyle = "hsl("+-parseInt(((result+r/y)%360)*y)+",100%,50%)"; // pwetty colours
            else CmpCvs.$.fillStyle = "#000"; // boring
            CmpCvs.$.beginPath();
            CmpCvs.$.fillRect(i*u-p[0]*u-(a<1?1:a),j*u-p[1]*u-(a<1?1:a),b<2?2:b,b<2?2:b);
            // CmpCvs.$.arc(i*u-p[0]*u,j*u-p[1]*u,a<1?1:a,0,dtr(360),false); // wtf was i thinking
            CmpCvs.$.fill();
            CmpCvs.$.closePath();
        }
    }
    CmpCvs.drawCentre();
}
CmpCvs.validate = function () {
    var asisinc = $("#cmp-asisinc").val(),
        maxiter = $("#cmp-maxiter").val(),
        factor = $("#cmp-factor").val(),
        panx = $("#cmp-panx").val(),
        pany = $("#cmp-pany").val(),
        real = $("#cmp-jreal").val(),
        imaginary = $("#cmp-jimaginary").val(),
        code = 0,
        prefix = "Complex Plane validation error: ";
    if (isNull(asisinc) || isNull(maxiter) || isNull(factor) || isNull(panx) || isNull(pany) || (CmpCvs.mode == 0 && isNull(real) || isNull(imaginary))) code = 1;
    else if (isNaN(asisinc) || isNaN(maxiter) || isNaN(factor) || isNaN(panx) || isNaN(pany) || (CmpCvs.mode == 0 && isNaN(real) || isNaN(imaginary))) code = 2;
    else if (asisinc <= 0 || maxiter <= 0 || factor <= 0) code = 3;
    else if (asisinc < 0.3 || maxiter > 600 || factor > 15) code = 4;
    else if (asisinc > 10) code = 5;
    else if (parseInt(maxiter) != maxiter) code = 6;
    switch (code) {
        case 0: return true; break;
        case 1: TBI.error(prefix+"Null values are not allowed."); break;
        case 2: TBI.error(prefix+"Values have to be numbers."); break;
        case 3: TBI.error(prefix+"The increment, max iteration and factor have to be positive."); break;
        case 4: TBI.error(prefix+"The work required is too large."); break;
        case 5: TBI.error(prefix+"The analysis increment is too large for proper resolution."); break;
        case 6: TBI.error(prefix+"The maximum iteration has to be a positive integer."); break;
        default: TBI.error(prefix+"Unhandled exception."); break;
    }
    return false;
}
CmpCvs.generate = function (asis, maxiter, factor, panx, pany, real, imaginary) {
    CmpCvs.asisIncrement = asis;
    CmpCvs.maxIter = maxiter;
    CmpCvs.factor = factor;
    CmpCvs.pan[0] = panx;
    CmpCvs.pan[1] = -pany;
    CmpCvs.jfunc.real = real;
    CmpCvs.jfunc.imaginary = imaginary;
    var beginTime = new Date().getTime();
    $("#cmp-generate").html("Generating...");
    TBI.timerSet("cmp-generation", 10, function () {
        try {
            var endTime = CmpCvs.init();
            var finalTime = endTime-beginTime;
            if (CmpCvs.mode == 1) $("#cmp-generate").html("Generate Mandelbrot Set");
            else $("#cmp-generate").html("Generate Julia Set");
            TBI.log("Completed in "+finalTime+"ms.");
        } catch (e) { TBI.error(e); }
        finally { TBI.timerClear("cmp-generation"); }
    });
}
CmpCvs.submit = function () {
    if (!CmpCvs.validate()) return false;
    else CmpCvs.generate(parseFloat($("#cmp-asisinc").val()),
            parseInt($("#cmp-maxiter").val()),
            Math.pow(10,parseFloat($("#cmp-factor").val())),
            parseFloat($("#cmp-panx").val()),
            parseFloat($("#cmp-pany").val()),
            parseFloat($("#cmp-jreal").val()),
            parseFloat($("#cmp-jimaginary").val()));
}
$(document).on("pageload",function () {
    CmpCvs.setup();
    CmpCvs.reset();
    $("#cmp-mouse").mousemove(function (event) {
        var f = CmpCvs.factor, u = CmpCvs.UPSCALE;
        CmpCvs.location = [(event.offsetX-300+(CmpCvs.pan[0]*u))/u, (event.offsetY-300+(CmpCvs.pan[1]*u))/u];
    });
    $("#cmp-mouse").click(function () {
        var f = CmpCvs.factor;
        $("#cmp-panx").val(CmpCvs.location[0]/f);
        $("#cmp-pany").val(-(CmpCvs.location[1]/f));
        CmpCvs.submit();
    });
    $("#cmp-lquality").click(function () { $("#cmp-asisinc").val("2"); });
    $("#cmp-mquality").click(function () { $("#cmp-asisinc").val("1"); });
    $("#cmp-hquality").click(function () { $("#cmp-asisinc").val("0.5"); });
    $("#cmp-tracking").click(function () { CmpCvs.tracking = TBI.isToggled(this); });
    $("#cmp-mode").click(function () {
        CmpCvs.mode = CmpCvs.mode==0?1:0;
        if (CmpCvs.mode == 0) {
            $(".cmp-jonly").show();
            $("#cmp-generate").html("Generate Julia Set");
            CmpCvs.reset();
            $("#cmp-panx").val(CmpCvs.pan[0] = 0);
        }
        else {
            $(".cmp-jonly").hide();
            $("#cmp-generate").html("Generate Mandelbrot Set");
            CmpCvs.reset();
        }
    });
    $("#cmp-generate").click(function () {
        CmpCvs.submit();
    });
    $("#cmp-reset").click(function () { CmpCvs.reset(); });
    $("#cmp-plus").click(function () {
        if (!CmpCvs.validate()) return false;
        else {
            $("#cmp-factor").val($("#cmp-factor").val()*1+1);
            CmpCvs.submit();
        }
    });
    $("#cmp-minus").click(function () {
        if (!CmpCvs.validate()) return false;
        else {
            $("#cmp-factor").val($("#cmp-factor").val()*1-1);
            CmpCvs.submit();
        }
    });
    $("#cmp-centre").click(function () {
        if (!CmpCvs.validate()) return false;
        else {
            if (CmpCvs.mode == 1) $("#cmp-panx").val(-0.75);
            else $("#cmp-panx").val(0);
            $("#cmp-pany").val(0);
            $("#cmp-factor").val(2);
            CmpCvs.submit();
        }
    });
    TBI.HoverPopup.bindElement(gebi("cmp-asisinch"), "Analysis Increment",
            "This controls the resolution and performance of the generation. A smaller number\
            leads to a more thorough analysis and a better looking picture. They also dramatically\
            increase the time required to generate the image.");
    TBI.HoverPopup.bindElement(gebi("cmp-maxiterh"), "Maximum Iterations",
            "This number is the number of tries each value is tested against. A higher number\
            generates a more detailed image, but impacts performance. Increase this number when\
            you want to see more of the fractal.");
    TBI.HoverPopup.bindElement(gebi("cmp-factorh"), "Zoom Factor",
            "This is a number that controls the zoom level of the image. Increase this to see at\
            a deeper level. This can only be increased to 15.");
    for (var i=0;i<gecn("cmp-panh").length;i++) {
        TBI.HoverPopup.bindElement(gecn("cmp-panh")[i], "Pan",
                "These values control the panning of the image. These can be set manually, or\
                alternatively set by clicking on the image where you want it to be centered.");
    }
});
