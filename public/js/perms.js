

  document.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
      // Microphone access is granted
    })
    .catch(function(error) {
      // Microphone access was denied or there was an error.
    });
  
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
        .then(function(permission) {
          // Store the user's notification permission choice for future use.
          window.location = '/login';
        })
        .catch(function(error) {
          // There was an error while requesting notification permission.
          window.location = '/login';
        });
    }
})
  
  