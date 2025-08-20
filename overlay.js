// overlay.js - Content script for image overlay functionality

(function() {
    if (window.__wplace_overlay_injected__) return;
  window.__wplace_overlay_injected__ = true;
    let overlay = null;
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let isResizing = false;
    let initialWidth, initialHeight, resizeHandle;
    
    // Create the overlay element
    // Replace the existing createOverlay function with this updated version
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
    img.style.pointerEvents = 'none'; // Allow clicks to pass through to overlay
    
    // Create resize handles for all corners and edges
    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${pos}`;
      handle.style.position = 'absolute';
      handle.style.backgroundColor = '#fff';
      handle.style.borderRadius = '2px';
      handle.style.zIndex = '10000';
      
      // Position and size based on handle type
      if (pos === 'nw' || pos === 'ne' || pos === 'se' || pos === 'sw') {
        // Corner handles
        handle.style.width = '10px';
        handle.style.height = '10px';
        
        if (pos.includes('n')) handle.style.top = '0';
        if (pos.includes('s')) handle.style.bottom = '0';
        if (pos.includes('w')) handle.style.left = '0';
        if (pos.includes('e')) handle.style.right = '0';
        
        // Set appropriate cursor
        if (pos === 'nw') handle.style.cursor = 'nwse-resize';
        if (pos === 'ne') handle.style.cursor = 'nesw-resize';
        if (pos === 'se') handle.style.cursor = 'nwse-resize';
        if (pos === 'sw') handle.style.cursor = 'nesw-resize';
      } else {
        // Edge handles
        if (pos === 'n' || pos === 's') {
          handle.style.height = '5px';
          handle.style.left = '5px';
          handle.style.right = '5px';
          handle.style.cursor = 'ns-resize';
          if (pos === 'n') handle.style.top = '0';
          if (pos === 's') handle.style.bottom = '0';
        } else {
          handle.style.width = '5px';
          handle.style.top = '5px';
          handle.style.bottom = '5px';
          handle.style.cursor = 'ew-resize';
          if (pos === 'e') handle.style.right = '0';
          if (pos === 'w') handle.style.left = '0';
        }
      }
      
      overlay.appendChild(handle);
    });
    
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    
    // Position in the center initially
    positionOverlay();
    
    // Add event listeners for dragging and resizing
    setupDragAndResize(overlay);
    
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
  
  // Replace the existing drag and resize functions with this comprehensive function
  function setupDragAndResize(overlay) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY;
    let initialLeft, initialTop, initialWidth, initialHeight;
    let resizeDirection = '';
    
    // Mouse down event for both dragging and resizing
    overlay.addEventListener('mousedown', (e) => {
      // Check if a resize handle was clicked
      if (e.target.classList.contains('resize-handle')) {
        isResizing = true;
        resizeDirection = e.target.classList[1].split('-')[1]; // Get direction from class
        
        // Store initial dimensions
        initialWidth = parseInt(window.getComputedStyle(overlay).width, 10);
        initialHeight = parseInt(window.getComputedStyle(overlay).height, 10);
        initialLeft = parseInt(window.getComputedStyle(overlay).left, 10);
        initialTop = parseInt(window.getComputedStyle(overlay).top, 10);
      } else {
        // Otherwise, it's a drag operation
        isDragging = true;
        
        // Store initial position
        startX = e.clientX;
        startY = e.clientY;
        initialLeft = parseInt(window.getComputedStyle(overlay).left, 10);
        initialTop = parseInt(window.getComputedStyle(overlay).top, 10);
        
        overlay.style.cursor = 'grabbing';
      }
      
      // Store starting point for both operations
      startX = e.clientX;
      startY = e.clientY;
      
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', stopInteraction);
      e.preventDefault();
    });
    
    // Handle mouse movement for both dragging and resizing
    function handleMove(e) {
      if (isDragging) {
        // Handle dragging
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        overlay.style.left = `${initialLeft + dx}px`;
        overlay.style.top = `${initialTop + dy}px`;
        overlay.style.transform = 'none'; // Remove centering transform
      } else if (isResizing) {
        // Handle resizing based on direction
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        let newWidth = initialWidth;
        let newHeight = initialHeight;
        let newLeft = initialLeft;
        let newTop = initialTop;
        
        // Calculate new dimensions based on resize direction
        if (resizeDirection.includes('e')) {
          newWidth = Math.max(50, initialWidth + dx);
        }
        if (resizeDirection.includes('w')) {
          newWidth = Math.max(50, initialWidth - dx);
          newLeft = initialLeft + dx;
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(50, initialHeight + dy);
        }
        if (resizeDirection.includes('n')) {
          newHeight = Math.max(50, initialHeight - dy);
          newTop = initialTop + dy;
        }
        
        // Apply new dimensions and position
        overlay.style.width = `${newWidth}px`;
        overlay.style.height = `${newHeight}px`;
        
        if (resizeDirection.includes('w')) {
          overlay.style.left = `${newLeft}px`;
        }
        if (resizeDirection.includes('n')) {
          overlay.style.top = `${newTop}px`;
        }
      }
      
      // Save position/size
      chrome.storage.local.set({
        overlayPosition: {
          left: overlay.style.left,
          top: overlay.style.top,
          width: overlay.style.width,
          height: overlay.style.height
        }
      });
    }
    
    // Clean up after interaction
    function stopInteraction() {
      isDragging = false;
      isResizing = false;
      resizeDirection = '';
      
      if (overlay) {
        overlay.style.cursor = 'move';
      }
      
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', stopInteraction);
    }
  }
  
  // Add this CSS to your overlay.js (or include it in your popup.html)
  const overlayStyles = `
    .resize-handle {
      position: absolute;
      background-color: #fff;
      border-radius: 2px;
      z-index: 10000;
    }
    .resize-nw {
      width: 10px;
      height: 10px;
      top: 0;
      left: 0;
      cursor: nwse-resize;
    }
    .resize-n {
      height: 5px;
      left: 5px;
      right: 5px;
      top: 0;
      cursor: ns-resize;
    }
    .resize-ne {
      width: 10px;
      height: 10px;
      top: 0;
      right: 0;
      cursor: nesw-resize;
    }
    .resize-e {
      width: 5px;
      top: 5px;
      bottom: 5px;
      right: 0;
      cursor: ew-resize;
    }
    .resize-se {
      width: 10px;
      height: 10px;
      bottom: 0;
      right: 0;
      cursor: nwse-resize;
    }
    .resize-s {
      height: 5px;
      left: 5px;
      right: 5px;
      bottom: 0;
      cursor: ns-resize;
    }
    .resize-sw {
      width: 10px;
      height: 10px;
      bottom: 0;
      left: 0;
      cursor: nesw-resize;
    }
    .resize-w {
      width: 5px;
      top: 5px;
      bottom: 5px;
      left: 0;
      cursor: ew-resize;
    }
  `;
  
  // Inject the styles when the script loads
  const styleSheet = document.createElement("style");
  styleSheet.innerText = overlayStyles;
  document.head.appendChild(styleSheet);
    
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