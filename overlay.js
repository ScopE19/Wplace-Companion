// overlay.js - Content script for image overlay functionality

(function() {
    let overlay = null;
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let isResizing = false;
    let initialWidth, initialHeight, resizeHandle;
    
    // Create the overlay element
    function createOverlay(imageData, opacity = 0.5) {
      // Remove existing overlay if any
      removeOverlay();
      
      overlay = document.createElement('div');
      overlay.id = 'wplace-overlay';
      overlay.style.position = 'fixed';
      overlay.style.zIndex = '9999';
      overlay.style.border = '2px dashed #fff';
      overlay.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      overlay.style.cursor = 'move';
      overlay.style.userSelect = 'none';
      overlay.style.opacity = opacity;
      overlay.style.maxWidth = '80%';
      overlay.style.maxHeight = '80%';
      
      // Create image element
      const img = document.createElement('img');
      img.src = imageData;
      img.style.display = 'block';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'contain';
      
      // Create resize handle
      const resizeHandle = document.createElement('div');
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.right = '0';
      resizeHandle.style.bottom = '0';
      resizeHandle.style.width = '15px';
      resizeHandle.style.height = '15px';
      resizeHandle.style.background = '#fff';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.borderRadius = '2px';
      
      overlay.appendChild(img);
      overlay.appendChild(resizeHandle);
      document.body.appendChild(overlay);
      
      // Position in the center initially
      positionOverlay();
      
      // Add event listeners
      overlay.addEventListener('mousedown', startDrag);
      resizeHandle.addEventListener('mousedown', startResize);
      
      // Save overlay state
      chrome.storage.local.set({ 
        overlayVisible: true,
        overlayPosition: {
          left: overlay.style.left,
          top: overlay.style.top,
          width: overlay.style.width,
          height: overlay.style.height
        }
      });
    }
    
    // Position overlay in the center
    function positionOverlay() {
      if (!overlay) return;
      
      overlay.style.left = '50%';
      overlay.style.top = '50%';
      overlay.style.transform = 'translate(-50%, -50%)';
      overlay.style.width = '400px';
      overlay.style.height = '400px';
    }
    
    // Remove overlay
    function removeOverlay() {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
        overlay = null;
      }
      
      // Update storage
      chrome.storage.local.set({ overlayVisible: false });
    }
    
    // Toggle overlay visibility
    function toggleOverlay() {
      if (!overlay) {
        // Try to restore from storage if overlay doesn't exist
        chrome.storage.local.get(["overlayImage"], (result) => {
          if (result.overlayImage) {
            createOverlay(result.overlayImage);
          }
        });
        return;
      }
      
      if (overlay.style.display === 'none') {
        overlay.style.display = 'block';
        chrome.storage.local.set({ overlayVisible: true });
      } else {
        overlay.style.display = 'none';
        chrome.storage.local.set({ overlayVisible: false });
      }
    }
    
    // Update overlay opacity
    function updateOverlayOpacity(opacity) {
      if (overlay) {
        overlay.style.opacity = opacity;
      }
    }
    
    // Drag functionality
    function startDrag(e) {
      if (e.target.tagName === 'IMG' || e.target === overlay) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseInt(window.getComputedStyle(overlay).left, 10);
        initialTop = parseInt(window.getComputedStyle(overlay).top, 10);
        
        overlay.style.cursor = 'grabbing';
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        e.preventDefault();
      }
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      overlay.style.left = `${initialLeft + dx}px`;
      overlay.style.top = `${initialTop + dy}px`;
      overlay.style.transform = 'none'; // Remove centering transform
      
      // Save position
      chrome.storage.local.set({
        overlayPosition: {
          left: overlay.style.left,
          top: overlay.style.top,
          width: overlay.style.width,
          height: overlay.style.height
        }
      });
    }
    
    function stopDrag() {
      isDragging = false;
      if (overlay) {
        overlay.style.cursor = 'move';
      }
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', stopDrag);
    }
    
    // Resize functionality
    function startResize(e) {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      initialWidth = parseInt(window.getComputedStyle(overlay).width, 10);
      initialHeight = parseInt(window.getComputedStyle(overlay).height, 10);
      resizeHandle = e.target;
      
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
      e.preventDefault();
      e.stopPropagation();
    }
    
    function resize(e) {
      if (!isResizing) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      const newWidth = Math.max(100, initialWidth + dx);
      const newHeight = Math.max(100, initialHeight + dy);
      
      overlay.style.width = `${newWidth}px`;
      overlay.style.height = `${newHeight}px`;
      
      // Save size
      chrome.storage.local.set({
        overlayPosition: {
          left: overlay.style.left,
          top: overlay.style.top,
          width: overlay.style.width,
          height: overlay.style.height
        }
      });
    }
    
    function stopResize() {
      isResizing = false;
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    }
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'createOverlay':
          createOverlay(request.imageData, request.opacity);
          break;
        case 'toggleOverlay':
          toggleOverlay();
          break;
        case 'removeOverlay':
          removeOverlay();
          break;
        case 'updateOverlayOpacity':
          updateOverlayOpacity(request.opacity);
          break;
      }
    });
    
    // Try to restore overlay on page load
    chrome.storage.local.get(["overlayImage", "overlayVisible", "overlayPosition"], (result) => {
      if (result.overlayImage && result.overlayVisible) {
        createOverlay(result.overlayImage);
        
        // Restore position if available
        if (result.overlayPosition && overlay) {
          overlay.style.left = result.overlayPosition.left || '50%';
          overlay.style.top = result.overlayPosition.top || '50%';
          overlay.style.width = result.overlayPosition.width || '400px';
          overlay.style.height = result.overlayPosition.height || '400px';
          
          if (result.overlayPosition.left && result.overlayPosition.top) {
            overlay.style.transform = 'none';
          }
        }
      }
    });
  })();