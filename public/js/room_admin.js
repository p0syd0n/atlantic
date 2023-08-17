// Connect to the Socket.IO server
const socket = io();

// Function to emit a new message
function emitMessage(message) {
  socket.emit('newMessage', {roomId: document.getElementById('roomId').getAttribute('data-roomid'), username: document.getElementById('sessionUsername').innerHTML, message: message});
}

// Function to add a new message to the UI
function addMessage(message, senderData) {
  const messageBox = document.querySelector('.message-box');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');

  // Set the message text content and replace newlines
  messageElement.innerHTML = message.replace(/\n/g, '<br>');

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

  // Append the tooltip to the tooltip container
  tooltipContainer.appendChild(tooltip);

  // Append both the message and the tooltip container to the message box
  messageElement.appendChild(tooltipContainer);
  messageBox.appendChild(messageElement);
  messageBox.appendChild(separatorElement);
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
    addMessage(prefix + data.sender + ': ' + data.message, data.senderData);
  });

  // Event listener for sending messages
  document.getElementById('send-button').addEventListener('click', () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;
    if (message) {
      emitMessage(message);
      messageInput.value = '';
    }
  });
});

socket.on('established', (response) => {
  console.log('Established:', response);
});
