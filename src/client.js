utils = require('./utils')


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


var socket = {};
var started = 0, callbacks, updateInt, player;
var gameState = {
  playerId: 0,
};

function connect(cb) {
  callbacks = cb;
  player = world.player;

  console.log('connecting');
  if (!socket.connected) socket = io();
  console.log("Connect ", socket);
  socket.on('news', onNews);
  socket.on('state', onGameState);
  socket.on('disconnect', onDisconnect);
  socket.on('yourId', function(d) {gameState.playerId = d.id; console.log("playerId set to ",d.id) });
  player.emitPlayerInfo = function() {
    socket.emit('playerInfo', { name: player.name, color: player.color });
  }
  player.emitPlayerInfo();
  //setTimeout(tic, 10);
}

function onNews(data) {
  console.log("onNews ", data);
  //messageBox.textContent = data.message;
  var msg = document.createElement('p');
  msg.className = 'show';
  msg.textContent = data.message;
  messageBox.appendChild(msg);
  var opac = 1;
  var opacInt= setInterval(function(){ opac *= 0.995; msg.style.opacity=opac; }, 20);
  setTimeout(function(){ messageBox.removeChild(msg); clearInterval(opacInt); }, 5*1000);
}

var endGameMsg = 'The server connection dropped.';

function onGameState(data) {
  for (var k in data) { gameState[k] = data[k] }

  switch (gameState.state) {

    case 0: // waiting for players
      if (started == 1) {
        callbacks.onEnd();
        started = 0;
      }
      if (gameState.players.length < 2) {
        start.textContent = "Wait for more players...";
        start.disabled = true;
      }
      else {
        start.textContent = "Start";
        start.disabled = false;
      }
      break;

    case 1: // starting
      start.textContent = "Starting";
      start.disabled = true;
      if (started == 1) {
        callbacks.onEnd();
        started = 0;
      }
      break;

    case 2: // started
      if (started == 0) {
        callbacks.onStart();
        started = 1;
        updateInt = setInterval(function(){
          // Submit mouse position only each 33ms if it was changed.
          if (gameState.state != 2) {
            clearInterval(updateInt);
            updateInt = 0;
            return;
          }
          socket.emit('update', {
            id: gameState.playerId,
            player: player.serialize()
          })
        }, 33);
      }
      callbacks.updateGame();
      break;
    }
  }

// Player pressed "start" -
// cb = callback to call when the game actually starts
function startGame() {
  console.log("Game starting!");
  socket.emit('startGame');
}

function onDisconnect(data) {
  console.log("onDisconnect ",data);
  gameState.state = 0;
  callbacks.onDisconnect(endGameMsg);
}



module.exports = {
  startGame: startGame,
  connect: connect,
  gameState: gameState
}
