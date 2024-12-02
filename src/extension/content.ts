// ================================
// File: content.ts
// Content script for managing overlay display
// ================================

// State
let isOverlayVisible = false;
let overlayElement: HTMLDivElement | null = null;

// ================================
// Overlay Management
// ================================

function toggleOverlay(screenshot: string) {
  if (isOverlayVisible) {
    hideOverlay();
  } else {
    showOverlay(screenshot);
  }
}

function showOverlay(screenshot: string) {
  if (overlayElement) {
    overlayElement.remove();
  }

  overlayElement = document.createElement('div');
  overlayElement.style.position = 'fixed';
  overlayElement.style.top = '0';
  overlayElement.style.left = '0';
  overlayElement.style.width = '100%';
  overlayElement.style.height = '100%';
  overlayElement.style.backgroundImage = `url(${screenshot})`;
  overlayElement.style.backgroundSize = 'cover';
  overlayElement.style.backgroundPosition = 'center';
  overlayElement.style.opacity = '0.7';
  overlayElement.style.pointerEvents = 'none';
  overlayElement.style.zIndex = '9999';
  overlayElement.style.transition = 'opacity 0.2s ease-in-out';

  document.body.appendChild(overlayElement);
  isOverlayVisible = true;
}

function hideOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  isOverlayVisible = false;
}

// ================================
// Message Handling
// ================================

chrome.runtime.onMessage.addListener((message, sender) => {
  console.log('Content script received message:', message.type);

  switch (message.type) {
    case 'TOGGLE_OVERLAY':
      toggleOverlay(message.screenshot);
      break;
      
    case 'UPDATE_CURRENT_CAPTURE':
      if (isOverlayVisible) {
        showOverlay(message.screenshot);
      }
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});