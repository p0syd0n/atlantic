// Connect to the Socket.IO server
const socket = io();

// Function to emit a new message
function emitMessage(message) {
  socket.emit('newMessage', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML, message: message});
}

// Function to add a new message to the UI
function addMessage(message) {
  const messageBox = document.querySelector('.message-box');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.textContent = message.replace("\n", "<br>");;
  messageBox.appendChild(messageElement);
}

// Event listener for socket connection
socket.on('connect', () => {
  console.log('Socket connected');

  // Emit the 'establish' event once the socket is connected
  socket.emit('establish', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML});
  socket.emit('establish', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML});
  // Event listener for receiving new messages
  socket.on('newMessageForwarding', (data) => {
    console.log(data);
    let prefix = "";
    if (data.admin) {
      prefix = "[ADMIN] ";
    } else if (data.owner) {
      prefix = "[OWNER] ";
    }
    addMessage(prefix + data.sender + ': ' + data.message);
  });

  // Event listener for sending messages
  document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;
    if (message) {
      emitMessage(message);
      //addMessage(message);
      messageInput.value = '';
    }
  });
});

socket.on('established', (response) => {
  console.log('Established:', response);
});
