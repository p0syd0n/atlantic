const socket = io({ query: {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML, dm: true} });
// Connect to the Socket.IO server

// Function to emit a new message
function emitMessage(message) {
  socket.emit('newMessage', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML, message: message});
}

function scrollDown() {
  const messageBox = document.querySelector('.message-box');
  messageBox.scrollTop = messageBox.scrollHeight;
} 

// Function to add a new message to the UI
function addMessage(message) {
  const messageBox = document.querySelector('.message-box');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.textContent = message.replace("\n", "<br>");;
  messageBox.appendChild(messageElement);
  scrollDown();
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
  // Event listener for receiving new messages

  socket.on('newMessageForwarding', (data) => {
    console.log(data);
    addMessage(data.sender + ': ' + data.message);
  });

  socket.on('info', (data) => {
    console.log('info: '+data);
  });

  socket.on('loadPreviousMessages', (data) => {
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
  // Get the message box
  const messageBox = document.querySelector('.message-box');
  const inputBox = document.getElementById('message-input');
  inputBox.removeAttribute("disabled");
  inputBox.focus()
  console.log('message-input enabled and focused');
  // Clear all existing messages
  messageBox.innerHTML = '';
  scrollDown();
});

