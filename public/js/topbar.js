const openSettingsButton = document.getElementById("open-settings-button");
const modalBackdrop = document.getElementById("modal-backdrop");
const settingsModal = document.getElementById("settings-modal");
const closeModalButton = document.getElementById("close-modal");
const logoutButton = document.getElementById("logout");

openSettingsButton.addEventListener("click", () => {
    modalBackdrop.style.display = "block";
    settingsModal.style.display = "block";
});

closeModalButton.addEventListener("click", () => {
    modalBackdrop.style.display = "none";
    settingsModal.style.display = "none";
});

logoutButton.addEventListener("click", () => {
    window.location = "/logout";
});
