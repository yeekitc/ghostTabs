// ================================
// File: content.ts
// Content script for managing overlay display
// ================================

console.log('Content script loaded for:', window.location.href);

// State
let isOverlayVisible = false;
let overlayElement: HTMLDivElement | null = null;

// ================================
// Overlay Management
// ================================

// Toggle overlay visibility upon receiving a message TOGGLE_OVERLAY
// INPUT: screenshot to display in base64 format
// OUTPUT: none
function toggleOverlay(screenshot: string) {
    if (isOverlayVisible) {
        hideOverlay();
    } else {
        showOverlay(screenshot);
    }
}

// Show overlay with screenshot
// INPUT: screenshot to display in base64 format
// OUTPUT: none
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
    overlayElement.style.opacity = '0.8';
    overlayElement.style.pointerEvents = 'none';
    overlayElement.style.zIndex = '9999';
    overlayElement.style.transition = 'opacity 0.2s ease-in-out';

    document.body.appendChild(overlayElement);
    isOverlayVisible = true;
}

// Hide overlay
// INPUT: none
// OUTPUT: none
function hideOverlay() {
    if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
    }
    isOverlayVisible = false;
}

// ================================
// Toaster Notification
// ================================

function injectToastStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .toast-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        padding: 10px 20px;
        background-color: #7BA69A;
        color: white;
        border-radius: 5px;
        font-size: 14px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.5s ease, transform 0.5s ease;
      }
      .toast-container.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
        .toast-container.hide {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
        }
    `;
    document.head.appendChild(style);
}

function showToast(message: string) {
    let toast = document.querySelector('.toast-container') as HTMLDivElement;

    // If the toast element doesn't exist, create it
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast-container';
        document.body.appendChild(toast);
    }

    // Set the message and display the toast
    toast.textContent = message;
    toast.classList.add('show');

    // Hide the toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Inject styles on content script load
injectToastStyle();

// ================================
// Message Handling
// ================================

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Content script received message from', sender, ':', message.type);

    switch (message.type) {
        // toggle overlay visibility (Alt + Shift + Space)
        case 'TOGGLE_OVERLAY':
            console.log('Toggling overlay with screenshot');
            toggleOverlay(message.screenshot);
            break;
        // update current capture with screenshot
        case 'UPDATE_CURRENT_CAPTURE':
            console.log('Updating current capture with screenshot');
            if (isOverlayVisible) {
                showOverlay(message.screenshot);
            }
            break;

        // capture complete
        case 'CAPTURE_COMPLETE':
            console.log('Capture complete:', message);
            showToast('Capture saved!');
            sendResponse({ status: 'toast-shown' });
            break;

        case 'RESET_OVERLAY':
            if (overlayElement) {
                overlayElement.remove();
                overlayElement = null;
            }
            isOverlayVisible = false;
            break;

        default:
            console.warn('Unknown message type:', message.type);
    }
});
