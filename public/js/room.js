// Initialize Socket.IO connection with room ID and username query parameters
const socket = io({ query: {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML} });

// Function to scroll message box to the bottom
function scrollDown() {
  const messageBox = document.querySelector('.message-box');
  messageBox.scrollTop = messageBox.scrollHeight;
}

// Emit a new message to the server
function emitMessage(message) {
  socket.emit('newMessage', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML, message: message});
}

// Add a new message to the UI
function addMessage(message, prefix, hasImage=false) {
  if (!prefix) prefix = message.split("]")[0]+"]";
  scrollDown()
  const messageBox = document.querySelector('.message-box');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  if (!hasImage) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    message = message.replace(urlRegex, function(url) {
      return url;
    });
  }
  messageElement.innerHTML = message.replace(/\n/g, '<br>');

  if (prefix == "[ADMIN]") {
    messageElement.style.color = "blue";
  } else if (prefix == "[OWNER]") {
    messageElement.style.color = "red";
  }

  const separatorElement = document.createElement('hr');

  messageBox.appendChild(messageElement);
  messageBox.appendChild(separatorElement);
  scrollDown();
}

// Send message to the server
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const message = messageInput.value;
  if (message) {
    if (message === "/exit") {
      window.location = "/";
    } else {
      emitMessage(message);
      messageInput.value = '';
      messageInput.focus();
    }
  }
}

// Event listener for socket connection
socket.on('connect', () => {

  // Event listener for receiving new messages
  socket.on('newMessageForwarding', (data) => {
    let prefix = '';
    if (data.admin) {
      prefix = "[ADMIN] ";
    }
    if (data.owner) {
      prefix = "[OWNER] ";
    }

    if (data.message.includes('{img}')) {
      const imageUrl = data.message.split('{img}')[1].trim();
      data.message = `<img class="image" src="${imageUrl}" style="width: 40%; height: auto;"></img>`;
    }

    addMessage((prefix ? prefix : '' )+ data.sender + ': ' + data.message, prefix, hasImage=true);
  });

  // Event listener for receiving info messages
  socket.on('info', (data) => {
    console.log('info: '+data);
  });

  // Event listener for replacing placeholder text
  socket.on('replacePlaceholderText', (data) => {
    const messageInput = document.getElementById('message-input');
    messageInput.placeholder = data;
  });

  // Event listener for loading previous messages
  socket.on('loadPreviousMessages', (data) => {
    const messageBox = document.querySelector('.message-box');
    let messages = data.messages.sort((message1, message2) => message1.time - message2.time);
  
    messages.forEach(message => {
      if (message.message.includes('{img}')) {
        const imageUrl = message.message.split('{img}')[1].trim();
        message.message = `<img class="image" src="${imageUrl}" style="width: 40%; height: auto;"></img>`;
        addMessage(`${message.from}: ${message.message}`, prefix=false, hasImage=true);
      } else {
        addMessage(`${message.from}: ${message.message}`, prefix=false, hasImage=false);
      }
    });
  
    scrollDown();
  });
  
  // Event listener for sending messages on button click
  document.getElementById('send-button').addEventListener('click', sendMessage);

  // Event listener for sending messages on Enter key press
  document.getElementById('message-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
});

// Event listener for socket established event
socket.on('established', (response) => {
  const messageBox = document.querySelector('.message-box');
  const inputBox = document.getElementById('message-input');
  inputBox.removeAttribute("disabled");
  inputBox.focus();
  messageBox.innerHTML = '';
});
