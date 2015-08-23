
var player = require('./player')

var socket = {};
var config = {
  p1: {
    x: 0,
    y: 0,
    anim: 'stand',
  },
};
var connected = false;
var playerName = 'Player '+Math.round(100000*Math.random());

function connect() {
  connected = true;
  console.log('connecting');
  if (!socket.connected) socket = io(document.location.href);
  socket.on('news', onNews);
  socket.on('config', onConfig);
  socket.on('disconnect', onDisconnect);
  socket.emit('playerInfo', { name: playerName });
  //setTimeout(tic, 10);
}
function onNews(data) {
  console.log(data);
  var msg = document.createElement('p');
  msg.className = 'show';
  msg.innerHTML = data.message;
  messageBox.appendChild(msg);
  setTimeout(function(){ msg.className = '' }, 10);
  setTimeout(function(){ messageBox.removeChild(msg) }, 20*1000);
}

var endGameMsg = 'The server connection dropped.';
function onConfig(data) {
  for (var k in data) { config[k] = data[k] }
  if (data.playing===false) {
    endGameMsg = data.message || 'The server connection dropped.';
  }
}

function onDisconnect(data) {
  connected = false;
  console.log('disconnected', data);
  openDialog(
    'Disconnected', endGameMsg+'<br>Do you want to reconnect?',
    'Reconnect', function() {
      document.location.reload();
      dialog.style.display = 'none';
  });
}

function openNameDialog() {
  var name = '';
  openDialog(
    'Welcome',
    'What is your name?' +
    '<form onsubmit="getName(); return false">' +
    '<input id="playerNameInput" value="'+name+'"></form>',
    'Enter', getName
  );
}
function getName() {
  playerName = playerNameInput.value;
  dialog.style.display = 'none';
  connect();
}

function openDialog(title, content, btLabel, btFunc) {
  console.log('open dialog', title, dialog);
  dialog.style.display = 'block';
  dialogTitle.innerHTML = title;
  dialogContent.innerHTML = content;
  dialogBtFunc.innerHTML = btLabel;
  dialogBtFunc.onclick = btFunc;
  console.log('open dialog done');
}

setInterval(function(){
  // Submit mouse position only each 33ms if it was changed.
  if (!connected || !config.playing) return;
  //if (lastY != currentY) {
    //socket.emit('move', { y: currentY/document.body.clientHeight });
  //}
}, 33);

openNameDialog();
