function P2DObject(id, position, rotation) {
    if (!isNull(id)) this.id = id;
    else this.id = btoa(parseInt(Math.random()*new Date().getTime())).reverse().substring(0, 16);
    this.position = position || new Vector2D(0, 0);
    this.rotation = rotation || 0;
    this.vertices = [];
}
P2DObject.prototype.setPosition = function (vec) { this.position = vec; return this; }
P2DObject.prototype.setRotation = function (angle) { this.rotation = angle; return this; }
P2DObject.prototype.scale = function (num) {
    for (var i=0;i<this.vertices.length;i++)
        this.vertices[i] = this.vertices[i].subtractVector(this.position).multiplyScalar(num).addVector(this.position);
    return this;
}
function circlePointV2D(angle, radius, centre) {
    if (isNull(centre)) centre = new Vector2D(0, 0);
    return centre.copy().add(new Vector2D(radius*Math.cos(angle), radius*Math.sin(angle)));
}
function P2DBoxObject(id, position, rotation, width, height) {
    P2DObject.call(this, id, position, rotation);
    this.width = width;
    this.height = height;
    this.halfExtents = new Vector2D(width/2, height/2);
    this.setVertices();
}
P2DBoxObject.prototype = P2DObject.prototype;
P2DBoxObject.prototype.constructor = P2DBoxObject;
P2DBoxObject.prototype.setVertices = function () {
    var extent = Math.pythagoras(this.width, this.height),
        angle = Math.atan2(this.height, this.width);
    this.vertices = [
        circlePointV2D(this.rotation-angle, -extent, this.position), // top-left
        circlePointV2D(this.rotation+angle, -extent, this.position), // bottom-left
        circlePointV2D(this.rotation-angle, extent, this.position), // bottom-right
        circlePointV2D(this.rotation+angle, extent, this.position) // top-right
    ];
}
P2DBoxObject.prototype.setPosition = function (position) {
    this.position = position;
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.setRotation = function (angle) {
    this.rotation = angle;
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.setDimensions = function (width, height) {
    this.width = width;
    this.height = height;
    this.halfExtents = new Vector2D(width/2, height/2);
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.scale = function (num) {
    this.height *= num;
    this.width *= num;
    this.setVertices();
    return this;
}
P2DBoxObject.prototype.getSides = function () {
    for (var i=1,a=[];i<this.vertices.length;i++)
        a.push(this.vertices[i].copy().subtractVector(this.vertices[i-1]));
    if (this.vertices.length > 1) a.push(this.vertices[this.vertices.length-1].copy().subtractVector(this.vertices[0]));
    return a;
}
P2DBoxObject.prototype.getSeparatingAxes = function () {
    var sides = this.getSides();
    for (var i=0,a=[];i<sides.length;i++) {
        var curr = sides[i].angle().fixFloat();
        if (a.indexOf(curr) == -1) a.push(curr);
    }
    return a;
}
P2DBoxObject.prototype.getCollisionVector = function (obj2) {
    var obj1 = this;
    switch (obj2.constructor) {
        case P2DBoxObject:

        break;
        default: return null;
    }
}
function Matrix(arr) {
    Array.call(this);
    for (var i=0;i<arr.length;i++) this.push(arr[i]);
    this.rows = arr.length;
    this.columns = arr[0].length;
}
Matrix.fromMatrixCollection = function (matarr) {
    for (var i=0,a=[];i<matarr.length;i++) a.push(matarr[i].toArray());
    return new Matrix(a);
}
Matrix.prototype = new Array();
Matrix.prototype.constructor = Matrix;
Matrix.prototype.toArray = function () { for (var i=0,a=[];i<this.length;i++) a.push(this[i]); return a; }
Matrix.prototype.getRow = function (row) { return this[row]; }
Matrix.prototype.getColumn = function (column) { for (var i=0,a=[];i<this.length;i++) a.push(this[i][column]); return a; }
Matrix.prototype.getElement = function (n) { return this[Math.floor(n/this.columns)][n%this.columns]; }
Matrix.prototype.multiply = function (mat) {
    if (this.columns != mat.rows) return undefined;
    for (var i=0,a=[];i<this.rows;i++) {
        for (var j=0,b=[];j<mat.columns;j++) {
            for (var k=0,t=0;k<this.getRow(i).length;k++)
                t += this.getRow(i)[k] * mat.getColumn(j)[k];
            b.push(t);
        }
        a.push(b);
    }
    return new Matrix(a);
}
Matrix.prototype.transpose = function () {
    for (var i=0,a=[];i<this.rows;i++) for (var j=0;j<this.columns;j++) a.push(this[j][i]);
    return a;
}
var Phys2D = {
    canvas: null,
    frames: 0,
    state: {
        paused: false,
        lastSecond: -1
    },
    settings: {

    },
    objects: [],
    overlay: {
        showMessage: function (message) {
            return;
            $("#phys-2d + .item-info .cvs-overlay-cont").show();
            $("#phys-2d + .item-info .cvs-overlay").html(message);
        },
        hide: function () {
            return;
            $("#phys-2d + .item-info .cvs-overlay-cont").hide();
        }
    },
    init: function () {
        if (!isNull(Phys2D.canvas)) {
            Phys2D.initStage();
            Phys2D.initObjects();
            Phys2D.loop();
        } else TBI.log("Phys2D initialisation failed.");
    },
    initStage: function () {
        Phys2D.$ = Phys2D.canvas.getContext("2d");
        Phys2D.width = Phys2D.canvas.width;
        Phys2D.height = Phys2D.canvas.height;
        Phys2D.overlay.hide();
        Phys2D.$.translate(0, Phys2D.height);
    },
    initObjects: function () {/*
        Phys2D.objects.push(new P2DObject(
            "circle-test",
            new P2DCircleGeometry(20),
            new P2DSolidMaterial("#00f"),
            new Vector2D(0, 0)
        ));
        Phys2D.objects.push(new P2DObject(
            "plot-test",                    // id
            new P2DPolygonGeometry([        // geometry
                [5,5],
                [5,-5],
                [-5,-5],
                [-5,5],
                [5,5]
            ]),
            new P2DOutlineMaterial("#f00"), // material
            new Vector2D(100, 200),         // position (optional)
            dtr(20),                             // angle (optional)
            10                              // scale (optional)
        ));*/
        Phys2D.objects.push(new P2DBoxObject(
            "box-test",
            new Vector2D(100, 180),
            dtr(20),
            90, 30
        ));
        Phys2D.objects.push(new P2DBoxObject(
            "box-test2",
            new Vector2D(200, 200),
            dtr(0),
            90, 120
        ));
    },
    getObjectById: function (id) {
        for (var i=0;i<Phys2D.objects.length;i++)
            if (Phys2D.objects[i].id == id)
        return Phys2D.objects[i];
    },
    loop: function () {
        requestAnimationFrame(Phys2D.loop);

        //if (document.body.className.search(" in-focus") == -1) { // lost focus
        //    Phys2D.overlay.showMessage("Lost focus. Please re-focus the browser window to continue.");
        //} else if (Phys2D.state.paused) { // paused
        //    Phys2D.overlay.showMessage("Paused.");
        //} else { // active
            Phys2D.overlay.hide();
            // time and frame control
            if (new Date().getTime() > Phys2D.lastSecond + 1000) {
                Phys2D.lastSecond = new Date().getTime();
                Phys2D.fps = Phys2D.frames;
                Phys2D.frames = 0;
            } else Phys2D.frames++;
            Phys2D.draw();
            Phys2D.animate();
        //}
    },
    draw: function () {
        Phys2D.$.clearRect(0, 0, Phys2D.width, -Phys2D.height);
        Phys2D.$.fillStyle = "#eee";
        Phys2D.$.fillRect(0, 0, Phys2D.width, -Phys2D.height);
        for (var i=0;i<Phys2D.objects.length;i++) {
            var curr = Phys2D.objects[i];

            Phys2D.$.beginPath();
            Phys2D.$.save();

            function drawCircle(x, y, r, s) {
                Phys2D.$.beginPath();
                Phys2D.$.arc(x, y, r, 0, dtr(360), false);
                if (s) Phys2D.$.stroke();
                else Phys2D.$.fill();
                Phys2D.$.closePath();
            }

            switch (curr.constructor) {
                case P2DBoxObject:
                    Phys2D.$.fillStyle = Phys2D.$.strokeStyle = "#777";
                    Phys2D.$.lineWidth = 2;

                    for (var j=0;j<curr.vertices.length;j++) {
                        var v = curr.vertices[j];
                        Phys2D.$.fillStyle = "#f00|#0f0|#00f|#ff0|#aaa".split("|")[j<0||j>3?4:j];
                        drawCircle(v.x, -v.y, 5, false);
                    }

                    Phys2D.$.fillStyle = Phys2D.$.strokeStyle = "#777";
                    Phys2D.$.beginPath();
                    Phys2D.$.moveTo(curr.vertices[0].x, -curr.vertices[0].y);
                    for (var j=1;j<curr.vertices.length;j++)
                        Phys2D.$.lineTo(curr.vertices[j].x, -curr.vertices[j].y);
                    Phys2D.$.lineTo(curr.vertices[0].x, -curr.vertices[0].y);
                    Phys2D.$.stroke();
                    Phys2D.$.closePath();

                    drawCircle(curr.position.x, -curr.position.y, 5, false);
                    drawCircle(curr.position.x, -curr.position.y, curr.width, true);
                    drawCircle(curr.position.x, -curr.position.y, curr.height, true);
                    drawCircle(curr.position.x, -curr.position.y, Math.pythagoras(curr.width, curr.height), true);
                break;
            }

            Phys2D.$.restore();
            Phys2D.$.closePath();
        }
    },
    animate: function () {

    }
};
$(function () {
    Require([
        "assets/js/tblib/base.js",
        "assets/js/tblib/util.js",
        "assets/js/tblib/net.js",
        "assets/js/tblib/loader.js",
        "assets/js/tblib/math.js"], function () {

        loader.start();
        $(document).on("pageload", function () {
            Phys2D.canvas = gebi("canvas");
            Phys2D.init();
        });
    });
})
