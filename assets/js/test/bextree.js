function factorial(n) {
    if (n >= 30 || isNaN(n) || n % 1 != 0 || n < 0)
        return NaN;

    var res = 1;
    for (var i=2;i<=n;i++)
        res *= i;
    return res;
}
var solve, ExprNode, start;
start = new Date().getTime();

$(function () {
Require([
    "assets/js/tblib/base.js",
    "assets/js/tblib/util.js",
    "assets/js/tblib/ui.js",
    "assets/js/tblib/loader.js"
], function () {
    loader.start();

    ExprNode = function (v) {
        this.children = [];
        this.value = v;
    };
    ExprNode.prototype = {
        constructor: ExprNode,
        eval: function () {
            if (typeof(this.value) == typeof(1))
                return this.value;

            if (!isNaN(+this.value))
                return +this.value;

            if (this.children.length == 2)
                switch (this.value) {
                    case '+': return this.children[0].eval() + this.children[1].eval();
                    case '-': return this.children[0].eval() - this.children[1].eval();
                    case '*': return this.children[0].eval() * this.children[1].eval();
                    case '/': return this.children[0].eval() / this.children[1].eval();
                    case '^': return Math.pow(this.children[0].eval(), this.children[1].eval());
                    case 'or': return this.children[0].eval() | this.children[1].eval();
                    case 'and': return this.children[0].eval() & this.children[1].eval();
                    case 'xor': return this.children[0].eval() ^ this.children[1].eval();
                    default: throw new Error(this.value + " operator not supported");
                }
            else if (this.children.length == 1)
                switch (this.value) {
                    case '-': return -this.children[0].eval();
                    case '~': return ~this.children[0].eval();
                    case '!': return factorial(this.children[0].eval());
                    case 'sqrt': return Math.sqrt(this.children[0].eval());
                    default: throw new Error(this.value + " operator not supported");
                }
            else return 0;
        },
        toString: function () {
            if (typeof(this.value) == typeof(1))
                return this.value.toString();

            if (!isNaN(+this.value))
                return this.value.toString();

            var b = function (op, x, y) { return "(" + x + " " + op + " " + y + ")"; };

            if (this.children.length == 2)
                return b(this.value, this.children[0].toString(), this.children[1].toString());
            else if (this.children.length == 1)
                switch (this.value) {
                    case '-': return "-" + this.children[0].toString();
                    case '~': return "~" + this.children[0].toString();
                    case '!': return this.children[0].toString() + "!";
                    case 'sqrt': return "sqrt(" + this.children[0].toString() + ")";
                }
            return this.value.toString();
        }
    };

    ExprNode.unary = function (operator, operand) {
        operator = (operator instanceof ExprNode) ? operator : new ExprNode(operator);
        operand = (operand instanceof ExprNode) ? operand : new ExprNode(operand);
        var node = operator;
        node.children = [operand];
        return node;
    };
    ExprNode.binary = function (operator, operand1, operand2) {
        operator = (operator instanceof ExprNode) ? operator : new ExprNode(operator);
        operand1 = (operand1 instanceof ExprNode) ? operand1 : new ExprNode(operand1);
        operand2 = (operand2 instanceof ExprNode) ? operand2 : new ExprNode(operand2);
        var node = operator;
        node.children = [operand1, operand2];
        return node;
    };

    solve = function (input, output, maxTries) {
        maxTries = maxTries || 100000;
        function choice(a) { return a[Math.floor(Math.random()*a.length)]; }
        var unary = ["!", "sqrt"];
        var binary = ["+", "-", "*", "/", "^"];
        var operators = unary.concat(binary);
        var n, rootNode;
        var tries = 0;

        while (tries++ < maxTries && (!rootNode || rootNode.eval() != output)) {

            var stack = input.map(function (a) { return new ExprNode(a); });
            stack.shuffle();
            while (stack.length >= 2) {
                var op = choice(operators);
                if (unary.indexOf(op) != -1)
                    stack.push(ExprNode.unary(op, stack.pop()));
                else
                    stack.push(ExprNode.binary(op, stack.pop(), stack.pop()));

                stack.shuffle();
            }
            rootNode = stack.pop();
        }
        if (tries >= maxTries)
            return null;
        return rootNode;
    };

    function getInputs() {
        var inputField = $(".numbers-input").val();
        if (inputField.length == 0 || inputField.search(/[^, 0-9]/g) != -1) {
            TBI.error("Input numbers invalid. Please enter 1 integer or at least 2 comma-separated integers.");
            return null;
        }

        var hasNaN = false;
        var inputs = inputField.split(/, */).map(function (s) {
            if (isNaN(parseInt(s))) hasNaN = true;
            return parseInt(s);
        });
        if (hasNaN) {
            TBI.error("Input numbers invalid. All values must be valid comma-separated integers.");
            return null;
        }

        return inputs;
    }

    function clearTable() {
        var body = $(".output-table tbody");
        body.empty();
        $(".output-table").hide();
    }

    $(document).on("pageload", function () {
        $(".random-numbers").click(function () {
            var min = parseInt($(".number-input-range-min").val());
            var max = parseInt($(".number-input-range-max").val());
            var n = parseInt($(".number-input-n").val());
            var choices = [];
            for (var i=min;i<=max;i++) choices.push(i);
            choices.shuffle();

            var a = [];
            for (var i=0;i<n;i++)
                a.push(choices.pop());

            $(".numbers-input").val(a.join(", "));

            clearTable();
        });

        $(".clear-table").click(clearTable);

        $(".solve").click(function () {
            var min = parseInt($(".number-output-range-min").val());
            var max = parseInt($(".number-output-range-max").val());

            var inputs = getInputs();
            if (isNull(inputs)) return;

            var body = $(".output-table tbody");
            body.empty();
            for (var i=min;i<=max;i++) {
                var row = document.createElement("tr");

                var result = solve(inputs, i);
                if (isNull(result))
                    $(row).addClass("impossible");

                var outputCell = document.createElement("td");
                    outputCell.innerHTML = i.toString();
                row.appendChild(outputCell);

                var resultCell = document.createElement("td");
                    resultCell.innerHTML = isNull(result) ? "" : result.toString();
                row.appendChild(resultCell);
                body[0].appendChild(row);
            }

            $(".output-table").show();
        });

        $(".check-possibility").click(function () {
            var min = parseInt($(".number-output-range-min").val());
            var max = parseInt($(".number-output-range-max").val());

            var inputs = getInputs();
            if (isNull(inputs)) return;

            $(".possibility-output").text("Please wait...");
            $(".possibility-output").removeClass("flash-red flash-blue");

            setTimeout(function () {

                var impossible = false;
                for (var i=min;i<=max;i++) {
                    var result = solve(inputs, i, 5e5);
                    if (isNull(result)) {
                        impossible = true;
                        break;
                    }
                }

                $(".possibility-output").text(impossible
                    ? "This combination is impossible."
                    : "This combination is possible."
                );
                $(".possibility-output").addClass(impossible
                    ? "flash-red"
                    : "flash-blue"
                );
            }, 1000);
        });
    });
});
});
