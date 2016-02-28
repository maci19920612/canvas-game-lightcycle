var KEYS = {
    LEFT: 37,
    TOP: 38,
    RIGHT: 39,
    DOWN: 40,
    A: 65,
    S: 83,
    D: 68,
    W: 87,
    SPACE: 32,
    ALT: 18
};

var DIRECTIONS = {
    TOP: {x: 0, y: -1},
    LEFT: {x: -1, y: 0},
    DOWN: {x: 0, y: 1},
    RIGHT: {x: 1, y: 0}
};
var RECT_SIZE = 5;

var canvas = document.getElementById("game");

function Point(x, y) {
    this.x = x;
    this.y = y;
    this.equals = function (otherPoint) {
        if (!(otherPoint instanceof Point)) {
            return false;
        }
        return this.x == otherPoint.x && this.y == otherPoint.y;
    }
}

function Player(_keyControlls, _otherKeys) {
    var keyController = null;
    if (typeof _keyControlls != "undefined" && _keyControlls != null) {
        keyController = new KeyController(_keyControlls, _otherKeys);
    }


    this.position = new Point(100, 100);
    this.direction = DIRECTIONS.DOWN;
    this.speed = 1;
    this.tail = [];
    this.length = 40;
    this.moving = true;
    this.color = "#000000";
    this.update = function (key) {
        if (this.moving) {

            for (var i = 0; i < this.speed; i++) {
                this.tail.push(
                    new Point(this.position.x + i * this.direction.x * RECT_SIZE, this.position.y + i * this.direction.y * RECT_SIZE)
                );
            }

            var tailLength = this.tail.length;
            for (var i = 0; i < tailLength - this.length; i++) {
                this.tail.shift();
            }

            this.position.x += this.direction.x * RECT_SIZE * this.speed;
            this.position.y += this.direction.y * RECT_SIZE * this.speed;

            if (this.position.x < 0) {
                this.position.x = this.position.x + canvas.width;
            } else if (this.position.x > canvas.width) {
                this.position.x = this.position.x - canvas.width;
            }

            if (this.position.y < 0) {
                this.position.y = canvas.height + this.position.y;
            } else if (this.position.y > canvas.height) {
                this.position.y = this.position.y - canvas.height;
            }
        }
        if (keyController != null && keyController.keyPress) {
            keyController.keyPress(this, key);
        }

    }
    this.draw = function (ctx) {
        if (this.moving) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x, this.position.y, RECT_SIZE, RECT_SIZE);
            var tail = this.tail;
            for (var i = 0; i < tail.length; i++) {
                ctx.fillRect(tail[i].x, tail[i].y, RECT_SIZE, RECT_SIZE);
            }
        }
    }
    this.collide = function () {
        this.moving = false;
        this.clearTail();
    }
    this.tailCollideOtherPlayer = function (collidedPlayer) {
        if (this != collidedPlayer) {
            scoreController.addScore(this);
        }
    }

    this.clearTail = function () {
        this.tail = [];
    }

}

function KeyController(directionsByKey, otherKeys) {
    this.keyPress = function (controller, keyDown) {
        if (!controller.direction) {
            return;
        }

        var pressed = -1;
        for (var key in directionsByKey) {
            if (keyDown(key)) {
                pressed = key;
                break;
            }
        }
        if (pressed != -1 && !(directionsByKey[key].x + controller.direction.x == 0 && directionsByKey[key].y + controller.direction.y == 0)) {
            controller.direction = directionsByKey[key];
        }
        if (typeof otherKeys != "undefined") {
            otherKeys.forEach(function (v) {
                if (keyDown(v[0])) {
                    v[1](controller);
                }

            });
        }
    }
}

