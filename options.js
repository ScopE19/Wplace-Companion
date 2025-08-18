document.addEventListener("DOMContentLoaded", () => {
  const saveButton = document.getElementById("save");
  const statusElement = document.getElementById("status");

  // Load saved values
  chrome.storage.local.get(["botToken", "chatId"], (data) => {
    if (data.botToken) document.getElementById("botToken").value = data.botToken;
    if (data.chatId) document.getElementById("chatId").value = data.chatId;
  });

  // Save values
  saveButton.addEventListener("click", () => {
    const botToken = document.getElementById("botToken").value.trim();
    const chatId = document.getElementById("chatId").value.trim();

    if (!botToken || !chatId) {
      statusElement.innerText = "❌ Bot token and chat ID are required!";
      setTimeout(() => { statusElement.innerText = ""; }, 3000);
      return;
    }

    chrome.storage.local.set({ botToken, chatId }, () => {
      statusElement.innerText = "✅ Settings saved!";
      setTimeout(() => { statusElement.innerText = ""; }, 2000);
    });
  });
});
