function factorial(n) {
    return n==1?1:factorial(n-1)*n;
}
Calc = {
    degrees: false,
    statusLog: [],
    statusCurr: null,
    shift: false,
    mouse: false,
    enterPressed: false,
    numbers: [],
    cfunc: "",
    init: function () {
        Calc.numbers = [];
        Calc.cfunc = "";
        Calc.update("", true);
    },
    shorten: function (num) {
        num = num.toString();
        while (num.length > 14) {
            if (num.search("e") != -1) {
                var nums = num.split("e");
                num = nums[0].substring(0, nums[0].length-1) + "e" + nums[1];
            } else num = num.substring(0, num.length-1);
        }
        return num;
    },
    update: function (string, fsh) {
        fsh == undefined ? false : fsh;
        string = Calc.shorten(string);
        Calc.string = string;
        Calc.working = string;
        if (string.toString() == "NaN") Calc.update("Math Error", true);
        else $("#calc-out span").html(string);
        Calc.fshown = fsh;
        return string;
    },
    digit: function (digit) {
        if (Calc.fshown) Calc.update(digit.toString(), false);
        else Calc.update(Calc.string.toString() + digit.toString());
    },
    args: function (f) {
        var binary = ["+","-","*","/","^"],
            unary = ["sqrt","cbrt","squared","cubed","tento","sin","cos","tan","asin","acos","atan","ln","rint","exp","factorial"];
        if (binary.indexOf(f) != -1) return 2;
        else if (unary.indexOf(f) != -1) return 1;
        else return 0;
    },
    sign: function () {
        if (!isNull(Calc.working)) Calc.update(-parseFloat(Calc.working));
        else return null;
    },
    func: function (f) {
        if (f == "=") {
            Calc.numbers.push(Calc.working);
            Calc.update(Calc.compute(Calc.cfunc).toString(), true);
            Calc.numbers = [];
            Calc.cfunc = "";
        } else if (!isNull(Calc.working)) {
            var args = Calc.args(f);
            if (args > Calc.numbers.length && !Calc.fshown) Calc.numbers.push(Calc.working);
            else Calc.numbers[0] = Calc.working;
            if (args <= Calc.numbers.length) Calc.numbers = [Calc.compute(args>1?Calc.cfunc:f)];
            if (args > Calc.numbers.length) {
                Calc.update(f, true);
                Calc.status(Calc.numbers[0].toString()+" "+f, false);
            } else Calc.update(Calc.numbers[0].toString(), true);
            Calc.cfunc = f;
        } else return false;
    }
};
Calc.compute = function (f) {
    var result = 0;
    if (Calc.numbers.length == 0) return false;
    else if (Calc.args(f) == 1 && Calc.numbers.length > 0) with (Math) switch (f) {
        case "sqrt": result = sqrt(Calc.numbers[0]); break;
        case "cbrt": result = pow(Calc.numbers[0], 1/3); break;
        case "squared": result = pow(Calc.numbers[0], 2); break;
        case "cubed": result = pow(Calc.numbers[0], 3); break;
        case "factorial": result = factorial(Calc.numbers[0]); break;
        case "sin": result = Calc.degrees ? sin(dtr(Calc.numbers[0])) : sin(Calc.numbers[0]); break;
        case "cos": result = Calc.degrees ? cos(dtr(Calc.numbers[0])) : cos(Calc.numbers[0]); break;
        case "tan": result = Calc.degrees ? tan(dtr(Calc.numbers[0])) : tan(Calc.numbers[0]); break;
        case "asin": result = Calc.degrees ? rtd(asin(Calc.numbers[0])) : asin(Calc.numbers[0]); break;
        case "acos": result = Calc.degrees ? rtd(acos(Calc.numbers[0])) : acos(Calc.numbers[0]); break;
        case "atan": result = Calc.degrees ? rtd(atan(Calc.numbers[0])) : atan(Calc.numbers[0]); break;
        case "tento": result = pow(10, Calc.numbers[0]); break;
        case "rint": result = randomInt(Calc.numbers[0]); break;
        case "ln": result = log(Calc.numbers[0]); break;
        case "exp": result = pow(E, Calc.numbers[0]); break;
        default: result = 0; break;
    } else if (Calc.args(f) == 2 && Calc.numbers.length > 1) with (Math) switch (f) {
        case "+": result = parseFloat(Calc.numbers[0]) + parseFloat(Calc.numbers[1]); break;
        case "-": result = parseFloat(Calc.numbers[0]) - parseFloat(Calc.numbers[1]); break;
        case "*": result = parseFloat(Calc.numbers[0]) * parseFloat(Calc.numbers[1]); break;
        case "/": result = parseFloat(Calc.numbers[0]) / parseFloat(Calc.numbers[1]); break;
        case "^": result = pow(parseFloat(Calc.numbers[0]), parseFloat(Calc.numbers[1])); break;
        default: result = 0; break;
    } else result = 0;
    result = Calc.shorten(parseFloat(result.fix()));
    if (Calc.args(f) == 1) Calc.status(f+"("+Calc.numbers[0]+") = "+result, true);
    else if (Calc.args(f) == 2) Calc.status(Calc.numbers[0]+" "+f+" "+Calc.numbers[1]+" = "+result, true);
    return result;
}
Calc.status = function (message, store) {
    $("#calc-status span").html(message);
    if (store) {
        Calc.statusLog.push(message);
        Calc.statusCurr = Calc.statusLog.length-1;
    }
}
Calc.shChange = function (shift) {
    if (shift) {
        $(".calc-sh").show();
        $(".calc-nsh").hide();
        for (var i=0;i<$(".calc-scut:not(.final)").length;i++)
            $(".calc-scut:not(.final)")[i].innerHTML = shiftUp($(".calc-scut:not(.final)")[i].innerHTML);
    } else {
        $(".calc-sh").hide();
        $(".calc-nsh").show();
        for (var i=0;i<$(".calc-scut:not(.final)").length;i++)
            $(".calc-scut:not(.final)")[i].innerHTML = shiftDown($(".calc-scut:not(.final)")[i].innerHTML);
    }
    Calc.shift = shift;
}
Calc.scutChange = function (scut) {
    if (scut) $(".calc-scut").show();
    else $(".calc-scut").hide();
}
$(function () {
    Calc.init();
    $(".calcn").click(function () { Calc.digit(parseInt($(this).html())); });
    $("#calc-dot").click(function () { Calc.digit("."); });
    $("#calc-mul").click(function () { Calc.func("*"); });
    $("#calc-add").click(function () { Calc.func("+"); });
    $("#calc-sub").click(function () { Calc.func("-"); });
    $("#calc-div").click(function () { Calc.func("/"); });
    $("#calc-pow").click(function () { Calc.shift ? Calc.func("factorial") : Calc.func("^"); });
    $("#calc-eq").click(function () { Calc.func("="); });
    $("#calc-ac").click(function () { Calc.init(); });
    $("#calc-sqrt").click(function () { Calc.func("sqrt"); });
    $("#calc-pow2").click(function () { Calc.shift ? Calc.func("cubed") : Calc.func("squared"); });
    $("#calc-10pow").click(function () { Calc.shift ? Calc.func("exp") : Calc.func("tento"); });
    $("#calc-sin").click(function () { Calc.shift ? Calc.func("asin") : Calc.func("sin"); });
    $("#calc-cos").click(function () { Calc.shift ? Calc.func("acos") : Calc.func("cos"); });
    $("#calc-tan").click(function () { Calc.shift ? Calc.func("atan") : Calc.func("tan"); });
    $("#calc-ln").click(function () { Calc.func("ln"); });
    $("#calc-pi").click(function () { Calc.shift ? Calc.update(Math.E) : Calc.update(Math.PI); });
    $("#calc-rnd").click(function () { Calc.shift ? Calc.func("rint") : Calc.update(Math.random()); });
    $("#calc-sign").click(function () { Calc.sign(); });
    $("#calc-mode").click(function () { TBI.isToggled(this) ? $(".calc-adv").show() : $(".calc-adv").hide(); });
    $("#calc-deg").click(function () { Calc.degrees = TBI.isToggled(this); });
    $("#calc-shift").click(function () { Calc.shChange(TBI.isToggled(this)); });
    $("#calc-sctg").click(function () { Calc.scutChange(TBI.isToggled(this)); });
    $("#calc-statusp").click(function () { 
        if (Calc.statusCurr-1 < 0) return false;
        else Calc.status(Calc.statusLog[--Calc.statusCurr]);
    });
    $("#calc-statusn").click(function () {
        if (Calc.statusCurr+1 > Calc.statusLog.length-1) return false;
        else Calc.status(Calc.statusLog[++Calc.statusCurr]);
    });
    $("#calculator").mouseenter(function () { Calc.mouse = true; });
    $("#calculator").mouseleave(function () { Calc.mouse = false; });
    $(document).keydown(function (event) {
        if (!Calc.mouse) return true;
        var key = convertKeyDown(event);
        switch (key) {
            case "0":Calc.digit(0);break;case "1":Calc.digit(1);break;case "2":Calc.digit(2);break;case "3":Calc.digit(3);break;
            case "4":Calc.digit(4);break;case "5":Calc.digit(5);break;case "6":Calc.digit(6);break;case "7":Calc.digit(7);break;
            case "8":Calc.digit(8);break;case "9":Calc.digit(9);break;case ".":Calc.digit(".");break;
            case "enter":if (!Calc.enterPressed) { Calc.func("="); Calc.enterPressed = true; }break;
            case "+":Calc.func("+");break;case "-":Calc.func("-");break;case "*":Calc.func("*");break;
            case "/":Calc.func("/");break;
            case "delete":Calc.update(Calc.working.substring(1));break;case "_":Calc.sign();break;case "c":Calc.init();break;
            case "shift":if(!Calc.shift){TBI.toggleButton($("#calc-shift")[0],true);Calc.shChange(true);}break;
            case "a":TBI.toggleButton(gebi("calc-mode"));break;case "A":TBI.toggleButton(gebi("calc-mode"));break;
            case "d":TBI.toggleButton(gebi("calc-deg"));break;case "D":TBI.toggleButton(gebi("calc-deg"));break;
            case "!":Calc.func("factorial");break;case "l":Calc.func("ln");break;
            case "i":Calc.func("squared");break;case "I":Calc.func("cubed");break;case "P":Calc.update(Math.PI);break;
            case "P":Calc.update(Math.E);break;case "x":Calc.func("tento");break;case "X":Calc.func("exp");break;
            case "s":Calc.func("sin");break;case "S":Calc.func("asin");break;case "o":Calc.func("cos");break;
            case "O":Calc.func("acos");break;case "t":Calc.func("tan");break;case "T":Calc.func("atan");break;
            case "n":Calc.update(Math.random());break;case "N":Calc.func("rint");break;case "L":Calc.func("ln");break;
            case "<":TBI.toggleButton(gebi("calc-statusp"));break;case ">":TBI.toggleButton(gebi("calc-statusn"));break;
            case "left":Calc.update(Calc.working.substring(0, Calc.working.length-1));break;case "^":Calc.func("^");break;
            case "right":Calc.update(Calc.working.substring(1));break;case "r":Calc.func("sqrt");break;
            case "R":Calc.func("cbrt");break;case "C":$("#calc-status span").html("");Calc.statusLog=[];Calc.init();break;
            case "backspace":Calc.update(Calc.working.substring(0, Calc.working.length-1));return false;break;
            default:return true;
        }
    });
    $(document).keyup(function (event) {
        if (!Calc.mouse) return true;
        var key = convertKeyDown(event);
        switch (key) {
            case "shift":if(Calc.shift){TBI.toggleButton($("#calc-shift")[0],false);Calc.shChange(false);}break;
            case "enter":if (Calc.enterPressed) Calc.enterPressed = false;
            default:return true;
        }
    });
});
