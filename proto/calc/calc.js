Calc = {};
Calc.nanRegex = /[^0-9\.-]/;
Calc.funcRegex = /[\+\-\*\/(pow)]/;
Calc.functions = ["+","-","*","/","sqrt","sin","cos","tan","pow","x^2","x^3","10^x","rint"];
Calc.numbers = [];
Calc.statusLog = [];
Calc.string = "_";
Calc.workingNum = "";
Calc.currentFunc = 0;
Calc.inputMode = 0;
Calc.mode = 0;
Calc.answerShown = false;
Calc.funcShown = false;
Calc.shift = false;
Calc.answer;
Calc.prevNum;

Calc.setUp = function () {
    timerSet("calcwindow",1000,function () {
        if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)")
            $($("#calcwindow span")[0]).css("color", "#3AACFF");
        else
            $($("#calcwindow span")[0]).css("color", "transparent");
    });
    timerSet("calcstring",4,function () {
        if (Calc.inputMode)
            $($("#calcwindow input")[0]).val(Calc.string);
        else
            $($("#calcwindow span")[0]).html(Calc.string.toString());
        if (Calc.statusLog.length > 20)
            Calc.statusLog.shift();
    });
    timerSet("calcstatuswindow",1000,function () {
        if ($($("#calcstatus span")[0]).css("color")=="rgba(0, 0, 0, 0)")
            $($("#calcstatus span")[0]).css("color", "#3AACFF");
        else
            $($("#calcstatus span")[0]).css("color", "transparent");
    });
    $("#calcplus").click(function () { Calc.runFunction("+") });
    $("#calcminus").click(function () { Calc.runFunction("-") });
    $("#calctimes").click(function () { Calc.runFunction("*") });
    $("#calcdivide").click(function () { Calc.runFunction("/") });
    $("#calcsqrt").click(function () { Calc.runFunction("sqrt") });
    $("#calccos").click(function () { Calc.runFunction("cos") });
    $("#calctan").click(function () { Calc.runFunction("tan") });
    $("#calcsin").click(function () { Calc.runFunction("sin") });
    $("#calcpower").click(function () { Calc.runFunction("pow") });
    $("#calcpower2").click(function () { Calc.runFunction("x^2") });
    $("#calcpower3").click(function () { Calc.runFunction("x^3") });
    $("#calc10power").click(function () { Calc.runFunction("10^x") });
    $("#calcrandint").click(function () { Calc.runFunction("rint") });
    for (i=0;i<$(".calcnum").length;i++) {
        $($(".calcnum")[i]).click(function () { Calc.addDigit($(this).text()) });
    }
    $("#calcdot").click(function () { 
        if (Calc.workingNum.indexOf(".")==-1)
            Calc.addDigit(".");
     });
    $("#calcconstpi").click(function () { 
        Calc.string = "";
        Calc.workingNum = "";
        Calc.addDigit(Math.PI.toString());
    });
    $("#calcconste").click(function () { 
        Calc.string = "";
        Calc.workingNum = "";
        Calc.addDigit(Math.E.toString());
    });
    $("#calcrand").click(function () {
        Calc.string = "";
        Calc.workingNum = "";
        Calc.addDigit(Math.random());
    });
    $("#calcequals").click(function () {
        if (!isNull(Calc.workingNum) && !isNaN(Calc.workingNum))
            Calc.numbers.push(parseFloat(Calc.workingNum));
        Calc.equate(isNull(Calc.workingNum));
    });
    $("#calcinput").click(function () {
        if (Calc.inputMode == 1) {
            $($("#calcwindow span")[0]).show();
            $($("#calcwindow input")[0]).hide();
            Calc.inputMode = 0;
            this.innerText = "Keyboard Input";
            if (Calc.string == "") {
                Calc.string = "_";
                timerSet("calcwindow",1000,function () {
                    if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)")
                        $($("#calcwindow span")[0]).css("color", "#3AACFF");
                    else
                        $($("#calcwindow span")[0]).css("color", "transparent");
                });
            }
        } else {
            timerClear("calcwindow");
            $($("#calcwindow span")[0]).hide();
            $($("#calcwindow input")[0]).show();
            Calc.inputMode = 1;
            if (Calc.string == "_") Calc.string = "";
            this.innerText = "Button Input";
        }
    });
    $("#calcbackspace").click(function () {
        if (!isNull(Calc.string)) {
            Calc.string = shorten(Calc.string.toString(), Calc.string.toString().length-1);
            Calc.workingNum = Calc.string;
        }
    });
    $("#calcdelete").click(function () {
        if (!isNull(Calc.string)) {
            var stringArr = Calc.string.toString().split("");
            stringArr.shift();
            Calc.string = stringArr.join("");
            Calc.workingNum = Calc.string;
        }
    });
    $($("#calcwindow input")[0]).keydown(function (event) {
        Calc.handleKeyDown(event);
    });
    $("#calcclear").click(function () {
        Calc.workingNum = "";
        Calc.string = "";
        Calc.answerShown = false;
    });
    $("#calcallclear").click(function () {
        Calc.workingNum = "";
        Calc.numbers = [];
        if (!Calc.inputMode && isNull(calcwindow_timer)) { 
            Calc.string = "_";
            timerSet("calcwindow",1000,function () {
                if ($($("#calcwindow span")[0]).css("color")=="rgba(0, 0, 0, 0)") {
                    $($("#calcwindow span")[0]).css("color", "#3AACFF");
                } else {
                    $($("#calcwindow span")[0]).css("color", "transparent");
                }
            });
        }
        Calc.prevNum = null;
        Calc.answerShown = false;
    });
    $("#calcsign").click(function () {
        if (Calc.answerShown) {
            Calc.workingNum = "";
            Calc.string = "";
            Calc.numbers = [];
            Calc.prevNum = "";
            Calc.answerShown = false;
        }
        if (!isNull(Calc.string)&&!isNaN(Calc.string)) {
            var newStringArr = [];
            var oldString = Calc.string.toString().split("");
            if (oldString[0] != "-") {
                newStringArr.push("-");
                for (i=0;i<oldString.length;i++) {
                    newStringArr.push(oldString[i]);
                }
            } else {
                for (i=1;i<oldString.length;i++) {
                    newStringArr.push(oldString[i]);
                }
            }
            Calc.string = newStringArr.join("");
            Calc.workingNum = Calc.string;
            Calc.prevNum = "";
            
        }
    });
    $("#calcmode").click(function () {
        Calc.mode = !Calc.mode;
        if (Calc.mode)
            $(".calcadvonly").show();
        else
            $(".calcadvonly").hide();
    });
    $("#calcshift").click(function () { Calc.shift = !Calc.shift });
    $("#calcpop").click(function () {
        
    });
}
Calc.equate = function (bool) {
    if (bool == undefined) bool = false;
    if (Calc.numbers.length > 1 || (Calc.numbers.length == 1 && bool)) {
        if (bool && !isNull(Calc.prevNum))
            var secondNum = Calc.prevNum;
        else
            var secondNum = Calc.numbers[1];
        switch (Calc.currentFunc) {
            case (Calc.functions.indexOf("+")):
                Calc.answer = Calc.numbers[0]+secondNum;
                break;
            case (Calc.functions.indexOf("-")):
                Calc.answer = Calc.numbers[0]-secondNum;
                break;
            case (Calc.functions.indexOf("*")):
                Calc.answer = Calc.numbers[0]*secondNum;
                break;
            case (Calc.functions.indexOf("/")):
                Calc.answer = Calc.numbers[0]/secondNum;
                break;
            case (Calc.functions.indexOf("pow")):
                Calc.answer = Math.pow(Calc.numbers[0], secondNum);
                break;
            default:
                Calc.answer = Calc.numbers[0];
        }
        if (Calc.answer.toString().length>16) {
            Calc.answer = parseFloat(shorten((Calc.answer+0.00000000000001).toString(),16));
        }
        var firstNum = Calc.numbers[0];
        Calc.string = Calc.answer;
        Calc.workingNum = "";
        Calc.prevNum = secondNum;
        Calc.numbers = [Calc.answer];
        Calc.answerShown = true;
        Calc.statusPrint(firstNum+" "+Calc.functions[Calc.currentFunc]+" "+secondNum+" = "+Calc.answer);
    } else if (Calc.functions[Calc.currentFunc].search(Calc.funcRegex)==-1) {
        if (isNull(Calc.prevNum))
            var prevNum = Calc.numbers[0];
        else
            var prevNum = Calc.prevNum;
        switch (Calc.currentFunc) {
            case (Calc.functions.indexOf("sqrt")):
                Calc.answer = Math.sqrt(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("sin")):
                Calc.answer = Math.sin(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("tan")):
                Calc.answer = Math.tan(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("cos")):
                Calc.answer = Math.cos(Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("x^2")):
                Calc.answer = Math.pow(Calc.numbers[0], 2);
                break;
            case (Calc.functions.indexOf("x^3")):
                Calc.answer = Math.pow(Calc.numbers[0], 3);
                break;
            case (Calc.functions.indexOf("10^x")):
                Calc.answer = Math.pow(10, Calc.numbers[0]);
                break;
            case (Calc.functions.indexOf("rint")):
                Calc.answer = randomInt(prevNum);
                break;
            default:
                Calc.answer = Calc.numbers[0];
        }
        if (Calc.answer.toString().length>14) {
            Calc.answer = parseFloat(shorten((Calc.answer+0.000000000001).toString(),13));
        }
        var firstNum = Calc.numbers[0];
        Calc.string = Calc.answer;
        Calc.workingNum = "";
        Calc.numbers = [Calc.answer];
        Calc.answerShown = true;
        Calc.statusPrint(Calc.functions[Calc.currentFunc]+"("+firstNum+") = "+Calc.answer);
        if (isNull(Calc.prevNum))
            Calc.prevNum = Calc.numbers[0]
        else
            Calc.prevNum = prevNum;
    }
}
Calc.runFunction = function (funcStr) {
    if (Calc.string.toString().search(Calc.nanRegex)==-1) {
        Calc.currentFunc = Calc.functions.indexOf(funcStr);
        if (!isNull(Calc.workingNum) && !isNaN(Calc.workingNum)) {
            Calc.numbers.push(parseFloat(Calc.workingNum));
            if (funcStr.search(Calc.funcRegex)!=-1)
                Calc.statusPrint(Calc.workingNum+" "+funcStr);
            else
                Calc.statusPrint(funcStr+"("+Calc.workingNum+")");
        }
        Calc.string = funcStr;
        Calc.workingNum = "";
        Calc.answerShown = false;
        if (!(Calc.inputMode&&Calc.answerShown))
            Calc.equate();
        else {
            Calc.string = "";
            Calc.workingNum = "";
        }
        Calc.funcShown = true;
    }
};
Calc.handleKeyDown = function (event) {
    var character = convertKeyDown(event);
    if (!isNull(Calc.string)&&Calc.string.toString().search(Calc.nanRegex)!=-1)
        Calc.string = "";
    if (event.which==8 && !isNull(Calc.string)) {
        Calc.string = shorten(Calc.string, Calc.string.length-1);
        Calc.workingNum = Calc.string;
    } else if (event.which==46 && !isNull(Calc.string)) {
        var stringArr = Calc.string.toString().split("");
        stringArr.shift();
        Calc.string = stringArr.join("");
        Calc.workingNum = Calc.string;
    }
    if (!isNaN(character)&&!isNull(character)) {
            if (Calc.answerShown) {
                Calc.workingNum = "";
                Calc.string = "";
                Calc.numbers = [];
                Calc.prevNum = "";
                Calc.answerShown = false;
            }
            Calc.string+=character;
            if (isNull(Calc.workingNum))
                Calc.workingNum = Calc.string;
            else
                Calc.workingNum+=character;
    } else if (Calc.functions.indexOf(character)!=-1) {
        Calc.runFunction(character);
    } else if (character == ".") {
        Calc.workingNum += ".";
        Calc.string += ".";
    } else if (event.which == 13) {
        if (!isNull(Calc.workingNum) && !isNaN(Calc.workingNum)) {
            Calc.numbers.push(parseFloat(Calc.workingNum));
        }
        Calc.equate(isNull(Calc.workingNum));
    }
}
Calc.addDigit = function (digit) {
    var calcWindow = $($("#calcwindow span")[0]);
    if (calcWindow.text().search(Calc.nanRegex)!=-1) {
        timerClear("calcwindow");
        $($("#calcwindow span")[0]).css("color", "#3AACFF");
        Calc.string = "";
    }
    if (Calc.answerShown) {
        Calc.workingNum = "";
        Calc.string = "";
        Calc.prevNum = "";
        Calc.answerShown = false;
    } else if (Calc.funcShown) {
        Calc.workingNum = "";
        Calc.string = "";
        Calc.funcShown = false;
        Calc.prevNum = "";
    }
    Calc.string+=digit;
    if (isNull(Calc.workingNum))
        Calc.workingNum = Calc.string;
    else
        Calc.workingNum+=digit;
}
Calc.statusPrint = function (message) {
    timerClear("calcstatuswindow");
    $($("#calcstatus span")[0]).html(message);
    $($("#calcstatus span")[0]).css("color","#3AACFF");
    timerClear("statusReset");
    timerSet("statusReset",10000,function () {
        $($("#calcstatus span")[0]).html("_");
        timerClear("statusReset");
        timerSet("calcstatuswindow",1000,function () {
            if ($($("#calcstatus span")[0]).css("color")=="rgba(0, 0, 0, 0)")
                $($("#calcstatus span")[0]).css("color", "#3AACFF");
            else
                $($("#calcstatus span")[0]).css("color", "transparent");
        });
    });
    Calc.statusLog.push(message);
}
$(function () {
    Calc.setUp();
});