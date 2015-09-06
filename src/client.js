utils = require('./utils')
var player = require('./thePlayer')


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
var gameState = {
  p1: {
    x: 0,
    y: 0,
    anim: 'stand',
  },
};

function connect() {
  console.log('connecting');
  if (!socket.connected) socket = io();
  console.log("Connect ", socket);
  socket.on('news', onNews);
  socket.on('state', onGameState);
  socket.on('disconnect', onDisconnect);
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
  setTimeout(function(){ msg.className = '' }, 5*1000);
  setTimeout(function(){ messageBox.removeChild(msg) }, 10*1000);
}

var endGameMsg = 'The server connection dropped.';
function onGameState(data) {
  console.log("onGameState ",data);
  for (var k in data) { gameState[k] = data[k] }

  switch (gameState.state) {

    case 0: // waiting for players
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
      break;
  }

}

function onDisconnect(data) {
  console.log("onDisconnect ",data);
  openDialog(
    'Disconnected', endGameMsg+'<br>Do you want to reconnect?',
    'Reconnect', function() {
      document.location.reload();
      dialog.style.display = 'none';
  });
}

//
// function openNameDialog() {
//   var name = '';
//   openDialog(
//     'Welcome',
//     'What is your name?' +
//     '<form onsubmit="getName(); return false">' +
//     '<input id="playerNameInput" value="'+name+'"></form>',
//     'Enter', getName
//   );
// }
// function getName() {
//   playerName = playerNameInput.value;
//   dialog.style.display = 'none';
//   connect();
// }

function openDialog(title, content, btLabel, btFunc) {
  console.log('open dialog', title, dialog);
  dialog.style.display = 'block';
  dialogTitle.innerHTML = title;
  dialogContent.innerHTML = content;
  dialogBtFunc.innerHTML = btLabel;
  dialogBtFunc.onclick = btFunc;
  console.log('open dialog done');
}

// setInterval(function(){
//   // Submit mouse position only each 33ms if it was changed.
//   if (!connected || !config.playing) return;
//   //if (lastY != currentY) {
//     //socket.emit('move', { y: currentY/document.body.clientHeight });
//   //}
// }, 33);
//

//openNameDialog();
connect();
