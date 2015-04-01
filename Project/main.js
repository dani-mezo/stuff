/**
 * Created by S on 2015.03.26..
 */

var http = require("http");
var url = require('url');
var fs = require('fs');
var io = require('socket.io')(http);


var server = http.createServer(function(request, response){
    console.log('Connection');

    var path = url.parse(request.url).pathname;
    console.log(path)


    if(path == '/Wallman.html'){
        fs.readFile(__dirname + '/Wallman.html', function(err, data){

            if(err){
                response.end("Problem occurred, during loading the page!")
            }
            else{
                response.end(data)
            }
        })

    }

    if(path == '/Wallman.css'){
        fs.readFile(__dirname + '/Wallman.css', function(err, data){

            if(err){
                response.end("Problem occurred, during loading the page!")
            }
            else{
                response.end(data)
            }
        })

    }

});

server.listen(8001);

io.listen(server);

var players = {};
var numberOfPlayers = 0;
var status = {};
var WIDTH = 1000;
var HEIGHT = 500;
var dx = 30;
var dy = 30;

function Player (name){
    this.name = name;
    this.x = 30;
    this.y = 30;
    this.direction = "down";
}

function disconnectedPlayer(socketid){
    if(players[socketid] == null) return;
    delete players[socketid];
}

io.on('connection', function(socket){

    if(players.length > 3) return;

    turns(socket);


    numberOfPlayers++;

    var player = "player" + numberOfPlayers;
    var newplayer = new Player(player);

    players[socket.id] = newplayer;

    console.log(player);


    // Send everyone to the new
    for (var key in players) {
        if (players.hasOwnProperty(key)) {
            socket.emit('addPlayer', {id: key});
        }
    }
    socket.on('playerAdded', function (data) {
        var key = data.id;
        sendPicture("down", players[key].name, socket, key);
        sendPicture("up", players[key].name, socket, key);
        sendPicture("left", players[key].name, socket, key);
        sendPicture("right", players[key].name, socket, key);
        sendPicture("bomb1", players[key].name, socket, key);
        sendPicture("bomb2", players[key].name, socket, key);
    });

    // Send the new to everyone

    io.emit('addPlayer', {id: socket.id});



    socket.on('keydown', function (data) {
        switch (data.keyCode) {
            case 39: // Arrow to the right
                if (players[socket.id].x + dx < WIDTH-40){
                    players[socket.id].direction = "right";
                    players[socket.id].x += dx;
                }
                break;
            case 40: // Arrow to the down
                if (players[socket.id].y + dy < HEIGHT-80){
                    players[socket.id].direction = "down";
                    players[socket.id].y += dy;
                }
                break;
            case 37: // Arrow to the left
                if (players[socket.id].x - dx > 0){
                    players[socket.id].direction = "left";
                    players[socket.id].x -= dx;
                }
                break;
            case 38: // Arrow to the up
                if (players[socket.id].y - dy > 0){
                    players[socket.id].direction = "up";
                    players[socket.id].y -= dy;
                }
                break;
        }

    });

    socket.on('disconnect', function() {
        console.log('Got disconnect!');
        disconnectedPlayer(socket.id)
        if(numberOfPlayers > 0) numberOfPlayers--;

        io.emit('deletePlayer', {id: socket.id});
    });


});

var sendPicture = function (picname, player, socket, socketid) {

    fs.readFile(__dirname + "/pics/" + player + "/" + picname + ".png", function (err, buf) {
        if (err) {
            console.log(err.toString());
        }
        else {
            socket.emit('image', {image: true, socketid:socketid, player: player ,direction: picname, buffer: buf.toString('base64')});
        }
    })
}

// Broadcast:
var turns = function (socket){
    setInterval(function(){
        socket.emit('status', players);
    }, 20);
}


