document.addEventListener("DOMContentLoaded", () => {
    const status = document.getElementById("status");
    const toggleButton = document.getElementById("toggleMonitoring");
    const connectBtn = document.getElementById("connectTelegram");
    const connectionStatus = document.getElementById("connectionStatus");
    const notifyAtHalfCheckbox = document.getElementById("notifyAtHalf");

    const API_BASE = 'https://wplace-companion.netlify.app/.netlify/functions';

    function generateClientId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    function ensureClientId(cb) {
      chrome.storage.local.get(["clientId"], (res) => {
        if (res.clientId) return cb(res.clientId);
        const newId = generateClientId();
        chrome.storage.local.set({ clientId: newId }, () => cb(newId));
      });
    }
  
    // Load saved values
    chrome.storage.local.get(["monitoringEnabled", "notifyAtHalf"], (res) => {
      updateMonitoringButton(res.monitoringEnabled !== false); // Default to true if not set
      notifyAtHalfCheckbox.checked = Boolean(res.notifyAtHalf);
    });

    // Persist notify-at-half toggle
    notifyAtHalfCheckbox.addEventListener('change', () => {
      chrome.storage.local.set({ notifyAtHalf: notifyAtHalfCheckbox.checked });
    });
  
    // Connect Telegram
    if (connectBtn) {
      connectBtn.addEventListener("click", () => {
        ensureClientId((clientId) => {
          status.textContent = "Opening Telegram...";
          fetch(`${API_BASE}/telegram-link-start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId })
          })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then(data => {
            if (data && data.deepLink) {
              chrome.tabs.create({ url: data.deepLink });
              status.textContent = "✅ Follow the Telegram link to connect.";
            } else {
              status.textContent = "❌ Failed to get Telegram link.";
            }
            setTimeout(() => { status.textContent = ""; }, 5000);
          })
          .catch(() => {
            status.textContent = "❌ Error starting Telegram link.";
            setTimeout(() => { status.textContent = ""; }, 5000);
          });
        });
      });
    }

    // Show connection status
    ensureClientId((clientId) => {
      fetch(`${API_BASE}/telegram-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId })
      })
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.connected) {
          connectionStatus.textContent = `Telegram: connected (${d.chatId})`;
        } else {
          connectionStatus.textContent = 'Telegram: not connected';
        }
      })
      .catch(() => { connectionStatus.textContent = 'Telegram: unknown'; });
    });

    // Test notification
    document.getElementById("test").addEventListener("click", () => {
      status.textContent = "🔄 Testing notification...";
      ensureClientId((clientId) => {
        fetch(`${API_BASE}/telegram-send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            message: "Test notification from WPlace Pixel Notifier! If you see this, your bot is working correctly."
          })
        })
        .then(res => res.json())
        .then(result => {
          if (result.ok) {
            status.textContent = "✅ Test message sent! Check your Telegram.";
          } else {
            status.textContent = `❌ Error: ${result.error || 'Failed to send.'}`;
          }
          setTimeout(() => { status.textContent = ""; }, 5000);
        })
        .catch(() => {
          status.textContent = "❌ Test failed. Are you linked to Telegram?";
          setTimeout(() => { status.textContent = ""; }, 5000);
        });
      });
    });

    // Reset notifications
    document.getElementById("reset").addEventListener("click", () => {
      chrome.storage.local.remove("lastNotificationSent", () => {
        status.textContent = "Notification state reset! You'll get notified again when pixels fill up.";
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
            status.textContent = "Monitoring enabled! Extension will check pixels automatically.";
            // Restart monitoring
            chrome.runtime.sendMessage({ action: "startMonitoring" });
          } else {
            status.textContent = "Monitoring disabled! Extension will not check pixels automatically.";
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
  