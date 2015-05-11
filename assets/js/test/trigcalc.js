function calculate(a, b, c, o, x, y, z) {
    console.log(a+": "+x);
    console.log(b+": "+y);
    console.log(c+": "+z);
    if (a > b) { var t1 = a, t2 = x; a = b; x = y; b = t1; y = t2; }
    if (b > c) { var t1 = b, t2 = y; b = c; y = z; c = t1; z = t2; }
    if (a > b) { var t1 = a, t2 = x; a = b; x = y; b = t1; y = t2; }
    console.log(a+": "+x);
    console.log(b+": "+y);
    console.log(c+": "+z);

    with (Math) switch (a) {
        case "A": switch (b) {
            case "B": if (o == "C") return PI - x - y;
            switch (c) {
                case "a": switch (o) {
                    case "b": return z*sin(y)/sin(x);
                    case "c": return z*sin(PI - x - y)/sin(x);
                }; break;
                case "b": switch (o) {
                    case "a": return z*sin(x)/sin(y);
                    case "c": return z*sin(PI - x - y)/sin(y);
                }; break;
                case "c": switch (o) {
                    case "a": return z*sin(x)/sin(PI - x - y);
                    case "b": return z*sin(y)/sin(PI - x - y);
                }; break;
            }; break;
            case "C": if (o == "B") return PI - x - y;
            switch (c) {
                case "a": switch (o) {
                    case "b": z*sin(PI - x - y)/sin(x);
                    case "c": z*sin(y)/sin(x);
                }; break;
                case "b": switch (o) {
                    case "a": z*sin(x)/sin(PI - x - y);
                    case "c": z*sin(y)/sin(PI - x - y);
                }; break;
                case "c": switch (o) {
                    case "a": z*sin(x)/sin(y);
                    case "b": z*sin(PI - x - y)/sin(y);
                }; break;
            } break;
            case "a": switch (c) {
                case "b": switch (o) {
                    case "B": return asin(z*sin(x)/y);
                    case "C": return PI - x - asin(z*sin(x)/y);
                    case "c": return y*sin(PI - x - asin(z*sin(x)/y));
                }; break;
                case "c": switch (o) {
                    case "B": return PI - x - asin();
                }
            }; break;
            case "b": switch (c) {

            }; break;
        }; break;
        case "B": switch (b) {
            case "C": if (o == "A") return PI - x - y;
            switch (c) {
                case "a": switch (o) {
                    case "A": 
                    case "b":
                    case "c":
                }; break;
            }; break;
        }; break;
        case "C": switch (b) {

        }; break;
        case "a": switch (b) {

        }; break;
    }
}

$(function () {
var ns = function (n) { return "assets/js/tblib/"+n+".js"; };
Require([ns("base"), ns("util"), ns("loader"), ns("math")], function () {
    loader.start();
    $(document).on("pageload", function () {
        calculate("b", "C", "A", "a", 3, 30, 1);
    });
});
});