function CanvasController(c) {
    //TODO: Optimalizálni kell
    var controllers = [];
    var ctx = c.getContext("2d");
    var canvas = c;
    var interval = null;
    var intervalTimeout = 16;
    var keyDowns = {};
    var self = this;

    document.body.onkeydown = function (e) {
        keyDowns[e.which] = true;
    };
    document.body.onkeyup = function (e) {
        keyDowns[e.which] = false;
    };
    var loop = function () {
        for (var i = 0; i < controllers.length; i++) {
            if (controllers[i].update) {
                controllers[i].update(self.keyDownProvider);
            }

            collusionTest : {
                for (var i = 0; i < controllers.length; i++) {
                    if(!controllers[i].moving) continue;
                    for (var j = 0; j < controllers[i].tail.length; j++) {
                        for (var k = 0; k < controllers.length; k++) {
                            if (controllers[k].position.equals(controllers[i].tail[j])) {
                                controllers[k].collide();
                                controllers[i].tailCollideOtherPlayer(controllers[k]);
                                break collusionTest;
                            }
                            for (var u = 0; u < controllers[k].length && u < controllers[k].tail.length && i != k; u++) {
                                if (controllers[k].tail[u].equals(controllers[i].tail[j])) {
                                    controllers[k].collide();
                                    controllers[i].tailCollideOtherPlayer(controllers[k]);
                                    break collusionTest;
                                }
                            }

                        }
                    }
                }
            }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < controllers.length; i++) {
            if (controllers[i].draw) {
                controllers[i].draw(ctx);
            }
        }
    };
    this.keyDownProvider = function (key) {
        return keyDowns.hasOwnProperty(key) && keyDowns[key] == true;
    }
    this.start = function () {
        interval = setInterval(loop, intervalTimeout);
    };
    this.stop = function () {
        clearInterval(interval);
    };
    this.addController = function (controller) {
        controllers.push(controller);
    }
}

function ScoreController() {
    var scoreContainer = document.querySelector(".container .right");
    var scores = {};
    this.addScore = function (player) {
        var currentScore = scores[player.identifier].getScore();
        currentScore++;
        scores[player.identifier].setScore(currentScore);
    }
    this.addPlayer = function (player, name) {
        var score = document.createElement("div");
        score.classList.add("score");
        var nameContainer = document.createElement("div");
        nameContainer.classList.add("name");
        nameContainer.innerText = name;
        var scoreLabel = document.createElement("div");
        scoreLabel.classList.add("score-label");
        scoreLabel.innerText = 0;
        score.appendChild(nameContainer);
        score.appendChild(scoreLabel);
        scores[player.identifier] = {
            label: scoreLabel,
            container: scoreContainer,
            setScore: function (value) {
                this.label.innerText = value;
            },
            getScore: function () {
                return this.label.innerText * 1;
            }
        };
        scoreContainer.appendChild(score);
    }
}

var scoreController = new ScoreController();

var c = new CanvasController(canvas);

var reviveKeyFunction = function (controller) {
    if (!controller.moving) {
        var x = Math.floor(Math.random() * canvas.width / RECT_SIZE) * RECT_SIZE;
        var y = Math.floor(Math.random() * canvas.height / RECT_SIZE) * RECT_SIZE;
        controller.position.x = x;
        controller.position.y = y;
        controller.moving = true;
        console.log(controller);
    }
};

var keysByDirections = {};
keysByDirections[KEYS.TOP] = DIRECTIONS.TOP;
keysByDirections[KEYS.LEFT] = DIRECTIONS.LEFT;
keysByDirections[KEYS.RIGHT] = DIRECTIONS.RIGHT;
keysByDirections[KEYS.DOWN] = DIRECTIONS.DOWN;

var otherKeys = [];
otherKeys.push([KEYS.SPACE, reviveKeyFunction]);
myPlayer = new Player(keysByDirections, otherKeys);
myPlayer.color = "red";
c.addController(myPlayer);
scoreController.addPlayer(myPlayer, "foldesi.david");

keysByDirections = {};
keysByDirections[KEYS.W] = DIRECTIONS.TOP;
keysByDirections[KEYS.A] = DIRECTIONS.LEFT;
keysByDirections[KEYS.D] = DIRECTIONS.RIGHT;
keysByDirections[KEYS.S] = DIRECTIONS.DOWN;
otherKeys = [[[KEYS.ALT , reviveKeyFunction]]];

var myPlayer2 = new Player(keysByDirections, otherKeys);
myPlayer2.position.x = 10;
myPlayer2.color = "green";
c.addController(myPlayer2);
scoreController.addPlayer(myPlayer2, "david.foldesi");

c.start();