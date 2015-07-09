var game;
var debugData = {velocity:[],position:[]};
var isLogging = false;
var startTime = new Date().getTime();
function startLogging() {
    debugData = {velocity:[], position:[]};
    startTime = new Date().getTime();
    isLogging = true;
}
function stopLogging() {
    isLogging = false;
    return btoa(debugData.toString());
}
$(function () {
var ns = "assets/js/tblib/";
Require([ns+"base.js", ns+"util.js", ns+"loader.js", ns+"math.js"], function () {
    function RepeatedAction(interval) {
        this.interval = interval || 1000;

        this.lastTime = -1;
        this.try = function () {
            if (this.lastTime + interval < new Date().getTime()) {
                this.lastTime = new Date().getTime();
                return true;
            }
            return false;
        }
    }

    var KeyStates = new Enum("released", "pressed", "held");

    function KeyHandler() {
        this.keys = {};
        for (var prop in Keys) this.keys[prop] = KeyStates.released;

        $(document).on("keydown", function (h) { return function (e) {
            h.keys[e.which] = KeyStates.pressed;
        }; }(this));
        $(document).on("keyup", function (h) { return function (e) {
            h.keys[e.which] = KeyStates.released;
        }; }(this));

        this.keyIsPressed = function (key) {
            var isPressed = this.keys[key] == KeyStates.pressed;
            return isPressed;
        };
    }

    function SlackHandler(interval, number, master) {
        this.master = master;
        this.elements = [];
        for (var i=0;i<number;i++) {
            var el = document.createElement(this.master.nodeName);
            el.className = this.master.className + " slack";
            this.master.parentElement.appendChild(el);
            this.elements.push(el);
        }
        this.curr = 0;
        this.action = new RepeatedAction(interval);
        this.apply = function (updateFunc) {
            if (this.action.try()) {
                var el = this.elements[this.curr];
                updateFunc(el, this.master);
                this.curr = (this.curr + 1) % this.elements.length;
            }
        }
    }

    function PongGamePlayer(game, paddle, scoreElement) {
        this.game = game;
        this.paddle = paddle;
        this.speed = 0;
        this.acceleration = 0;
        this.startTime = new Date().getTime();

        this.score = 0;
        this.scoreElement = scoreElement;

        this.scoreGoal = function () {
            this.score += this.game.settings.game.pointsPerGoal;

            if (this.score >= this.game.settings.game.maxPoints)
                this.winRound();
        }

        this.winRound = function () {
            var winsEl = $(this.scoreElement).find(".wins")[0];

            var newWin = document.createElement("div");
            newWin.className = "win";
            winsEl.appendChild(newWin);
            
            this.game.reset();
        }

        this.slackHandler = new SlackHandler(
            this.game.settings.fx.slackInterval,
            this.game.settings.fx.slackNumber,
            this.paddle
        );

        Object.defineProperty(this, "maxOffset", {
            get: function () {
                var paddleHeight = parseInt(this.paddle.getStyle("height"));
                var fieldHeight = parseInt(this.game.field.getStyle("height"));

                return fieldHeight - paddleHeight;
            }
        });

        Object.defineProperty(this, "position", {
            get: function () {
                return parseInt(this.paddle.getStyle("top")) / this.maxOffset;
            }, set: function (value) {
                this.paddle.style.top = (value * this.maxOffset) + "px";
            }
        });

        this.move = function () {
            var orig = this.position + this.speed;
            var dest = Math.bound(orig, 0, 1);
            this.position = dest;
        };

        this.animate = function (delta) {
            var set = this.game.settings.physics;

            this.move();

            if (this.speed != 0) {
                var dir = Math.sign(this.speed);

                this.speed = Math.bound(this.speed - (set.friction * delta * dir),
                                        this.speed > 0 ? 0 : undefined,
                                        this.speed > 0 ? undefined : 0);
            }

            this.slackHandler.apply(function (e, m) {
                e.style.top = m.style.top;
            });

            var inner = $(this.scoreElement).find(".score-inner")[0];

            if (parseInt(inner.textContent) != this.score) {
                inner.textContent = this.score;
                $(inner).toggleClass("just-scored", true);
            } else if ($(inner).hasClass("just-scored"))
                $(inner).toggleClass("just-scored", false);
        };

        this.reset = function () {
            this.score = 0;
            this.position = 0;
        }
        this.reset();
    }

    function PhysicsRectangle(element, offset) {
        offset = offset || Vector2D.zero;
        this.element = element;
        var topLeft = $(element).offset();
        this.topLeft = new Vector2D(topLeft.left, topLeft.top).add(offset);
        this.width = parseInt(element.getStyle("width"));
        this.height = parseInt(element.getStyle("height"));
        this.dims = new Vector2D(this.width, this.height);
        this.halfWidth = new Vector2D(this.width/2, 0);
        this.halfHeight = new Vector2D(0, this.height/2);
        this.middle = this.topLeft.add(this.halfWidth).add(this.halfHeight);
        this.bottomRight = this.topLeft.add(this.dims);

        this.testForCollision = function (other) {
            var axes = [
                new Vector2D(1, 0),
                new Vector2D(0, 1)
            ];
            var results = [];

            var localHalves = [this.halfWidth, this.halfHeight];
            var otherHalves = [other.halfWidth, other.halfHeight];
            var displacement = other.middle.subtract(this.middle);

            for (var i=0;i<axes.length;i++) {
                var axis = axes[i];

                var dispProjected = displacement.project(axis).magnitude();
                dispProjected -= localHalves[i].project(axis).magnitude();
                dispProjected -= otherHalves[i].project(axis).magnitude();

                var dir = Math.sign(displacement.dot(axis));
                if (dir == 0) dir = 1;

                if (dispProjected < 0)
                    results.push(-dispProjected * dir);
                else break;
            }

            if (results.length == axes.length) {
                var minIndex = 0,
                    minValue =
                results.reduce(function (a, b, k) {
                    if (Math.abs(b) < Math.abs(a)) minIndex = k;
                    return Math.abs(b) < Math.abs(a) ? b : a;
                });

                var collisionVec = axes[minIndex].multiply(minValue);
                return collisionVec;
            } else return null;
        }
    }

    function PongGameBall(game, ball) {
        this.game = game;
        this.ball = ball;
        this.speed = Vector2D.zero;

        this.slackHandler = new SlackHandler(
            this.game.settings.fx.slackInterval,
            this.game.settings.fx.slackNumber,
            this.ball
        );

        Object.defineProperty(this, "maxOffset", {
            get: function () {
                var ballDims = new Vector2D(
                    parseInt(this.ball.getStyle("width")),
                    parseInt(this.ball.getStyle("height"))
                );
                var fieldDims = new Vector2D(
                    parseInt(this.game.field.getStyle("width")),
                    parseInt(this.game.field.getStyle("height"))
                );

                return fieldDims.subtract(ballDims);
            }
        })

        Object.defineProperty(this, "position", {
            get: function () {
                return new Vector2D(
                    parseInt(this.ball.getStyle("left")),
                    parseInt(this.ball.getStyle("top"))
                );
            }, set: function (value) {
                var val = value;

                this.ball.style.top = val.y + "px";
                this.ball.style.left = val.x + "px";
            }
        });

        this.move = function (delta) {
            var off = this.maxOffset;
            var orig = this.position.add(this.speed.multiply(delta));
            var dest = orig.clamp(off.negate(), off);

            this.position = dest;
            return dest;
        }

        this.animate = function (delta) {
            var set = this.game.settings.physics;
            var bset = this.game.settings.ball;

            var dest = this.position.add(this.speed.multiply(delta)).fix(set.precision);
            var spd = this.speed;
            var nml = new Vector2D(0, 0);
            var maxOffset = this.maxOffset;

            if (Math.bound(dest.x, -maxOffset.x, maxOffset.x) != dest.x) {
                if (dest.x < 0) this.game.players[1].scoreGoal();
                else if (dest.x > 0) this.game.players[0].scoreGoal();

                this.position = Vector2D.zero;
                this.speed = Vector2D.fromPolar(bset.startingSpeed.angle(), this.speed.magnitude());
                return;
            }

            if (dest.y > maxOffset.y) nml.x = -1;
            else if (dest.y < -maxOffset.y) nml.x = 1;

            if (!nml.equals(Vector2D.zero)) {
                var mag = spd.magnitude();
                spd = spd.normalise().reflect(nml.normalise()).multiply(mag);
            }

            var bars = this.game.players.map(function (p) { return p.paddle; });

            var physBall = new PhysicsRectangle(this.ball);
            var foreignHalves = [physBall.halfWidth, physBall.halfHeight];
            var axes = [
                new Vector2D(1, 0),
                new Vector2D(0, 1)
            ];

            var poschange = Vector2D.zero;

            bars.forEach(function (ball) { return function (e, i, a) {
                var physBar = new PhysicsRectangle(e);

                var collisionVec = physBar.testForCollision(physBall);

                if (!isNull(collisionVec)) {
                    var normal = collisionVec.copy().normalise(); // vector normal to the collision surface
                    var mag = spd.magnitude() + bset.difficultyAcceleration; // magnitude of the result vector (with added difficulty)
                    var angle = normal.angle() + (Math.random()*bset.bounceVariance*2 - bset.bounceVariance); // angle of incidence (with random variation)

                    poschange = poschange.add(collisionVec); // change in position
                    spd = spd.normalise().reflect(normal).negate().multiply(mag); // reflect ball incidence vector, aka speed (negative just b/c)
                }
            }; }(this));

            this.position = this.position.add(poschange);

            this.speed = spd;

            this.move(delta);

            this.slackHandler.apply(function (e, m) {
                e.style.top = m.style.top;
                e.style.left = m.style.left;
            });
        }

        this.reset = function () {
            this.position = new Vector2D(0, 0);
            this.speed = this.game.settings.ball.startingSpeed.copy();
        }
        this.reset();
    }


    function PongGame(field, ui) {
        this.field = field;
        this.ui = ui;
        this.keyHandler = new KeyHandler();

        this.players = [];
        this.players.push(new PongGamePlayer(this,
            $(this.field).find(".left-paddle")[0],
            $(this.ui).find(".left-score")[0]));
        this.players.push(new PongGamePlayer(this,
            $(this.field).find(".right-paddle")[0],
            $(this.ui).find(".right-score")[0]));

        this.ball = new PongGameBall(this, $(this.field).find(".ball")[0]);
        this.loop();
    }
    PongGame.prototype = {
        constructor: PongGame,
        prevTime: -1,
        settings: {
            physics: {
                precision: 6,
                friction: 0.08
            },
            input: {
                keyAcceleration: 0.1,
                bindings: {
                    player1: {
                        up: Keys.W,
                        down: Keys.S
                    },
                    player2: {
                        up: Keys.UP,
                        down: Keys.DOWN
                    }
                }
            },
            ball: {
                bounceVariance: 0,
                startingSpeed: Vector2D.fromPolar(dtr(45), 875),
                difficultyAcceleration: 45
            },
            game: {
                maxPoints: 10,
                pointsPerGoal: 1
            },
            fx: {
                slackNumber: 10,
                slackInterval: 10
            }
        },
        paused: false,
        loop: function () {
            var frame = requestAnimationFrame(function (g) {
                return function () { g.loop(); }
            }(this));


            var currTime = new Date().getTime();
            if (!this.paused) {
                if (this.prevTime == -1) this.prevTime = currTime;
                var delta = (new Date().getTime() - this.prevTime) / 1000;

                this.animate(delta);
            } else {

            }
            this.prevTime = currTime;
        },
        animate: function (delta) {
            var set = this.settings.input;

            if (this.keyHandler.keyIsPressed(set.bindings.player1.up))
                this.players[0].speed += -set.keyAcceleration * delta;
            else if (this.keyHandler.keyIsPressed(set.bindings.player1.down))
                this.players[0].speed += set.keyAcceleration * delta;

            if (this.keyHandler.keyIsPressed(set.bindings.player2.up))
                this.players[1].speed += -set.keyAcceleration * delta;
            else if (this.keyHandler.keyIsPressed(set.bindings.player2.down))
                this.players[1].speed += set.keyAcceleration * delta;

            this.ball.animate(delta);
            this.players.forEach(function (e) { e.animate(delta); });
        },
        reset: function () {
            this.players.forEach(function (e) { e.reset(); });
            this.ball.reset();
        }
    }

    loader.start();
    $(document).on("pageload", function () {
        game = new PongGame($(".playing-field")[0], $(".top-ui")[0]);
    });
});
});
