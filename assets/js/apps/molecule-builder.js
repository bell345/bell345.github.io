var methane;
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
                above: new Vector2D(0, -80),
                below: new Vector2D(0, 80),
                left: new Vector2D(-80, 0),
                right: new Vector2D(80, 0)
            }
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
        ]
    };

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

        this.root.appendChild(roots[0].svg);
        roots[0].reposition();
    }

    function Atom(symbol) {
        this.symbol = symbol;
        this.svg = document.createElementNS(SVGNS, "g");
        this.svg.setAttribute("class", "atom atom-"+symbol.toLowerCase());
        this.$ = new SVGHelper(this.svg);

        this.$.circle(50, new Vector2D(50, 50));
        this.$.write(this.symbol, new Vector2D(50, 50));

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

                if (presets[link["position"]]) {
                    var pos = presets[link["position"]];
                    link["with"].translate(pos.x, pos.y);

                } else if (link["position"] instanceof Vector2D) {
                    var pos = link["position"];
                    link["with"].translate(pos.x, pos.y);

                } else if (link["position"].length && link["position"].length == 2) {
                    link["with"].translate(link["position"][0], link["position"][1]);
                }
                link["with"].reposition();
            }
        }
    };

    $(document).on("pageload", function () {
        methane = new Module(Modules.methane);
    });
});
});
