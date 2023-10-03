const username = document.getElementById('sessionUsername').innerHTML;
const peer = new Peer(username, {debug: 3});
call(prompt('username'));

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function call(username) {
  call = peer.call(username,
  mediaStream);
}

peer.on('open', function(id) {
  alert('My peer ID is: ' + id);
});

peer.on('call', function(call) {
  // Answer the call with an audio only stream
  alert("You are being called");
  var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  getUserMedia({video: false, audio: true}, function(stream) {
    call.answer(stream);
  }, function(err) {
    console.log('Failed to get local stream' ,err);
  });
});
