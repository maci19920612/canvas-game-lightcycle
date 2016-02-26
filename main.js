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
    LEFT: {x: -1,y: 0},
    DOWN: {x: 0, y: 1},
    RIGHT: {x: 1, y:0}
};


var canvas = document.getElementById("game");

function Player(_keyControlls){

    var keyController = null;
    if(typeof _keyControlls != "undefined" && _keyControlls != null){
        keyController = new KeyController(_keyControlls);
    }
    var RECT_SIZE = 5;

    this.position = {
        x: 100,
        y: 100
    };
    this.direction = DIRECTIONS.DOWN;
    this.speed = 1;
    this.tail = [];
    this.length = 10;
    this.moving = false;

    this.update = function(key){
        for(var i = 0;i<this.speed;i++){
            this.tail.push({
                x: this.position.x + i*this.direction.x*RECT_SIZE,
                y: this.position.y + i*this.direction.y*RECT_SIZE
            });
        }

        var tailLength = this.tail.length;
        for(var i = 0;i<tailLength - this.length;i++){
            this.tail.shift();
        }

        this.position.x += this.direction.x*RECT_SIZE*this.speed;
        this.position.y += this.direction.y*RECT_SIZE*this.speed;

        if(this.position.x < 0){
            this.position.x = this.position.x + canvas.width;
        }else if(this.position.x > canvas.width){
            this.position.x = this.position.x - canvas.width;
        }

        if(this.position.y < 0){
            this.position.y = canvas.height + this.position.y;
        }else if(this.position.y > canvas.height){
            this.position.y = this.position.y - canvas.height;
        }
        if(keyController != null && keyController.keyPress){
            keyController.keyPress(this, key);
        }
    }
    this.draw = function(ctx){
        ctx.fillRect(this.position.x, this.position.y, RECT_SIZE, RECT_SIZE);
        var tail = this.tail;
        for(var i = 0;i<tail.length;i++){
            ctx.fillRect(tail[i].x, tail[i].y, RECT_SIZE, RECT_SIZE);
        }
    }

    this.clearTail = function(){
        this.tail = [];
    }
}

function KeyController(directionsByKey){
    this.keyPress = function(controller, keyDown){
        if(!controller.direction){
            return;
        }

        var pressed = -1;
        for(var key in directionsByKey){
            if(keyDown(key)){
                pressed = key;
                break;
            }
        }
        if(pressed == -1){
            return;
        }
        console.log(directionsByKey[key], controller.direction);
        if(directionsByKey[key].x + controller.direction.x == 0 && directionsByKey[key].y + controller.direction.y == 0){
            return;
        }
        controller.direction = directionsByKey[key];
    }
}

function CanvasController(c){
    //TODO: Optimalizálni kell
    var controllers = [];
    var ctx = c.getContext("2d");
    var canvas = c;
    var interval = null;
    var intervalTimeout = 50;
    var keyDowns = {};
    var self = this;

    document.body.onkeydown = function(e){
        keyDowns[e.which] = true;
    };
    document.body.onkeyup = function(e){
        keyDowns[e.which] = false;
    };
    var loop = function(){
        for(var i = 0;i<controllers.length;i++){
            if(controllers[i].update){
                controllers[i].update(self.keyDownProvider);
            }
        }

        ctx.clearRect(0,0,canvas.width, canvas.height);

        for(var i = 0;i<controllers.length;i++){
            if(controllers[i].draw){
                controllers[i].draw(ctx);
            }
        }
    };
    this.keyDownProvider = function(key){
        return keyDowns.hasOwnProperty(key) && keyDowns[key] == true;
    }
    this.start = function(){
        interval = setInterval(loop, intervalTimeout);
    };
    this.stop = function(){
        clearInterval(interval);
    };
    this.addController = function(controller) {
        controllers.push(controller);
    }
}

var c = new CanvasController(canvas);


var keysByDirections = {};
keysByDirections[KEYS.TOP] = DIRECTIONS.TOP;
keysByDirections[KEYS.LEFT] = DIRECTIONS.LEFT;
keysByDirections[KEYS.RIGHT] = DIRECTIONS.RIGHT;
keysByDirections[KEYS.DOWN] = DIRECTIONS.DOWN;
c.addController(new Player(keysByDirections));

c.start();