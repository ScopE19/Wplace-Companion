const API_BASE = 'https://wplace-companion.netlify.app/.netlify/functions';

function ensureClientId(callback) {
  chrome.storage.local.get(["clientId"], (res) => {
    if (res.clientId) return callback(res.clientId);
    const newId = crypto.getRandomValues ? [...crypto.getRandomValues(new Uint8Array(16))].map(b=>b.toString(16).padStart(2,'0')).join('') : `${Date.now()}-${Math.random()}`;
    chrome.storage.local.set({ clientId: newId }, () => callback(newId));
  });
}

function checkPixels() {
  chrome.storage.local.get(["lastNotificationSent", "monitoringEnabled", "notifyAtHalf", "lastHalfNotificationSent"], (data) => {
    const { lastNotificationSent, monitoringEnabled, notifyAtHalf, lastHalfNotificationSent } = data;
    
    if (monitoringEnabled === false) {
      console.log("Monitoring is disabled. Skipping pixel check.");
      return;
    }

    console.log("Checking pixel count...");
    
    fetch("https://backend.wplace.live/me", {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error("Not logged into WPlace. Please log in to wplace.live first.");
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(user => {
        console.log("User data received:", user);
        
        if (user.charges && user.charges.count >= user.charges.max) {
          const currentPixelState = `${user.charges.count}_${user.charges.max}`;
          
          if (lastNotificationSent === currentPixelState) {
            console.log("Pixels are still full, but notification already sent. Skipping...");
            return;
          }
          
          console.log("Pixels are full, requesting backend to send Telegram message...");

          const message = `Your Wplace pixels are FULL (${user.charges.count}/${user.charges.max})`;

          ensureClientId((clientId) => {
            fetch(`${API_BASE}/telegram-send`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientId, message })
            })
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json();
            })
            .then(result => {
              if (result.ok) {
                console.log("Backend sent Telegram message successfully!");
                chrome.storage.local.set({ lastNotificationSent: currentPixelState });
              } else {
                console.error("Backend /telegram-send error:", result.error || result);
              }
            })
            .catch(err => console.error("Backend /telegram-send error:", err));
          });
        } else {
          // Optional half notification
          if (notifyAtHalf && user.charges && user.charges.max) {
            const isAtLeastHalf = user.charges.count >= Math.floor(user.charges.max / 2);
            const halfState = `half_${user.charges.max}`;
            if (isAtLeastHalf && lastHalfNotificationSent !== halfState) {
              ensureClientId((clientId) => {
                const msg = `Your Wplace pixels are at least half full (${user.charges.count}/${user.charges.max})`;
                fetch(`${API_BASE}/telegram-send`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ clientId, message: msg })
                })
                .then(res => res.json())
                .then(result => {
                  if (result.ok) {
                    chrome.storage.local.set({ lastHalfNotificationSent: halfState });
                  }
                })
                .catch(() => {});
              });
            }
            if (user.charges.count < Math.floor(user.charges.max / 2) && lastHalfNotificationSent) {
              chrome.storage.local.remove("lastHalfNotificationSent");
            }
          }

          if (lastNotificationSent) {
            console.log("Pixels are no longer full, clearing notification state...");
            chrome.storage.local.remove("lastNotificationSent");
          }
          console.log(`Pixels not full: ${user.charges?.count || 0}/${user.charges?.max || 0}`);
        }
      })
      .catch(err => {
        console.error("Error fetching pixel count:", err);
        if (err.message.includes("Not logged into WPlace")) {
          console.error("Please log into wplace.live in this browser tab first.");
        }
      });
  });
}

// Create a more human-like checking pattern with random intervals
function scheduleNextCheck() {
  // Check if monitoring is enabled before scheduling
  chrome.storage.local.get(["monitoringEnabled"], (data) => {
    if (data.monitoringEnabled === false) {
      console.log("Monitoring is disabled. Not scheduling next check.");
      return;
    }
    
    // Random interval between 2-5 minutes (120-300 seconds) to avoid detection
    const minInterval = 2; // 2 minutes
    const maxInterval = 5; // 5 minutes
    const randomMinutes = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;
    
    console.log(`Scheduling next check in ${randomMinutes} minutes...`);
    
    chrome.alarms.create("pixelCheck", { delayInMinutes: randomMinutes });
  });
}

// Run once when the service worker is loaded
chrome.runtime.onInstalled.addListener(() => {
  console.log("WPlace Pixel Notifier installed. Creating first check...");
  // Start with a random delay to avoid predictable patterns
  const initialDelay = Math.floor(Math.random() * 3) + 1; // 1-3 minutes
  chrome.alarms.create("pixelCheck", { delayInMinutes: initialDelay });
});

// Listen for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pixelCheck") {
    checkPixels();
    // Schedule the next check with random interval
    scheduleNextCheck();
  }
});

// Handle messages from popup/options
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkPixels") {
    checkPixels();
    sendResponse({ success: true });
  } else if (request.action === "startMonitoring") {
    console.log("Starting monitoring...");
    scheduleNextCheck();
    sendResponse({ success: true });
  } else if (request.action === "stopMonitoring") {
    console.log("Stopping monitoring...");
    chrome.alarms.clear("pixelCheck");
    sendResponse({ success: true });
  }
});
  