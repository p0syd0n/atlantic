// Get the username from the input field or any other source
function checkRedirect(event) {
    event.preventDefault();
    const username = document.getElementById('username-input').value;
    console.log(`/dm?target=${username}`)
    window.location.replace(`/dm?target=${username}`);
}

function triggerCall(event) {
    event.preventDefault();
    const username = document.getElementById('username-input').value;
    window.location = '/vc?'

}

