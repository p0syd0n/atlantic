let notifications = [];
let notificationsCount = 0;

function displayNotifications() {
  const notificationsDialog = document.getElementById('notifications-list');
  const notificationsCountElement = document.getElementById('notifications-count');

  notificationsCount = notifications.length;

  // Display the updated count in the DOM
  
  notificationsCountElement.textContent = notificationsCount;
  // Clear existing notifications
  notificationsDialog.innerHTML = '';
  //notifications = [{message: "message", sender: "user"}, {message: "message2", sender: "user2"}]
  // Check if there are notifications to display
  if (notifications.length === 0) {
      notificationsDialog.innerHTML = '<p>No notifications to display.</p><br>';
      return;
  }

  // Create a list to display notifications
  const notificationsList = document.createElement('ul');
  

  // notifications.forEach(([message, sender]) => {
  //     // Create list items for each notification
  //     const notificationItem = document.createElement('li');
  //     notificationItem.textContent = `${sender}: ${message}`;

  //     // Append each notification item to the list
  //     notificationsList.appendChild(notificationItem);
  // });
  for (let i=0; i<notifications.length; i++) {
    let currentNotification = notifications[i];
    let { sender, message } = currentNotification;
    const notificationItem = document.createElement('li');
    notificationItem.textContent = `${sender}: ${message}`;
    notificationsList.appendChild(notificationItem);
  }

  // Append the list to the notifications dialog
  notificationsDialog.appendChild(notificationsList);
}


function notifyMe(title, message, icon) {
  if (!window.Notification) {
      console.log('Browser does not support notifications.');
  } else {
      // check if permission is already granted
      if (Notification.permission === 'granted') {
          // show notification here
          var notify = new Notification(title, {
              body: message,
              icon: icon,
          });
      } else {
          // request permission from user
          Notification.requestPermission().then(function (p) {
              if (p === 'granted') {
                  // show notification here
                  var notify = new Notification('Hi there!', {
                      body: 'How are you doing?',
                      icon: 'https://bit.ly/2DYqRrh',
                  });
              } else {
                  console.log('User blocked notifications.');
              }
          }).catch(function (err) {
              console.error(err);
          });
      }
  }
}

if (window.location.pathname == '/room' || window.location.pathname == '/dm'){} else {
  const socket = io({query: {'notificationManager': true}});

  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  socket.on('notification', (data) => {
    // Handle the notification, e.g., display it to the user
    console.log('Notification:', data.message);
    notifications.push({message: data.message, sender: data.sender});
    //alert({message: data.message, sender: data.sender})
    displayNotifications();

    notifyMe("You have a message!", "You have a new direct message!", "/images/atlantic_icon.png")
  });
  
}

// Function to open the notifications dialog
function openNotificationsDialog() {
  const notificationsDialog = document.querySelector('#notifications-dialog');
  notificationsDialog.show(); // Show the dialog
  displayNotifications()
}

// Function to close the notifications dialog
function closeNotificationsDialog() {
  const notificationsDialog = document.querySelector('#notifications-dialog');
  notificationsDialog.close(); // Close the dialog
}

// Add a click event listener to the notifications icon to open the dialog
document.getElementById('notifications-count').addEventListener('click', () => {
  openNotificationsDialog();
  console.log('opening')
});

// Add a click event listener to the close button in the dialog to close it
document.getElementById('close-notifications').addEventListener('click', () => {
  closeNotificationsDialog();
});
