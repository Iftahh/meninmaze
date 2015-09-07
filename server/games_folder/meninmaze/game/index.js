'use strict';

var io = require('sandbox-io');


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

  var repeat = 6;
  var repeater = function() {
    if (state != GAME_STARTING) {
      return;
    }
    repeat--;
    if (repeat == 0) {
      state = GAME_STARTED;
      io.to(id).emit('state', { state: state });
    }
    else {
      io.to(id).emit('news', { message: 'Game starting in '+repeat+'!' });
    }
    setTimeout(repeater, 1000);
  };
  repeater();
}

function playerUpdate(player,data) {
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
    players.splice(players.indexOf(found));
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

//  setTimeout(gameTick, 1000);

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
  socket.on('playerInfo', function(d) { playerUpdate(player,d)});
  socket.on('startGame', function(d) { playerStarted(player,d)});
  socket.on('disconnect', onExit.bind(0,player));
});
  /*if ( alonePlayer ) { // && alonePlayer.socket.id != socket.id ) {
    socket.emit('news', { message: 'Entering in a game...' });
    var firstPlayer = alonePlayer;
    alonePlayer = null;
    // Give some time to player info to arrive.
    setTimeout(function(){ new Game(firstPlayer, newPlayer); }, 500);
    //new Game(alonePlayer, newPlayer);
  } else {
    socket.emit('news', { message: 'Waiting for a pair...' });
    alonePlayer = newPlayer;
  }*/


function gameTick() {
  io.to(id).emit('state', {
    state:state,
    players:players
  });
  setTimeout(gameTick, 33);
};

/*
Game.prototype.end = function() {
  log('End game', { id:this.id, players:this.players });
  this.players[0].exit();
  this.players[1].exit();
  delete games[this.id];
};


Player.prototype.joinGame = function(game) {
  this.game = game;
  this.points = 0;
  this.socket.join(game.id);
  this.socket.on('move', this.onMove.bind(this));
  this.socket.emit('news', { message: 'My key', key:this.whoInTheGame().me.key });
};


Player.prototype.whoInTheGame = function() {
  if (!this.game) return {};
  var players = this.game.players;
  if ( players[0] == this ) {
    return {
      me: {obj:players[0], key:'player1'},
      other: {obj:players[1], key:'player2'}
    };
  } else {
    return {
      me: {obj:players[1], key:'player2'},
      other: {obj:players[0], key:'player1'}
    };
  }
};

Player.prototype.onExit = function() {
  log("onExit ")
  if (this==alonePlayer) alonePlayer = null;
  if (!this.game) return;
  var otherPlayer = this.whoInTheGame().other.obj;
  otherPlayer.socket.emit('news', {
    message: 'Your pair leaves the game.',
    kickerId: this.socket.id
  });
  this.game.end('Your pair leaves the game.');
};

Player.prototype.exit = function(msg) {
  if (!this.game) return;
  this.socket.emit('config', { playing:false, message:msg });
  this.socket.disconnect();
  this.game = null;
};
*/
