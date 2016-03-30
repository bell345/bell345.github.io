var methane, formaldehyde;
$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/loader.js"
], function () {
    loader.start();

    var SVGNS = "http://www.w3.org/2000/svg";

    var Settings = {
        positioning: {
            presets: {
                above: new Vector2D(0, -1.1),
                below: new Vector2D(0, 1.1),
                left: new Vector2D(-1.1, 0),
                right: new Vector2D(1.1, 0),
                "below-left": new Vector2D(-1.1, 0.8),
                "below-right": new Vector2D(1.1, 0.8)
            },
            defaultRadius: 30
        }
    };

    var Modules = {
        "methane": [
            {
                "type": "atom",
                "symbol": "C",
                "links": [
                    {
                        "type": "single",
                        "with": 1,
                        "position": "above"
                    },
                    {
                        "type": "single",
                        "with": 2,
                        "position": "below"
                    },
                    {
                        "type": "single",
                        "with": 3,
                        "position": "left"
                    },
                    {
                        "type": "single",
                        "with": 4,
                        "position": "right"
                    }
                ]
            },
            {
                "type": "atom",
                "symbol": "H"
            },
            {
                "type": "atom",
                "symbol": "H"
            },
            {
                "type": "atom",
                "symbol": "H"
            },
            {
                "type": "atom",
                "symbol": "H"
            }
        ],
        "formaldehyde": [
            {
                "type": "atom",
                "symbol": "O",
                "links": [
                    {
                        "type": "double",
                        "with": 1,
                        "position": "below"
                    }
                ]
            },
            {
                "type": "atom",
                "symbol": "C",
                "links": [
                    {
                        "type": "single",
                        "with": 2,
                        "position": "below-left"
                    },
                    {
                        "type": "single",
                        "with": 3,
                        "position": "below-right"
                    }
                ]
            },
            {
                "type": "atom",
                "symbol": "H"
            },
            {
                "type": "atom",
                "symbol": "H"
            }
        ]
    };

    var Atoms = {
        "H": {
            "radius": 10
        },
        "C": {
            "radius": 30
        }
    };

    function relativeBoundingBox(reference, subject) {
        var box3 = {};
        box3.top = subject.top - reference.top;
        box3.bottom = subject.bottom - reference.top;
        box3.left = subject.left - reference.left;
        box3.right = subject.right - reference.left;
        box3.width = subject.width;
        box3.height = subject.height;
        return box3;
    }

    function Module(spec) {
        this.root = document.createElementNS(SVGNS, "svg");
        $(this.root).addClass("module");
        var items = [];
        for (var i=0;i<spec.length;i++) {
            var item = spec[i],
                obj = null;

            switch (item["type"]) {
                case "atom":
                    obj = new Atom(item["symbol"] || "H");
                    break;
                default:
                    break;
            }
            items.push(obj);
        }
        for (var i=0;i<spec.length;i++) {
            var item = spec[i],
                obj = items[i];

            if (item["links"]) for (var j=0;j<item["links"].length;j++) {
                var link = item["links"][j];
                if (typeof link["with"] == "number")
                    link["with"] = items[link["with"]];

                obj.link(link);
            }
        }
        var roots = items.filter(function (e) { return e.parent == null; });
        if (roots.length > 1)
            throw new Error("Invalid module specification: multiple roots found");
        else if (roots.length < 1)
            throw new Error("Invalid module specification: no roots found");

        this.primary = roots[0];

        this.root.appendChild(this.primary.svg);
        this.primary.reposition();
    }
    Module.prototype = {
        constructor: Module,
        reposition: function (width, height) {
            var posSet = Settings.positioning;
            if (!document.contains(this.root))
                throw new Error("Module needs to exist on the page in order to be repositioned.");
            this.root.setAttribute("width", width.toString());
            this.root.setAttribute("height", height.toString());

            var actualBox = this.primary.svg.getBoundingClientRect();

            var relativeBox = relativeBoundingBox(
                this.root.getBoundingClientRect(),
                this.primary.svg.getBoundingClientRect()
            );

            console.log(relativeBox);

            var currViewBox = (this.root.getAttribute("viewBox") || "0 0 " + width + " " + height)
                .split(" ").map(function (s) {
                    return parseInt(s);
                });

            var perX = currViewBox[2]/width;
            var perY = currViewBox[3]/height;

            console.log(perX, perY);

            var boxX = relativeBox.left * perX + currViewBox[0];
            var boxY = relativeBox.top * perY + currViewBox[1];
            var boxWidth = relativeBox.width * perX;
            var boxHeight = relativeBox.height * perY;

            this.root.setAttribute("viewBox", [boxX, boxY, boxWidth, boxHeight].join(" "));
        }
    };

    function Atom(symbol) {
        var posSet = Settings.positioning;
        this.symbol = symbol;
        this.svg = document.createElementNS(SVGNS, "g");
        this.svg.setAttribute("class", "atom atom-"+symbol.toLowerCase());
        this.$ = new SVGHelper(this.svg);

        var ref = Atoms[symbol] || {};

        this.radius = ref["radius"] || posSet.defaultRadius;

        this.$.circle(this.radius, new Vector2D(0, 0));
        this.$.write(this.symbol, new Vector2D(0, 0));

        this.links = [];
        this.parent = null;
    }
    Atom.prototype = {
        constructor: Atom,
        translate: function (x, y) {
            moveWithTransforms(this.svg, x, y, true);
        },
        link: function (link) {
            this.links.push(link);
            var atom = link["with"];
            atom.parent = this;
            this.svg.appendChild(atom.svg);
        },
        reposition: function () {
            var presets = Settings.positioning.presets;
            for (var i=0;i<this.links.length;i++) {
                var link = this.links[i];
                if (!link["position"]) continue;
                if (!link["with"]) continue;
                var other = link["with"],
                    pos = null;

                if (presets[link["position"]])
                    pos = presets[link["position"]];

                else if (link["position"] instanceof Vector2D)
                    pos = link["position"];

                else if (link["position"].length && link["position"].length == 2)
                    pos = new Vector2D(link["position"][0], link["position"][1]);

                if (pos) {
                    pos = pos.multiply(this.radius + other.radius);
                    other.translate(pos.x, pos.y);
                }
                other.reposition();
            }
        }
    };

    $(document).on("pageload", function () {
        methane = new Module(Modules.methane);
        formaldehyde = new Module(Modules.formaldehyde);
    });
});
});
