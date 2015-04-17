var MPoly = {
    defaults: {
        width: 9,
        height: 9,
        file: "/assets/data/mpoly_default.json"
    },
    file: {},
    board: {
        top: [],
        bottom: [],
        left: [],
        right: [],
        width: 0,
        height: 0,
        corners: new Array(4)
    },
    state: {
        pixelWidth: 600,
        pixelHeight: 600,
        offset: new Coords(0, 0),
        rotation: 0
    },
    images: {},
    width: 0,
    height: 0,
    settings: {
        boardWidth: 0.14,
        headerWidth: 0.3,
        namePosition: 0.12,
        pricePosition: 0.9,
        scaleModifier: 1
    },
    getCanvas: function (id) {
        MPoly.canvas = gebi(id);
        MPoly.$ = new Canvas2D(id);
        MPoly.width = MPoly.canvas.width;
        MPoly.height = MPoly.canvas.height;
        MPoly.state.pixelWidth = MPoly.canvas.width*MPoly.settings.scaleModifier;
        MPoly.state.pixelHeight = MPoly.canvas.height*MPoly.settings.scaleModifier;
        return !isNull(MPoly.canvas);
    },
    getBoard: function (url, callback) {
        new TBI.AJAX(url, function (xhr) {
            MPoly.file = $.parseJSON(xhr.response);
            MPoly.rules = MPoly.file.rules;
            MPoly.resources = MPoly.file.resources;
            MPoly.board = MPoly.file.board;
            callback();
        });
    },
    getImages: function (imgList, callback) {
        var totalImages = 0, timer = 0;
        for (var collection in imgList) if (imgList.hasOwnProperty(collection)) {
            if (imgList[collection] instanceof Array) {
                var arr = imgList[collection],
                    imageArr = new Array(arr.length);
                for (var i=0;i<arr.length;i++,totalImages++) {
                    var imageElement = document.createElement("img");
                    imageElement.src = arr[i];
                    imageElement.onload = function () { totalImages--; };
                    imageArr[i] = imageElement;
                }
                MPoly.images[collection] = imageArr;
            } else if (typeof(imgList[collection]) == "string") {
                totalImages++;
                var imageElement = document.createElement("img");
                imageElement.src = imgList[collection];
                imageElement.onload = function () { totalImages--; };
                MPoly.images[collection] = imageElement;
            }
        }
        TBI.timerSet("mpoly-imageload", 10, function () {
            if (totalImages < 1 || timer > 10000) {
                TBI.timerClear("mpoly-imageload");
                callback();
            } else timer += 10;
        });
    },
    preInit: function (id, callback) {
        if (MPoly.getCanvas(id)) {
            MPoly.getBoard(MPoly.defaults.file, function () {
                MPoly.getImages({
                    "corners": MPoly.resources.corners
                }, callback);
            });
        }
    },
    init: function (id) {
        MPoly.preInit(id, MPoly.loop);
    },
    loop: function () {
        MPoly.drawBoard();
    },
    generate: function (board) {
        MPoly.board.top = board.board.top;
        MPoly.board.width = board.board.width;
        MPoly.board.height = board.board.height;
    },
    drawBoard: function () {
        var w = MPoly.state.pixelWidth,
            h = MPoly.state.pixelHeight,
            o = MPoly.state.offset,
            bw = h*MPoly.settings.boardWidth,
            c = new Coords(w/2, h/2), // center
            sw = MPoly.board.width, // side width
            sh = MPoly.board.height, // side height
            aw = w-bw-bw, // adjusted width
            ah = h-bw-bw, // adjusted height
            hw = bw*MPoly.settings.headerWidth,
            np = MPoly.settings.namePosition,
            pp = bw*MPoly.settings.pricePosition,
            ci = MPoly.images.corners,
            pn = function (text, x, y, rot, wid) { // place name
                var nameCont = document.createElement("div"),
                    name = document.createElement("div");
                nameCont.className = "mpoly-name-container";
                name.className = "mpoly-name";
                $(name).css("width", wid+"px");
                $(name).css("left", x+"px");
                $(name).css("top", y+"px");
                $(nameCont).css("transform", "rotate("+rot+"deg)");
                $(name).text(text);
                nameCont.appendChild(name);
                gebi("mpoly-board").appendChild(nameCont);
            },
            ds = function (rot, side) { // draw side
                // offset
                MPoly.$.translate(o.x, o.y);

                // rotate
                MPoly.$.translate(c.x, c.y);
                MPoly.$.rotate(dtr(rot));
                MPoly.$.translate(-c.x, -c.y);

                // tiles
                MPoly.$.fillStyle = "#333";
                MPoly.$.fillRect(bw, h-bw, aw, bw);
                for (var x=bw,y=h-bw,t=aw/sw,i=sw-1;i>=0;x+=t,i--) {
                    var tile = isNull(side) ? {} : side[i];
                    // background
                    MPoly.$.fillStyle = "#ccc";
                    MPoly.$.fillRect(x, y, t, bw);

                    // header
                    if (!isNull(tile.colour)) MPoly.$.fillStyle = tile.colour;
                    MPoly.$.fillRect(x, y, t, hw);

                    // name
                    var tw = (isNull(tile.colour) ? bw : bw-hw) * np;
                    pn(isNull(tile.name) ? "" : tile.name, x, y+(isNull(tile.colour)?0:hw)+tw, rot, t);

                    // price
                    MPoly.$.fillStyle = "#000";
                    if (!isNull(tile.price)) MPoly.$.fillText(MPoly.resources.currency+tile.price, (x+x+t)/2, y+pp);
                }

                // reset rotate
                MPoly.$.translate(c.x, c.y);
                MPoly.$.rotate(dtr(-rot));
                MPoly.$.translate(-c.x, -c.y);

                // reset offset
                MPoly.$.translate(-o.x, -o.y);
            };

        // Reset and reference backing
        MPoly.$.clearRect(0, 0, MPoly.width, MPoly.height);
        MPoly.$.fillStyle = "#aaa";
        MPoly.$.fillRect(o.x, o.y, w, h);
        MPoly.$.textAlign = "center";
        MPoly.$.font = "12px Raleway";
        $("#mpoly-board").empty();

        // Side tiles
        ds(0, MPoly.board.bottom);
        ds(90, MPoly.board.left);
        ds(-90, MPoly.board.right);
        ds(180, MPoly.board.top);

        // Corners
        if (ci.length && ci.length == 4) {
            // drawImage(DOMImage, sx, sy, sw, sh, dx, dy, dw, dh)
            MPoly.$.drawImage(ci[0], 0, 0, 128, 128, o.x, o.y, bw, bw);
            MPoly.$.drawImage(ci[1], 0, 0, 128, 128, o.x+w-bw, o.y, bw, bw);
            MPoly.$.drawImage(ci[2], 0, 0, 128, 128, o.x, o.y+h-bw, bw, bw);
            MPoly.$.drawImage(ci[3], 0, 0, 128, 128, o.x+w-bw, o.y+h-bw, bw, bw);
        }
    }
};
MPoly.property = function (colour, name, price, type, rents) {
    this.colour = colour;
    this.name = name;
    this.price = price;
    this.type = type;
    this.rents = rents;
}
$(document).on("pageload", function () {
    MPoly.init("mpoly-canvas");
    $("#mpoly-rotation").on("input", function () {
        MPoly.state.rotation = $("#mpoly-rotation").val();
        MPoly.drawBoard();
    });
    $("#mpoly-scale").on("input", function () {
        MPoly.state.widthModifier = $("#mpoly-scale").val();
        MPoly.state.heightModifier = $("#mpoly-scale").val();
        MPoly.drawBoard();
    });
});
