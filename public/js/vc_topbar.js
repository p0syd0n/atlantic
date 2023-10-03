// Get username from hidden paragraph
const username = document.getElementById('sessionUsername').innerHTML;

// Create a peer connection with a custom ID
var peer = new Peer(username);

// Get dialog elements
const incomingCallDialog = document.querySelector('#incoming-call-dialog');
const callInterfaceDialog = document.querySelector('#call-interface-dialog');
const dialDialog = document.querySelector('#dial-dialog');
const audioElement = document.querySelector('#audio-element');
const callButton = document.getElementById('call');

let currentCall;

callButton.addEventListener('click', () => {
    makeCall();
});

// Listen for incoming calls
peer.on('call', function(call) {
    // Display incoming call dialog
    incomingCallDialog.showModal();

    // If the call is accepted
    document.querySelector('#accept-call-button').addEventListener('click', function() {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then(function(stream) {
            // Answer the call with an A/V stream
            call.answer(stream);

            // Display the call interface dialog
            callInterfaceDialog.showModal();

            call.on('stream', function(remoteStream) {
                // Show stream in some audio element
                audioElement.srcObject = remoteStream;
            });

            currentCall = call;
        })
        .catch(function(err) {
            console.error('Failed to get local stream', err);
        });
    });

    // If the call is rejected, close the incoming call dialog
    document.querySelector('#reject-call-button').addEventListener('click', function() {
        incomingCallDialog.close();
    });
});

// Close call interface dialog when the call is ended
document.querySelector('#end-call-button').addEventListener('click', function() {
    currentCall.close();
    callInterfaceDialog.close();
});

// Function to initiate calls
function makeCall() {
    // Open the dial dialog
    dialDialog.showModal();

    // When the call button is clicked, start a call
    document.querySelector('#call-button').addEventListener('click', function() {
        const targetPeerId = document.querySelector('#target-username-input').value;

        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then(function(stream) {
            var call = peer.call(targetPeerId, stream);

            // Display the call interface dialog
            callInterfaceDialog.showModal();

            call.on('stream', function(remoteStream) {
                // Show stream in some audio element
                audioElement.srcObject = remoteStream;
            });

            currentCall = call;
        })
        .catch(function(err) {
            console.error('Failed to get local stream', err);
        });
    });
}
