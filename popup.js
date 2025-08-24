document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const toggleButton = document.getElementById("toggleMonitoring");
  const connectBtn = document.getElementById("connectTelegram");
  const connectionStatus = document.getElementById("connectionStatus");
  const notifyAtHalfCheckbox = document.getElementById("notifyAtHalf");
  const uploadImageBtn = document.getElementById("uploadImage");
  const imageUploadInput = document.getElementById("imageUpload");
  const opacitySlider = document.getElementById("opacitySlider");
  const opacityValue = document.getElementById("opacityValue");
  const toggleOverlayBtn = document.getElementById("toggleOverlay");
  const removeOverlayBtn = document.getElementById("removeOverlay");
  const paintModeBtn = document.getElementById("paintModeBtn");
  const moveModeBtn = document.getElementById("moveModeBtn");
  
  let currentMode = 'paint'; // 'paint' or 'move'

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
  chrome.storage.local.get(["monitoringEnabled", "notifyAtHalf", "overlaySettings", "overlayMode"], (res) => {
    updateMonitoringButton(res.monitoringEnabled !== false);
    notifyAtHalfCheckbox.checked = Boolean(res.notifyAtHalf);
    
    if (res.overlaySettings) {
      opacitySlider.value = res.overlaySettings.opacity || 50;
      opacityValue.textContent = `${opacitySlider.value}%`;
    }
    
    // Set the mode if saved
    if (res.overlayMode) {
      setMode(res.overlayMode);
    } else {
      setMode('paint');
    }
    
    // If there's a stored image, show the overlay controls as active
    chrome.storage.local.get(["overlayImage"], (result) => {
      if (result.overlayImage) {
        removeOverlayBtn.disabled = false;
        toggleOverlayBtn.disabled = false;
        opacitySlider.disabled = false;
        paintModeBtn.disabled = false;
        moveModeBtn.disabled = false;
      }
    });
  });

  // Set the current mode
function setMode(mode) {
  currentMode = mode;
  
  if (mode === 'paint') {
    paintModeBtn.classList.add('active');
    moveModeBtn.classList.remove('active');
  } else {
    paintModeBtn.classList.remove('active');
    moveModeBtn.classList.add('active');
  }
  
  // Send message to content script to update mode
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].url.includes('wplace.live')) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'setMode',
        mode: mode
      });
    }
  });
  
  chrome.storage.local.set({ overlayMode: mode });
}

  // Mode buttons
  paintModeBtn.addEventListener('click', () => setMode('paint'));
  moveModeBtn.addEventListener('click', () => setMode('move'));

  // Persist notify-at-half toggle
  notifyAtHalfCheckbox.addEventListener('change', () => {
    chrome.storage.local.set({ notifyAtHalf: notifyAtHalfCheckbox.checked });
  });

  // Image upload functionality
  uploadImageBtn.addEventListener('click', () => {
    imageUploadInput.click();
  });

  imageUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        
        // Save image data to storage
        chrome.storage.local.set({ 
          overlayImage: imageData,
          overlayVisible: true
        }, () => {
          // Send message to create or update overlay
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0] && tabs[0].url.includes('wplace.live')) {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: 'createOverlay',
                imageData: imageData,
                opacity: parseInt(opacitySlider.value) / 100,
                mode: currentMode
              });
              status.textContent = "Image uploaded successfully!";
              setTimeout(() => { status.textContent = ""; }, 3000);
            } else {
              status.textContent = "Please navigate to wplace.live first!";
              setTimeout(() => { status.textContent = ""; }, 3000);
            }
          });
          
          // Enable controls
          removeOverlayBtn.disabled = false;
          toggleOverlayBtn.disabled = false;
          opacitySlider.disabled = false;
          paintModeBtn.disabled = false;
          moveModeBtn.disabled = false;
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Opacity slider
  opacitySlider.addEventListener('input', () => {
    opacityValue.textContent = `${opacitySlider.value}%`;
    
    // Save opacity setting
    chrome.storage.local.get(["overlaySettings"], (res) => {
      const settings = res.overlaySettings || {};
      settings.opacity = parseInt(opacitySlider.value);
      chrome.storage.local.set({ overlaySettings: settings });
    });
    
    // Update overlay if it exists
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('wplace.live')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateOverlayOpacity',
          opacity: parseInt(opacitySlider.value) / 100
        });
      }
    });
  });

  // Toggle overlay visibility
  toggleOverlayBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('wplace.live')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleOverlay'
        });
        
        // Toggle stored visibility state
        chrome.storage.local.get(["overlayVisible"], (result) => {
          const newVisibility = !result.overlayVisible;
          chrome.storage.local.set({ overlayVisible: newVisibility });
          
          status.textContent = newVisibility ? "Overlay shown!" : "Overlay hidden!";
          setTimeout(() => { status.textContent = ""; }, 3000);
        });
      } else {
        status.textContent = "Please navigate to wplace.live first!";
        setTimeout(() => { status.textContent = ""; }, 3000);
      }
    });
  });

  // Remove overlay
  removeOverlayBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].url.includes('wplace.live')) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'removeOverlay'
        });
      }
      
      // Clear stored image
      chrome.storage.local.remove(["overlayImage", "overlayVisible"], () => {
        status.textContent = "Overlay removed!";
        setTimeout(() => { status.textContent = ""; }, 3000);
        
        // Disable controls
        removeOverlayBtn.disabled = true;
        toggleOverlayBtn.disabled = true;
        opacitySlider.disabled = true;
        paintModeBtn.disabled = true;
        moveModeBtn.disabled = true;
      });
    });
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
      const newState = !(res.monitoringEnabled !== false);
      
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
  
  // Initialize button states
  removeOverlayBtn.disabled = true;
  toggleOverlayBtn.disabled = true;
  opacitySlider.disabled = true;
  paintModeBtn.disabled = true;
  moveModeBtn.disabled = true;
});