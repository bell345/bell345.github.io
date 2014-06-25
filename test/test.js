var Scale = {};
Scale.setup = function () {
    Scale.$ = new Canvas2D("scale");
    Scale.width = gebi("scale").width;
    Scale.height = gebi("scale").height;
    Scale.start = 0;
    Scale.end = 200;
    Scale.padding = 16;
}
Scale.init = function (list) {
    if (isNull(list)) {
        var list = [];
        for (var i=0;i<25;i++) list.push(randomInt(randomInt(201)));
    }
    TBI.log(list);
    Scale.whiskerPlot(list,30,20);
}
Scale.drawScale = function (s, e, y, h) {
    var p = Scale.padding,
        w = Scale.width,
        f = (w-p-p)/(e-s),
        g = 1;
    Scale.start = s;
    Scale.end = e;
    while (f*g < 20) {
        g++;
        if (g % 5 == 4) g++;
        else if (g % 5 == 3) g+=2;
        else if (g % 10 == 7) g+=3;
        else if (g % 10 == 6) g+=4;
    }
    Canvas2D.set(Scale.$, "font", "bold 10px Raleway");
    Canvas2D.set(Scale.$, "stroke", "#444", 2);
    Canvas2D.path(Scale.$, {type:"stroke",style:"#555",path:[[0,p+y],[w,p+y]]});
    for (var i=p,j=s*g;i<w;i+=f*g,j+=g) {
        Canvas2D.path(Scale.$, {type:"stroke",style:"#555",path:[[i,p+y],[i,p+y-h]]});
        Scale.$.textAlign = "center";
        Scale.$.fillText(j,i,p+y+10);
    }
}
Scale.whiskerPlot = function (list, y, h) {
    Scale.$.clearRect(0,0,Scale.width,Scale.height);
    list = sort(list);
    Scale.drawScale(0, list[list.length-1]+(3*list[list.length-1].toString().length), 80, 5);
    var p = Scale.padding,
        w = Scale.width,
        s = Scale.start,
        e = Scale.end,
        f = (w-p-p)/(Scale.end-Scale.start),
        ul = p+y-h/2,
        ll = p+y+h/2,
        us = p+y-h/4,
        ls = p+y+h/4,
        values = [list[0],Math.quartiles(list).lower,Math.median(list),
                Math.quartiles(list).upper,list[list.length-1]];
        iqr = [[f*values[1]+p,ll],[f*values[3]+p,ll],[f*values[3]+p,ul],[f*values[1]+p,ul]];
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[0]+p,p+y],[f*values[4]+p,p+y]]});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[0]+p,ls],[f*values[0]+p,us]]});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[4]+p,ls],[f*values[4]+p,us]]});
    Canvas2D.path(Scale.$,{type:"fill",style:"#eee",path:iqr});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:iqr});
    Canvas2D.path(Scale.$,{type:"stroke",style:"#000",path:[[f*values[2]+p,ll],[f*values[2]+p,ul]]});
}
$(document).on("pageload", function () {
    Scale.setup();
    var list = [1,3,5,7,2,9,3,5,7,5,4,3,1];
    Scale.init(list);
});
CrtPlane = {
    bounds: {x:7,y:7},
    pan: {x:0,y:0},
    mouse: new Coords(0,0),
    axes: true,
    scale: true,
    grid: true,
    log: false,
    rwInterval: 1,
    fnDefinition: 1,
    funcs: [
        new LinearFunc(2,-2), 
        // Joseph is a person who can't stop eating cake. He recently had some exercise, losing two kilos in the process.
        // But he just got to his brother's wedding, with the most delicious cake. He can't resist and he gains weight at a 
        // rate of two kilograms a minute. If he gains (X) kilos, how long did he eat the cake?
        new RelationFunc(2,3,10).toLinear()
    ],
    colours: [
        "#a00","#0a0","#00a","#aa0","#a0a","#0aa","#aaa",
        "#500","#050","#005","#550","#505","#055","#777",
        "#f00","#0f0","#00f","#ff0","#f0f","#0ff","#fff"
    ]
};
CrtPlane.setup = function (id) {
    CrtPlane.id = id;
    CrtPlane.$ = new Canvas2D(id);
    CrtPlane.width = gebi(id).width;
    CrtPlane.height = gebi(id).height;
    CrtPlane.$.clearRect(0,0,CrtPlane.width,CrtPlane.height);
    CrtPlane.$.translate(CrtPlane.width/2, CrtPlane.height/2);
}
CrtPlane.set = function (key, value) {
    if (isNull(CrtPlane[key])) return false;
    CrtPlane[key] = value;
    CrtPlane.init();
}
CrtPlane.reset = function () {
    CrtPlane.$.clearRect(-CrtPlane.width/2, -CrtPlane.height/2,CrtPlane.width,CrtPlane.height);
}
CrtPlane.init = function () {
    CrtPlane.reset();
    if (CrtPlane.scale) CrtPlane.drawScale();
    if (CrtPlane.axes) CrtPlane.drawAxes();
    for (var i=0;i<CrtPlane.funcs.length;i++)
        CrtPlane.func(CrtPlane.funcs[i], CrtPlane.colours[i % CrtPlane.colours.length]);
    //CrtPlane.randomWalk(10000, "#a00");
    //CrtPlane.randomWalk(10000, "#0a0");
    //CrtPlane.randomWalk(10000, "#00a");
}
CrtPlane.randomWalk = function (num, style) {
    var plot = [],
        loc = new Coords(0,0),
        it = CrtPlane.rwInterval;
    for (var i=0;i<num;i++) {
        if (Math.floor(Math.random()*2) == 0) loc.x += Math.floor(Math.random()*2) == 0 ? -it : it;
        else loc.y += Math.floor(Math.random()*2) == 0 ? -it : it;
        plot.push([loc.x,loc.y]);
    }
    CrtPlane.plot(plot, style);
}
CrtPlane.proportion = function (f,g,lower,upper) {
    while (f*g<lower) { // for larger numbers
        if (!(f*(g*10)>upper)) g*=10;
        else if (!(f*(g*5))>upper) g*=5;
        else g*=2;
    }
    while (f*g>upper) { // for decimal numbers
        if (f*(g/10)<lower) g/=2; // either divide by two (0.5, 0.005, etc...)
        else if (!(f*(g/5))>upper) g/=5; // divide by five (0.2, 0.002, etc...)
        else g/=10; // or divide by ten (0.1, 0.2, 0.3, 0.005, 0.006, etc...)
    }
    return g;
}
CrtPlane.fixDecimal = function (num) {
    return parseFloat(num.toPrecision(16));
}
CrtPlane.drawScale = function () {
    var b = CrtPlane.bounds,
        w = CrtPlane.width,
        h = CrtPlane.height,
        p = CrtPlane.pan,
        f = CrtPlane.fixDecimal,
        g = CrtPlane.grid,
        fx = CrtPlane.fixDecimal(w/(2*b.x)), // factor of x on the canvas
        fy = CrtPlane.fixDecimal(h/(2*b.y)), // factor of y on the canvas
        gx = CrtPlane.proportion(fx, 1, 30, 50), // proportion of the scale of x
        gy = CrtPlane.proportion(fy, 1, 30, 50), // proportion of the scale of y
        mx = 0,
        my = 0;
    while (!((b.x+mx) % gx).equal(0)) mx += gx-(b.x%gx);
    while (!((b.y+my) % gy).equal(0)) my += gy-(b.y%gy);
    if (CrtPlane.log) TBI.log("Manifest:\nBounds: ("+b.x+", "+b.y+")\nfx: "+fx+", gx: "+gx+", modulo: "+(b.x%gx)+", mx: "+mx);
    CrtPlane.$.textAlign = "center";
    CrtPlane.$.font = "8px Righteous";/*
    for (var x=xs;x<=xe;x+=xi) { // x axis
        Canvas2D.path(CrtPlane.$, {type:"stroke",style:"#aaa",path:[[x+p.x,5+p.y],[x+p.x,-5+p.y]]}); // line
        if (x!=0) CrtPlane.$.fillText(CrtPlane.fixDecimal(x/fx),x+p.x,15+p.y); // label
    }
    CrtPlane.$.textAlign = "left";
    for (var y=ys;y<=ye;y+=yi) { // y axis
        Canvas2D.path(CrtPlane.$, {type:"stroke",style:"#aaa",path:[[5+p.x,y+p.y],[-5+p.x,y+p.y]]}); // line
        if (y!=0) CrtPlane.$.fillText(y/-fy,10+p.x,y+2+p.y); // label
    }*/
    for (var x=-b.x-mx;x<=b.x+mx;x+=gx) {
        Canvas2D.path(CrtPlane.$, {type:"stroke",style:"#aaa",path:[[x*fx+p.x,(g?h/2:5)+p.y],[x*fx+p.x,-(g?h/2:5)+p.y]]});
        if (x!=0) CrtPlane.$.fillText(x=(parseFloat(x.toPrecision(14))), x*fx+p.x,15+p.y);
    }
    CrtPlane.$.textAlign = "left";
    for (var y=-b.y-my;y<=b.y+my;y+=gy) {
        Canvas2D.path(CrtPlane.$, {type:"stroke",style:"#aaa",path:[[(g?w/2:5)+p.x,y*fy+p.y],[-(g?w/2:5)+p.x,y*fy+p.y]]});
        if (y!=0) CrtPlane.$.fillText(-(y=parseFloat((y).toPrecision(14))),10+p.x,y*fy+2+p.y);
    }
}
CrtPlane.drawAxes = function () {
    var w = CrtPlane.width,
        h = CrtPlane.height,
        p = CrtPlane.pan;
    CrtPlane.$.lineWidth = 2;
    Canvas2D.path(CrtPlane.$, {type:"stroke",style:"#000",path:[[p.x,-h/2],[p.x,h/2]]}); // x axis
    Canvas2D.path(CrtPlane.$, {type:"stroke",style:"#000",path:[[-w/2,p.y],[w/2,p.y]]}); // y axis
    CrtPlane.$.lineWidth = 1;
}
CrtPlane.plot = function (path, style) {
    var fx = CrtPlane.width/(CrtPlane.bounds.x*2),
        fy = -(CrtPlane.height/(CrtPlane.bounds.y*2)),
        p = CrtPlane.pan;
    CrtPlane.$.save();
    CrtPlane.$.strokeStyle = isNull(style) ? "#000" : style;
    CrtPlane.$.beginPath();
    CrtPlane.$.moveTo((isNull(path[0].x)?path[0][0]:path[0].x)*fx+p.x,(isNull(path[0].y)?path[0][1]:path[0].y)*fy+p.y);
    for (var i=1;i<path.length;i++) CrtPlane.$.lineTo((isNull(path[i].x)?path[i][0]:path[i].x)*fx+p.x,(isNull(path[i].y)?path[i][1]:path[i].y)*fy+p.y);
    CrtPlane.$.stroke();
    CrtPlane.$.restore();
}
CrtPlane.func = function (func, style) {
    if (!(func instanceof LinearFunc)) return false;
    var b = CrtPlane.bounds,
        w = CrtPlane.width,
        h = CrtPlane.height,
        inc = CrtPlane.fnDefinition,
        plot = [],
        fx = w/(2*b.x),
        fy = h/(2*b.y);
    for (var x=-b.x;x<=b.x;x+=inc) {
        if (!isNull(func.eval(x)) && Math.abs(func.eval(x)) != Infinity) // if valid
            plot.push([x, func.eval(x)]);
    }
    CrtPlane.plot(plot, (style?style:"#000"));
}
$(document).on("pageload", function () {
    var beginTime = new Date().getTime();
    CrtPlane.setup("cart-plane");
    CrtPlane.init();
    TBI.log((new Date().getTime()-beginTime)+" ms");
});