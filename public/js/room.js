// Connect to the Socket.IO server
const socket = io({ query: {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML} });

// Function to emit a new message
function emitMessage(message) {
  socket.emit('newMessage', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML, message: message});
}

// Function to add a new message to the UI
function addMessage(message, prefix) {
  const messageBox = document.querySelector('.message-box');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  if (prefix == "[ADMIN]") {
    messageElement.style.color = "blue !important";
  } else if (prefix == "[OWNER]") {
    messageElement.style.color = "red !important";
  }
  
  messageElement.textContent = message.replace("\n", "<br>");;
  messageBox.appendChild(messageElement);
}

// Function to handle sending messages
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value;
  if (message) {
    if (message === "/exit") {
      window.location = "/";
    } else {
      emitMessage(message);
      //addMessage(message);
      messageInput.value = '';
      messageInput.focus(); // Auto-select the input box
    }
  }
}

// Event listener for socket connection
socket.on('connect', () => {
  console.log('Socket connected');

  // Emit the 'establish' event once the socket is connected
  // socket.emit('establish', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML});
  // socket.emit('establish', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML});
  // socket.emit('establish', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML});
  // socket.emit('establish', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML});
    
  // Event listener for receiving new messages

  socket.on('newMessageForwarding', (data) => {
    console.log(data);
    let prefix = "";
    if (data.admin) {
      prefix = "[ADMIN] ";
    } 
    if (data.owner) {
      prefix = "[OWNER] ";
    }
    addMessage(prefix + data.sender + ': ' + data.message, prefix);
  });

  socket.on('info', (data) => {
    console.log('info: '+data);
  });

  socket.on('loadPreviousMessages', (data) => {
    // Get the message box
    const messageBox = document.querySelector('.message-box');

    // Clear all existing messages
    messageBox.innerHTML = '';
    // Sort the messages based on the __createdtime__ property in ascending order
    let messages = data.messages.sort((message1, message2) => message1.time - message2.time);
  
    for (const message of messages) {
      addMessage(`${message.from}: ${message.message}`);
    }
  });
  





  // Event listener for sending messages on button click
  document.getElementById('send-button').addEventListener('click', sendMessage);

  // Event listener for sending messages on Enter key press
  document.getElementById('message-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent creating a new line
      sendMessage(); // Send the message
    }
  });
});

socket.on('established', (response) => {
  console.log('Established:', response);
});
