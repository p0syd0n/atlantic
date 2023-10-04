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
    notifyMe("You have a message!", "You have a new direct message!", "/images/atlantic_icon.png")
  });
  
}
