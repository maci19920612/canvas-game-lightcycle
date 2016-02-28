console.log("Websocket Started");
var WebSocketServer = require('websocket').server;
var http = require('http');
var clients = {};
var number = 0;
var GRID_WIDTH = 800;
var GRID_HEIGHT = 600;
var TAIL_LENGTH = 10;
var Directions = {
    RIGHT: 1,
    UP: 2,
    LEFT: 3,
    DOWN: 4
};
var players = {};
var scores = {};


//1: Job, Fel, Bal, Le
function generatePlayer(n) {
    if (typeof n == "undefined") {
        n = number;
    }
    var direction = Math.random() * 4;
    var x = Math.floor(Math.random() * GRID_WIDTH / 5) * 5;
    var y = Math.floor(Math.random() * GRID_HEIGHT / 5) * 5;
    return {
        alive: true,
        direction: direction,
        length: 0,
        position:{
            x: Math.floor(x),
            y: Math.floor(y)
        },
        maxLength: TAIL_LENGTH,
        number: n,
        speed: 5,
        tail: []
    };
}

var server = http.createServer(function (request, response) {
});
server.listen(1337, function () {
});
wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on("connect", function (e) {
    console.log("Client Connected!");
    e.azon = "CONNECTION" + number;
    e.number = number;
    number++;
    clients[e.azon] = {
        connection: e,
        uniqueid: ""
    };
});


function sendAll(message) {
    if (typeof message != "string") {
        message = JSON.stringify(message);
    }

    for (var key in clients) {
        clients[key].connection.sendUTF(message);
    }
}
function send(identifier, message) {
    if (typeof message != "string") {
        message = JSON.stringify(message);
    }
    clients[identifier].connection.sendUTF(message);
}
function sendAllExceptOne(identifier, message) {
    if (typeof message != "string") {
        message = JSON.stringify(message);
    }
    for (var key in clients) {
        if (key == identifier) continue;
        clients[key].connection.sendUTF(message);
    }
}

wsServer.on('request', function (request) {
    var connection = request.accept(null, request.origin);
    connection.on('message', function (message) {
        if (message.type === 'utf8') {

            //try {
            console.log(message);
                var data = JSON.parse(message.utf8Data);
                switch (data["flag"]) {
                    case "login":
                    {
                        clients[connection.azon].uniqueid = data["data"].uniqueid;
                        clients[connection.azon].username = data["data"].username;
                        clients[connection.azon].number = number;

                        var player = generatePlayer();
                        player.uniqueid = data["data"].uniqueid;
                        player.username = data["data"].username;
                        players[number] = player;
                        scores[number] = 0;
                        send(connection.azon, {
                            "flag": "login_accept",
                            "data": {
                                "number": number,
                                "players": players,
                                "scores": scores
                            }
                        });
                        sendAllExceptOne(connection.azon, {
                            "flag": "register_player",
                            "data": player
                        });

                        break;
                    }
                    case "request_revive":
                    {

                        var player = generatePlayer(clients[connection.azon].number);
                        player.uniqueid = clients[connection.azon].uniqueid;
                        player.username = clients[connection.azon].username;
                        players[clients[connection.azon].number] = player;
                        send(connection.azon, {
                            "flag": "refresh_player_data",
                            "data": player
                        });
                        sendAllExceptOne(connection.azon, {
                            "flag": "refresh_player_data",
                            "data": player
                        });
                        break;
                    }
                    case "request_die":
                    {
                        console.log("DIE");
                        var player = players[clients[connection.azon].number];
                        player.uniqueid = clients[connection.azon].uniqueid;
                        player.username = clients[connection.azon].username;
                        player.alive = false;
                        send(connection.azon, {
                            "flag": "refresh_player_data",
                            "data": player
                        });
                        sendAllExceptOne(connection.azon, {
                            "flag": "refresh_player_data",
                            "data": player
                        });

                        scores[data["data"].number]++;
                        sendAll({
                            "flag": "reflresh_data",
                            "data": {
                                "number": data["data"].number,
                                "score": scores[data["data"].number]
                            }
                        });
                        break;
                    }
                    case "refresh_player_data":
                    {
                        var player = players[clients[connection.azon].number];
                        player.alive = data["data"].alive;
                        player.direction = data["data"].direction;
                        player.length = data["data"].length;
                        player.speed = data["data"].speed;
                        player.tail = data["data"].tail;
                        sendAllExceptOne(connection.azon, {
                            "flag": "refresh_player_data",
                            "data": player
                        });
                        break;
                    }
                }
            //} catch (e) {
            //    console.error(e);
            //}


        }

    });

    connection.on('close', function (c) {
        console.log("Connection closed!");
        console.log(connection.azon);
        var number = clients[connection.azon].number;
        delete clients[connection.azon];
        delete players[number];
        sendAll({
            "flag": "logout",
            "data": number
        });
    });

});