document.addEventListener("DOMContentLoaded", () => {
    const botTokenInput = document.getElementById("botToken");
    const chatIdInput = document.getElementById("chatId");
    const status = document.getElementById("status");
    const toggleButton = document.getElementById("toggleMonitoring");
  
    // Load saved values
    chrome.storage.local.get(["botToken", "chatId", "monitoringEnabled"], (res) => {
      if (res.botToken) botTokenInput.value = res.botToken;
      if (res.chatId) chatIdInput.value = res.chatId;
      updateMonitoringButton(res.monitoringEnabled !== false); // Default to true if not set
    });
  
    // Save values
    document.getElementById("save").addEventListener("click", () => {
      const botToken = botTokenInput.value.trim();
      const chatId = chatIdInput.value.trim();
      
      if (!botToken || !chatId) {
        status.textContent = "❌ Bot token and chat ID are required!";
        setTimeout(() => { status.textContent = ""; }, 3000);
        return;
      }
      
      chrome.storage.local.set({
        botToken: botToken,
        chatId: chatId
      }, () => {
        status.textContent = "✅ Saved!";
        setTimeout(() => { status.textContent = ""; }, 2000);
      });
    });

    // Test notification
    document.getElementById("test").addEventListener("click", () => {
      const botToken = botTokenInput.value.trim();
      const chatId = chatIdInput.value.trim();
      
      if (!botToken || !chatId) {
        status.textContent = "❌ Please save settings first!";
        setTimeout(() => { status.textContent = ""; }, 3000);
        return;
      }

      status.textContent = "🔄 Testing notification...";
      
      // Send test message to Telegram
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🧪 Test notification from WPlace Pixel Notifier! If you see this, your bot is working correctly."
        })
      })
      .then(res => res.json())
      .then(result => {
        if (result.ok) {
          status.textContent = "✅ Test message sent! Check your Telegram.";
        } else {
          status.textContent = `❌ Telegram error: ${result.description}`;
        }
        setTimeout(() => { status.textContent = ""; }, 5000);
      })
      .catch(err => {
        status.textContent = "❌ Test failed. Check your bot token and chat ID.";
        setTimeout(() => { status.textContent = ""; }, 5000);
      });
    });

    // Reset notifications
    document.getElementById("reset").addEventListener("click", () => {
      chrome.storage.local.remove("lastNotificationSent", () => {
        status.textContent = "🔄 Notification state reset! You'll get notified again when pixels fill up.";
        setTimeout(() => { status.textContent = ""; }, 4000);
      });
    });

    // Toggle monitoring
    toggleButton.addEventListener("click", () => {
      chrome.storage.local.get(["monitoringEnabled"], (res) => {
        const newState = !(res.monitoringEnabled !== false); // Toggle from current state
        
        chrome.storage.local.set({ monitoringEnabled: newState }, () => {
          updateMonitoringButton(newState);
          
          if (newState) {
            status.textContent = "✅ Monitoring enabled! Extension will check pixels automatically.";
            // Restart monitoring
            chrome.runtime.sendMessage({ action: "startMonitoring" });
          } else {
            status.textContent = "⏸️ Monitoring disabled! Extension will not check pixels automatically.";
            // Stop monitoring
            chrome.runtime.sendMessage({ action: "stopMonitoring" });
          }
          
          setTimeout(() => { status.textContent = ""; }, 4000);
        });
      });
    });

    function updateMonitoringButton(enabled) {
      if (enabled) {
        toggleButton.textContent = "Disable Monitoring";
        toggleButton.className = "disable-btn";
      } else {
        toggleButton.textContent = "Enable Monitoring";
        toggleButton.className = "enable-btn";
      }
    }
  });
  