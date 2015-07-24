var gen;
function WideCanvas(cvs, notFullWidth) {
    this.canvas = cvs;
    this.$ = cvs.getContext("2d");
    if (isNull(this.$))
        TBI.error("Canvas initialisation failed.");
    this.helper = new CvsHelper(this.$);
    if (notFullWidth)
        this.fullWidth = false;
    this._loop();
}
WideCanvas.prototype = {
    constructor: WideCanvas,
    paused: false,
    lastFrame: -1,
    fullWidth: true,
    _loop: function () {
        var self = this;
        setTimeout(function () {
            self._loop();
        }, 0);

        var currTime = new Date().getTime();
        if (!this.paused) {
            if (this.lastFrame == -1) this.lastFrame = currTime;
            var delta = (currTime - this.lastFrame) / 1000;
            this.loop(delta);
        } else {

        }

        if (this.fullWidth) {
            if (window.innerWidth != this.canvas.width) this.canvas.width = window.innerWidth;
            if (window.innerHeight != this.canvas.height) this.canvas.height = window.innerHeight;
        }
        this.lastFrame = currTime;
    },
    loop: function () {},
    bind: function (element, event, property, onEvent) {
        if (!(onEvent instanceof Function)) onEvent = function () {};
        var cvs = this;
        function decodeProperty(obj, prop, value) {
            var tokens = prop.replace(/\["|"\]/, ".").removeAll(/\.$|^\./).split(".");
            var ref = obj;
            for (var i=0;i<tokens.length;i++) {
                if (i == tokens.length - 1 && !isNull(value))
                    ref[tokens[i]] = value;
                else if (!isNull(ref[tokens[i]]))
                    ref = ref[tokens[i]];
            }
            return ref;
        }
        var isNum = false;
        var initialVal = decodeProperty(cvs, property);
        if (typeof initialVal == typeof 1)
            isNum = true;
        $(element).val(decodeProperty(cvs, property));
        $(element).on(event, function (e) {
            decodeProperty(cvs, property, isNum ? parseFloat(this.value) : this.value);
            onEvent(e, this.value);
        });
    }
}

function Complex(real, imaginary) { this.real = real; this.imaginary = imaginary; }
Complex.prototype.add = function (cmp) {
    return new Complex(this.real + cmp.real, this.imaginary + cmp.imaginary);
}
Complex.prototype.multiply = function (cmp) {
    return new Complex(this.real*cmp.real - this.imaginary*cmp.imaginary,
                       this.real*cmp.imaginary + this.imaginary*cmp.real);
}
Complex.prototype.equals = function (cmp) {
    return Math.abs(this.real - cmp.real) < Number.EPSILON && Math.abs(this.real - cmp.real) < Number.EPSILON;
}

var GenerationModes = { direct: 0, delayed: 1, visual: 2 };

function StateHistory(obj, maxHistory) {
    this.state = obj;
    this.maxHistory = maxHistory;
    this.stack = [];
}
StateHistory.prototype.push = function () {
    if (this.stack.length >= this.maxHistory) this.stack.unshift();
    else this.stack.push(this.state);
}
StateHistory.prototype.pop = function () {
    this.state = this.stack.pop();
}

