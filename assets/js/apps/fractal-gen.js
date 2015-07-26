var gen, minimap;

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


// Quick and dirty fix for the <base> href attribute modifying hash links to point to the root directory
// instead of a specified portion of the page.
function fixHashLinks() {
    var links = $("a[href^='#']"); // all links that start with a "#" symbol (relative anchor links)
    links.attr("href", function (i, curr) { return location.pathname + curr; }); // put the current path in front of the URL to make it absolute
}

$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js",
    "assets/js/tblib/ui.js"
], function () {
    function FractalGen(cvs, supp, notFullWidth) {
        WideCanvas.call(this, cvs, notFullWidth);

        this.output = new WideCanvas(supp, notFullWidth);
        this.settings = {
            generation: {
                iterationLimit: 300,
                boundary: 4,
                analysisIncrement: 1,
                mode: GenerationModes.direct,
                timeout: 30000
            },
            display: {
                hueFrequency: -1.2,
                hueStart: 230,
                saturation: 0.7,
                value: 0.8,
                boundedColour: Colours.black.toHex()
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
                viewportFactor: new Vector2D(1)
            },
            function: "mandelbrot",
            julia: new Vector2D(0.2, 0.8)
        };
        this.previous = Object.copy(this.state);
        this.palette = [];

        this.pauseGeneration = false;

        var juliaFunc = function (obj) { return function (coord, cmp) {
            var gset = obj.settings.generation,
                dset = obj.settings.display,
                state = obj.state.view;

            cmp = cmp instanceof Complex ? cmp : new Complex(cmp.x, cmp.y);
            var fate = coord instanceof Complex ? coord : new Complex(coord.x, coord.y);
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

            return obj.settings.display.boundedColour;
        }; }(this);

        this.mandelbrot = function (coord) { return juliaFunc(Vector2D.zero, coord); };
        this.julia = function (cmp) { return function (coord) { return juliaFunc(coord, cmp); }; };
        this.keepExtentsSquare = function () {
            var extents = this.state.view.extents;
            var ratio = this.$.canvas.width / this.$.canvas.height;
            if ((extents.x/extents.y).fixFloat(4) == ratio.fixFloat(4)) return;

            extents.x = extents.y * ratio;
        };
        this.drawFractal = function (func, resolution, onCompletion, onTimeout) {
            var set = this.settings.generation,
                state = this.state.view;

            var start = new Vector2D(0, 0),
                end = new Vector2D(this.canvas.width, this.canvas.height);

            var self = this;
            var startTime = new Date().getTime();
            var draw = function (x, y, coord) {
                if (self.pauseGeneration || (new Date().getTime() - startTime) > set.timeout) return onTimeout();
                var value = func(coord);
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
            var constant = this.helper.correctCoordinate(state.pan).subtract(halfExtents);

            for (var x=start.x;x<end.x;x+=resolution) {
                for (var y=start.y;y<end.y;y+=resolution) {
                    if (self.pauseGeneration || (new Date().getTime() - startTime) > set.timeout) return onTimeout();
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
                                if (self.pauseGeneration || (new Date().getTime() - startTime) > set.timeout) return onTimeout();
                                var coord = new Vector2D(factor.x*x + constant.x, factor.y*y + constant.y);
                                draw(x, y, coord);
                            }, 0, x, y); break;
                    }
                }
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
                self.previous = Object.copy(self.state);
            }, function () {
                TBI.error("Fractal took too long to generate. Current limit is "+(self.settings.generation.timeout/1000)+" seconds.");
            });
        };
        this.loop = function (delta) {
            //this.helper.clear();
            this.keepExtentsSquare();
        };
        this.zoom = function (sign) {
            var set = gen.settings.controls,
                state = gen.state.controls;

            if (sign < 0)
                state.viewportFactor = state.viewportFactor.divide(set.scrollZoomFactor);
            else if (sign > 0)
                state.viewportFactor = state.viewportFactor.multiply(set.scrollZoomFactor);

            state.viewportFactor = state.viewportFactor.clamp(new Vector2D(1/256), new Vector2D(1));
            gen.drawViewport();
        }

        this.drawViewport = function () {
            var mouseCoords = this.state.controls.mouse;
            if (!isNull(mouseCoords)) {
                var factor = new Vector2D(this.output.canvas.width, this.output.canvas.height).multiply(this.state.controls.viewportFactor);

                var topLeft = mouseCoords.subtract(factor.divide(2));
                var bottomRight = mouseCoords.add(factor.divide(2));

                this.output.helper.clear();
                this.output.$.lineCap = "round";

                this.output.helper.circle(mouseCoords, 4, "#eee");

                this.output.helper.polygon([
                    topLeft,
                    new Vector2D(bottomRight.x, topLeft.y),
                    bottomRight,
                    new Vector2D(topLeft.x, bottomRight.y),
                    topLeft
                ], "rgba(255, 255, 255, 0.2)", 3, "#eee");
            }
            this.updateBindings();
        }
    }
    FractalGen.prototype = Object.create(WideCanvas.prototype);
    FractalGen.prototype.constructor = FractalGen;
    loader.start();

    $(document).on("pageload", function () {
        TBI.UI.updateUI();
        fixHashLinks();
        gen = new FractalGen($("#canvas")[0], $("#output")[0]);
        gen.render();

        minimap = new FractalGen($("#mini-mandelbrot-gen")[0], $("#mini-mandelbrot")[0], true);
        minimap.render();

        function updateMinimap() {
            var state = gen.state.view,
                ministate = minimap.state.view;
            var isMandelbrot = gen.state.function == "mandelbrot";
            var pan = state.pan;

            minimap.state.controls.mouse = minimap.helper.getLocationOfCoordinate(isMandelbrot ? pan : gen.state.julia, ministate.extents, ministate.pan);
            minimap.state.controls.viewportFactor = isMandelbrot ? state.extents.divide(ministate.extents) : 0;

            minimap.drawViewport();
        }

        $("#output").mousemove(function (e) {
            gen.state.controls.mouse = new Vector2D(e.originalEvent.layerX, e.originalEvent.layerY);
            gen.drawViewport();
        });
        $("#output").on("mousewheel", function (e) {
            gen.zoom(e.originalEvent.deltaY);
        });
        $(document).on("keydown", function (e) {
            switch (e.which) {
                case Keys.PAGE_UP: gen.zoom(-1); gen.updateBindings(); break;
                case Keys.PAGE_DOWN: gen.zoom(1); gen.updateBindings(); break;
            }
        });
        $("#output").mouseup(function (e) {
            if (e.button != 0 && e.button != 2) return;
            var state = gen.previous.view;

            var mouseCoords = new Vector2D(e.originalEvent.layerX, e.originalEvent.layerY);
            var factor = new Vector2D(gen.canvas.width, gen.canvas.height).divide(state.extents);
            var vpfactor = e.button == 0 ? gen.previous.controls.viewportFactor : gen.previous.controls.viewportFactor.inverse();

            var pan = gen.helper.getCoordinateFromLocation(mouseCoords, state.extents, state.pan);
            gen.state.view.pan = pan;
            gen.state.view.extents = state.extents.multiply(vpfactor);

            gen.render();
            gen.updateBindings();
            updateMinimap();
        });
        $("#output").on("contextmenu", function (e) {
            e.preventDefault();
            return false;
        });
        gen.bind($(".fractal-type")[0], "change", "gen.state.function", function (e, v) {
            $(".exclusive").hide();
            $(".exclusive." + v).show();
            gen.state.view.pan = v == "mandelbrot" ? new Vector2D(-0.75, 0) : new Vector2D(0, 0);
            gen.state.view.extents = new Vector2D(3, 3);
            gen.updateBindings();
        });
        $(".draw-fractal").click(function (e) {
            gen.render();
            gen.updateBindings();
            updateMinimap();
        });

        $("#mini-mandelbrot").mousemove(function (e) {
            minimap.state.controls.mouse = new Vector2D(e.originalEvent.layerX, e.originalEvent.layerY);
            minimap.drawViewport();
        });
        $("#mini-mandelbrot").click(function (e) {
            var state = minimap.state.view;
            var mouseCoords = new Vector2D(e.originalEvent.layerX, e.originalEvent.layerY);

            var coord = minimap.helper.getCoordinateFromLocation(mouseCoords, state.extents, state.pan);
            if (gen.function == "julia")
                gen.state.julia = coord;
            else
                gen.state.view.pan = coord;


            gen.render();
            gen.updateBindings();
            updateMinimap();
        });

        gen.bind($(".julia-real"), "change", "state.julia.x");
        gen.bind($(".julia-imaginary"), "change", "state.julia.y");
        gen.bind($(".fractal-pan-x"), "change", "state.view.pan.x");
        gen.bind($(".fractal-pan-y"), "change", "state.view.pan.y");
        gen.bind($(".fractal-zoom"), "change", function (obj, val) {
            var view = obj.state.view;

            if (isNull(val)) return Math.log2(3 / view.extents.y);
            else view.extents.y = 3 / Math.pow(2, val);
        });

        gen.bind($(".display-hue-start"), "change", function (obj, val) {
            var disp = obj.settings.display;

            if (!isNull(val)) {
                var colour = new Colour(val);
                disp.hueStart = colour.h;
                disp.saturation = colour.s;
                disp.value = colour.v;
            } else {
                var colour = new Colour.fromHSV(disp.hueStart, disp.saturation, disp.value);
                return colour.toHex();
            }
        });
        gen.bind($(".display-hue-frequency"), "change", function (obj, val) {
            if (isNull(val)) return -obj.settings.display.hueFrequency;
            else obj.settings.display.hueFrequency = -val;
        });

        gen.bind($(".generation-mode input[type='radio']"), "click", function (obj, val, el) {
            var gset = obj.settings.generation;

            if (isNull(val)) {
                if (GenerationModes[el.value] == gset.mode)
                    el.checked = true;
                else el.checked = false;
                return el.value;
            } else if (el.checked) {
                gset.mode = GenerationModes[el.value];
            }
        });

        gen.bind($(".generation-iteration-limit"), "change", "settings.generation.iterationLimit");
        gen.bind($(".generation-analysis-increment"), "change", function (obj, val) {
            if (isNull(val)) return 1 / obj.settings.generation.analysisIncrement;
            else obj.settings.generation.analysisIncrement = 1 / val;
        });
        gen.bind($(".generation-timeout"), "change", "settings.generation.timeout");
    });
});
});
