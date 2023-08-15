// Connect to the Socket.IO server
const socket = io();

socket.emit('establish', {room: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('username').innerHTML})
// Function to emit a new message
function emitMessage(message) {
  socket.emit('newMessage', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('username').innerHTML, message: message});
}

// Function to add a new message to the UI
function addMessage(message) {
  const messageBox = document.querySelector('.message-box');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.textContent = message;
  messageBox.appendChild(messageElement);
}

// Event listener for receiving new messages
socket.on('newMessage', (data) => {
  console.log(data)
  addMessage(data.sender + ': '+ data.message);
});

// Event listener for sending messages (assuming you have a send button with id "send-button")
document.getElementById('send-button').addEventListener('click', () => {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value;
  if (message) {
    emitMessage(message);
    //addMessage(message);
    messageInput.value = '';
  }
});