function FractalGen(cvs, supp, notFullWidth) {
    WideCanvas.call(this, cvs, notFullWidth);

    this.output = new WideCanvas(supp, notFullWidth);
    this.settings = {
        generation: {
            iterationLimit: 300,
            boundary: 4,
            analysisIncrement: 1,
            mode: GenerationModes.visual
        },
        display: {
            hueFrequency: -1.2,
            hueStart: 230,
            saturation: 0.7,
            value: 0.8
        },
        controls: {
            scrollZoomFactor: 2
        }
    };
    this.state = {
        view: {
            extents: new Vector2D(3, 3),
            pan: new Vector2D(-0.75, 0)
        },
        controls: {
            mouse: null,
            viewportFactor: 1
        },
        function: "mandelbrot",
        julia: new Complex(0.2, 0.8)
    };
    this.history = new StateHistory(this.state, 20);
    this.palette = [],
    this.mandelbrot = function (obj, coord) {
        var gset = obj.settings.generation,
            dset = obj.settings.display,
            state = obj.state.view;
        /*
            var y2 = coord.y*coord.y;
            var xt14 = coord.x - 1/4;
            var q = xt14*xt14 + y2;
            if (q*(q + xt14) < y2/4
                || (coord.x + 1)*(coord.x + 1) + y2 < 1/16)
                return "#000";
        */

        var cmp = new Complex(coord.x, coord.y);
        var fate = new Complex(0, 0);
        var fatesqr = new Complex(0, 0);

        for (var i=0;i<gset.iterationLimit;i++) {
            //var nextFate = fate.multiply(fate).add(cmp);
            fate.imaginary = fate.real * fate.imaginary;
            fate.imaginary += fate.imaginary;
            fate.imaginary += cmp.imaginary;
            fate.real = fatesqr.real - fatesqr.imaginary + cmp.real;

            fatesqr.real = Math.pow(fate.real, 2);
            fatesqr.imaginary = Math.pow(fate.imaginary, 2);

            /*if (nextFate.equals(fate))
                return "#000";
            else fate = nextFate;*/

            if (fatesqr.real + fatesqr.imaginary > gset.boundary)
                return obj.palette[i];
        }
        return "#000";
    };
    this.julia = function (cmp) {
        return function (obj, coord) {
            var gset = obj.settings.generation,
                dset = obj.settings.display,
                state = obj.state.view;

            var fate = new Complex(coord.x, coord.y);
            var fatesqr = new Complex(fate.real*fate.real, fate.imaginary*fate.imaginary);

            for (var i=0;i<gset.iterationLimit;i++) {
                fate.imaginary = fate.real * fate.imaginary;
                fate.imaginary += fate.imaginary;
                fate.imaginary += cmp.imaginary;
                fate.real = fatesqr.real - fatesqr.imaginary + cmp.real;

                fatesqr.real = Math.pow(fate.real, 2);
                fatesqr.imaginary = Math.pow(fate.imaginary, 2);

                if (fatesqr.real + fatesqr.imaginary > gset.boundary)
                    return obj.palette[i];
            }

            return "#000";
        }
    }
    this.keepExtentsSquare = function () {
        var extents = this.state.view.extents;
        var ratio = this.$.canvas.width / this.$.canvas.height;
        if ((extents.x/extents.y).fixFloat(4) == ratio.fixFloat(4)) return;

        extents.x = extents.y * ratio;
    };
    this.drawFractal = function (func, resolution, onCompletion) {
        var set = this.settings.generation,
            state = this.state.view;

        var start = new Vector2D(0, 0),
            end = new Vector2D(this.canvas.width, this.canvas.height);

        var self = this;
        var draw = function (x, y, coord) {
            var value = func(self, coord);
            self.$.fillStyle = value;
            self.$.beginPath();
            self.$.fillRect(x, y, resolution, resolution);
            self.$.fill();
            self.$.closePath();
            if (x + resolution >= end.x && y + resolution >= end.y && onCompletion instanceof Function)
                onCompletion();
        };
        var factor = state.extents.divide(new Vector2D(this.canvas.width, this.canvas.height));
        var halfExtents = state.extents.divide(2);
        var constant = state.pan.subtract(halfExtents);

        for (var x=start.x;x<end.x;x+=resolution)
            for (var y=start.y;y<end.y;y+=resolution)
                switch (set.mode) {
                    case GenerationModes.direct:
                        draw(x, y, new Vector2D(factor.x*x + constant.x, factor.y*y + constant.y)); break;
                    case GenerationModes.delayed:
                        requestAnimationFrame(function (x, y) {
                            var coord = new Vector2D(factor.x*x + constant.x, factor.y*y + constant.y);
                            return function () {
                                draw(x, y, coord)
                            }
                        }(x, y)); break;
                    case GenerationModes.visual:
                        setTimeout(function (x, y) {
                            var coord = new Vector2D(factor.x*x + constant.x, factor.y*y + constant.y);
                            draw(x, y, coord);
                        }, 0, x, y); break;
                }
    };
    this.regeneratePalette = function () {
        var dset = this.settings.display,
            gset = this.settings.generation;

        for (var i=0;i<gset.iterationLimit;i++)
            this.palette[i] = new Colour.fromHSV(Math.abs(i*dset.hueFrequency + dset.hueStart) % 360, dset.saturation, dset.value).toHex();
    };
    this.render = function () {
        var gset = this.settings.generation;
        var func = function () {};

        switch (this.state.function) {
            case "mandelbrot":
                func = this.mandelbrot; break;
            case "julia":
                func = this.julia(this.state.julia); break;
            default:
                TBI.log("No function selected.");
                return;
        }

        this.keepExtentsSquare();
        this.helper.clear();
        this.regeneratePalette();

        var self = this;
        this.canvas.style.display = "block";
        this.drawFractal(func, gset.analysisIncrement, function () {
            self.canvas.style.display = "none";
            self.output.canvas.style.backgroundImage = "url("+self.canvas.toDataURL("image/png")+")";
        });
    }
    this.drawThing = function () {
        this.render(this.mandelbrot);
        /*
        //var increment = 32;
        var self = this;
        var draw = function (inc) {
            self.drawFractal(self.mandelbrot, inc, inc <= 1 ? function () {} : function (i) { return function () { draw(i); }; }(inc/2));
        }
        //this.drawFractal(this.mandelbrot, increment);
        draw(32);*/
    };
    this.loop = function (delta) {
        //this.helper.clear();
        this.keepExtentsSquare();
        this.history.push();
    };

    var master = this;
    this.output.drawViewport = function () {
        var mouseCoords = master.state.controls.mouse;
        if (!isNull(mouseCoords)) {
            var factor = new Vector2D(this.canvas.width, this.canvas.height).multiply(master.state.controls.viewportFactor);

            var topLeft = mouseCoords.subtract(factor.divide(2));
            var bottomRight = mouseCoords.add(factor.divide(2));
            this.helper.clear();
            this.helper.polygon([
                topLeft,
                new Vector2D(bottomRight.x, topLeft.y),
                bottomRight,
                new Vector2D(topLeft.x, bottomRight.y),
                topLeft
            ], "rgba(255, 255, 255, 0.1)", 3, "#eee");
        }
    }
}
FractalGen.prototype = Object.create(WideCanvas.prototype);
FractalGen.prototype.constructor = FractalGen;

