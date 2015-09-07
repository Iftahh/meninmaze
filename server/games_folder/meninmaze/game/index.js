'use strict';

var io = require('sandbox-io');
var Maze = require('./dfs_maze_gen');

/*********
1. player 1 connect - get game state, join game if possible
   - game state:  waiting for more players
2. player 2..N opens game - join game
   - game state:  can Start
3. player 1..N change color/name - update server, server updates 1..N
3. player X starts game
   - game state: started, level created
4. player 1..N updates server every 33ms
5. server moves NPCs and updates 1..N players every 33ms
6. game ends - goes back to waiting for users
**********/


var
  WAITING_FOR_GAME_START = 0,
  GAME_STARTING = 1,
  GAME_STARTED = 2,

  players= [],
  sockets={},
  maze= [],
  id = 'g'+Math.random(),
  state = WAITING_FOR_GAME_START;

function findPlayer(player) {
  for (var i=0; i<players.length; i++) {
    if (players[i].id == player.id) {
      return players[i];
    }
  }
}

function playerStarted(player,data) {
  log("Game starting!");
  state = GAME_STARTING;

  io.to(id)
    .emit('news', { message: player.name+' started the game!' })
    .emit('state', { state: state, players: players });

  var repeat = 2;
  var repeater = function() {
    if (state != GAME_STARTING) {
      return;
    }
    repeat--;
    if (repeat == 0) {
      state = GAME_STARTED;
      io.to(id).emit('state', { state: state, mazeX:48, mazeY:40, maze:maze });
      setTimeout(function gameTick() {
        if (state != GAME_STARTED) return;
        io.to(id).emit('state', {
          state:state,
          players:players
        });
        setTimeout(gameTick, 33);
      }, 33);

    }
    else {
      io.to(id).emit('news', { message: 'Game starting in '+repeat+'!' });
    }
    setTimeout(repeater, 1000);
  };
  repeater();
  maze = Maze(24,20);
}

function playerUpdate(player, data) {
  if (state != GAME_STARTED) {
    // expect player updates when game is ongoing
    return;
  }
  for (k in data) {
    player[k] = data[k];
  }
}

function playerInfo(player,data) {
  if (state != WAITING_FOR_GAME_START) {
    // allow changing player name/color only before game start
    return;
  }
  for (k in data) {
    player[k] = data[k];
  }

  var found = findPlayer(player);
  if (!found) {
    players.push(player);
    log('Player connected', { name: player.name });
    sockets[player.id].join(id);
    log("Done join");
    io.to(id).emit('news', { message: player.name+' joined the game', player: player });
    log("Done emit news");
  }
  else {
    log('Player updated', data);
  }

  log("updating state", {state:state, players:players});
  io.to(id)
    .emit('state', { state: state, players: players });

  log("Done update");
}

function onExit(player) {
  log('Player exit', { name: player.name, color: player.color });
  var found = findPlayer(player);
  if (found) {
    players.splice(players.indexOf(found),1);
    sockets[player.id].disconnect();
    delete sockets[player.id];
    var msg = '';
    if (players.length < 2) {
      msg = player.name+' left the game, not enough players remained - THE END';
      log(msg);
      state = WAITING_FOR_GAME_START;
      io.to(id)
        .emit('state', { state: state, players: players, endMsg:msg });
    }
    io.to(id)
      .emit('news', { message: player.name+' left the game'})
  }
}


io.on('connection', function(socket) {
  log('New connection', socket.id);
  if (state == GAME_STARTED) {
      socket.emit('news', {message: "Sorry, can't join game - it already started"})
      return;
  }

  var player = {
    id: 'p'+Math.random(),
  };
  sockets[player.id] = socket;
  socket.on('playerInfo', function(d) { playerInfo(player,d)});
  socket.on('startGame', function(d) { playerStarted(player,d)});
  socket.on('update', function(d) { playerUpdate(player,d)});
  socket.on('disconnect', onExit.bind(0,player));
  socket.emit('yourId', {id: player.id});
});
