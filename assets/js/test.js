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