// Connect to the Socket.IO server
const socket = io({ query: {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML} } );

function scrollDown() {
  const messageBox = document.querySelector('.message-box');
  messageBox.scrollTop = messageBox.scrollHeight;
}

// Function to emit a new message
function emitMessage(message) {
  socket.emit('newMessage', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML, message: message});
}

// Function to add a new message to the UI
function addMessage(message, senderData, prefix, hasImage=false) {
  const messageBox = document.querySelector('.message-box');
  scrollDown();
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  if (!hasImage) {
    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Replace URLs in the message with anchor tags
    message = message.replace(urlRegex, function(url) {
      return '<a class="message-link" href="' + url + '" target="_blank">' + url + '</a>';
    });
  }
  // Set the message text content and replace newlines
  messageElement.innerHTML = message.replace(/\n/g, '<br>');
  console.log("prefix: "+prefix)
  if (prefix == "[ADMIN] ") {
    messageElement.style.color = "blue";
  } else if (prefix == "[OWNER] ") {
    messageElement.style.color = "red";
  }
  // Create a horizontal line separator element
  const separatorElement = document.createElement('hr');

  // Create a tooltip container
  const tooltipContainer = document.createElement('div');
  tooltipContainer.classList.add('tooltip-container');

  // Create a hidden tooltip element
  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip');

  // Set the content of the tooltip (senderData)
  tooltip.innerHTML = JSON.stringify(senderData, null, 2); // Prettify the JSON
  //senderData.array.forEach(element => {
    
  //});

  // Append the tooltip to the tooltip container
  tooltipContainer.appendChild(tooltip);

  // Append both the message and the tooltip container to the message box
  messageElement.appendChild(tooltipContainer);
  messageBox.appendChild(messageElement);
  messageBox.appendChild(separatorElement);
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
    let prefix;
    if (data.admin) {
      prefix = "[ADMIN] ";
    } 
    if (data.owner) {
      prefix = "[OWNER] ";
    }

    if (data.message.includes('{img}')) {
      const imageUrl = data.message.split('{img}')[1].trim(); // Get the image URL after '{img}'
      data.message = `<img class="image" src="${imageUrl}" style="width: 40%; height: auto;"></img>`;
    }

    addMessage(prefix + data.sender + ': ' + data.message, data.senderData, prefix, hasImage=true);
  });

  socket.on('info', (data) => {
    console.log('info: '+data);
  });

  socket.on('replacePlaceholderText', (data) => {
    const messageInput = document.getElementById('message-input');
    messageInput.placeholder = data;
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
    scrollDown()
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

  // Clear all existing messages
  messageBox.innerHTML = '';
});
