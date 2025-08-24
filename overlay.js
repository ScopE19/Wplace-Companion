// overlay.js - Content script for image overlay functionality

(function() {
  let overlay = null;
  let currentMode = 'paint';
  let toggleHandle = null;
  
  // Inject the overlay styles
  const overlayStyles = document.createElement('link');
  overlayStyles.rel = 'stylesheet';
  overlayStyles.href = chrome.runtime.getURL('overlay.css');
  document.head.appendChild(overlayStyles);
  
  // Create the overlay element
  function createOverlay(imageData, opacity = 0.5, mode = 'paint') {
    // Remove existing overlay if any
    removeOverlay();
    
    overlay = document.createElement('div');
    overlay.id = 'wplace-overlay';
    overlay.style.opacity = opacity;
    
    // Create image element
    const img = document.createElement('img');
    img.src = imageData;
    overlay.appendChild(img);
    
    // Create resize handles for all corners and edges
    const positions = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${pos}`;
      overlay.appendChild(handle);
    });
    
    // Create mode toggle handle
    toggleHandle = document.createElement('div');
    toggleHandle.className = 'toggle-handle';
    toggleHandle.textContent = currentMode === 'paint' ? 'M' : 'P';
    toggleHandle.title = currentMode === 'paint' ? 'Switch to Move mode' : 'Switch to Paint mode';
    toggleHandle.addEventListener('click', (e) => {
      e.stopPropagation();
      const newMode = currentMode === 'paint' ? 'move' : 'paint';
      setMode(newMode);
      
      // Notify popup of mode change
      chrome.runtime.sendMessage({
        action: 'overlayModeChanged',
        mode: newMode
      });
    });
    overlay.appendChild(toggleHandle);
    
    document.body.appendChild(overlay);
    
    // Position in the center initially
    positionOverlay();
    
    // Set the initial mode
    setMode(mode);
    
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
      toggleHandle = null;
    }
  }
  
  // Toggle overlay visibility
  function toggleOverlay() {
    if (!overlay) {
      // Try to restore from storage if overlay doesn't exist
      chrome.storage.local.get(["overlayImage"], (result) => {
        if (result.overlayImage) {
          chrome.storage.local.get(["overlaySettings", "overlayMode"], (settings) => {
            createOverlay(
              result.overlayImage, 
              (settings.overlaySettings?.opacity || 50) / 100,
              settings.overlayMode || 'paint'
            );
          });
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
  
  // Set the current mode
  function setMode(mode) {
    currentMode = mode;
    
    if (overlay) {
      if (mode === 'paint') {
        overlay.classList.remove('move-mode');
        overlay.style.pointerEvents = 'none';
        overlay.style.cursor = 'default';
      } else {
        overlay.classList.add('move-mode');
        overlay.style.pointerEvents = 'auto';
        overlay.style.cursor = 'move';
      }
    }
    
    // Update toggle handle text
    if (toggleHandle) {
      toggleHandle.textContent = mode === 'paint' ? 'M' : 'P';
      toggleHandle.title = mode === 'paint' ? 'Switch to Move mode' : 'Switch to Paint mode';
    }
  }
  
  // Setup drag and resize functionality
  function setupDragAndResize(overlay) {
    let isDragging = false;
    let isResizing = false;
    let startX, startY;
    let initialLeft, initialTop, initialWidth, initialHeight;
    let resizeDirection = '';
    
    // Mouse down event for both dragging and resizing
    overlay.addEventListener('mousedown', (e) => {
      // Only handle events in move mode or when clicking on handles
      if (currentMode !== 'move' && !e.target.classList.contains('resize-handle') && 
          !e.target.classList.contains('toggle-handle')) {
        return;
      }
      
      // Check if a resize handle was clicked
      if (e.target.classList.contains('resize-handle')) {
        isResizing = true;
        const classList = e.target.classList;
        resizeDirection = Array.from(classList).find(cls => cls.startsWith('resize-')).split('-')[1];
        
        // Store initial dimensions
        initialWidth = parseInt(window.getComputedStyle(overlay).width, 10);
        initialHeight = parseInt(window.getComputedStyle(overlay).height, 10);
        initialLeft = parseInt(window.getComputedStyle(overlay).left, 10);
        initialTop = parseInt(window.getComputedStyle(overlay).top, 10);
      } else if (e.target === overlay || e.target.tagName === 'IMG') {
        // Otherwise, it's a drag operation
        isDragging = true;
        
        // Store initial position
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
        overlay.style.cursor = currentMode === 'move' ? 'move' : 'default';
      }
      
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', stopInteraction);
    }
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'createOverlay':
        createOverlay(request.imageData, request.opacity, request.mode);
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
      case 'setMode':
        setMode(request.mode);
        break;
    }
  });
  
  // Try to restore overlay on page load
  chrome.storage.local.get(["overlayImage", "overlayVisible", "overlayPosition", "overlayMode"], (result) => {
    if (result.overlayImage && result.overlayVisible !== false) {
      chrome.storage.local.get(["overlaySettings"], (settings) => {
        createOverlay(
          result.overlayImage, 
          (settings.overlaySettings?.opacity || 50) / 100,
          result.overlayMode || 'paint'
        );
        
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
      });
    }
  });
  
  // Listen for mode changes from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'overlayModeChanged') {
      setMode(request.mode);
    }
  });
})();