$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js",
    "assets/js/tblib/ui.js"
], function () {
    loader.start();

    $(document).on("pageload", function () {
        TBI.UI.updateUI();
        gen = new FractalGen($("#canvas")[0], $("#output")[0]);
        gen.render();

        var minimap = new FractalGen($("#mini-mandelbrot-gen")[0], $("#mini-mandelbrot")[0], true);
        minimap.render();

        $("#output").mousemove(function (e) {
            gen.state.controls.mouse = new Vector2D(e.clientX, e.clientY);
            gen.output.drawViewport();
        });
        $("#output").on("mousewheel", function (e) {
            var set = gen.settings.controls,
                state = gen.state.controls;

            var dir = e.originalEvent.deltaY;
            if (dir < 0)
                state.viewportFactor /= set.scrollZoomFactor;
            else if (dir > 0)
                state.viewportFactor *= set.scrollZoomFactor;

            state.viewportFactor = Math.bound(state.viewportFactor, 1/256, 1);
            gen.output.drawViewport();
        });
        $("#output").mouseup(function (e) {
            if (e.button != 0 && e.button != 2) return;
            var state = gen.state.view;

            var mouseCoords = new Vector2D(e.clientX, e.clientY);
            var factor = new Vector2D(gen.canvas.width, gen.canvas.height).divide(state.extents);
            var vpfactor = e.button == 0 ? gen.state.controls.viewportFactor : 1 / gen.state.controls.viewportFactor;

            state.pan = gen.helper.correctCoordinate(gen.helper.getCoordinateFromLocation(mouseCoords, state.extents, state.pan));
            state.extents = state.extents.multiply(vpfactor);

            gen.render();
        });
        $("#output").on("contextmenu", function (e) {
            e.preventDefault();
            return false;
        });
        gen.bind($(".fractal-type")[0], "change", "gen.state.function", function (e, v) {
            $(".exclusive").hide();
            $(".exclusive." + v).show();
            gen.state.view.pan = new Vector2D(0, 0);
            gen.state.view.extents = new Vector2D(3, 3);
        });
        $(".draw-fractal").click(function (e) {
            gen.render();
        });

        gen.bind($(".julia-real")[0], "change", "state.julia.real");
        gen.bind($(".julia-imaginary")[0], "change", "state.julia.imaginary");
    });
});
});
