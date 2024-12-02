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
async function toggleOverlay(screenshot: string) {
    if (isOverlayVisible) {
        hideOverlay();
    } else {
        showOverlay(screenshot);
    }
}

// Show overlay with screenshot
// INPUT: screenshot to display in base64 format
// OUTPUT: none
async function showOverlay(screenshot: string) {
    if (overlayElement) {
        overlayElement.remove();
    }

    overlayElement = document.createElement('div');
    overlayElement.style.position = 'fixed';
    overlayElement.style.top = '20px';  // Start a bit down from top
    overlayElement.style.right = '20px'; // Start from right side
    overlayElement.style.width = '300px'; // Default width
    overlayElement.style.height = '200px'; // Default height
    overlayElement.style.backgroundImage = `url(${screenshot})`;
    overlayElement.style.backgroundSize = 'cover';
    overlayElement.style.backgroundPosition = 'center';
    overlayElement.style.opacity = '0.8';
    overlayElement.style.zIndex = '9999';
    overlayElement.style.transition = 'none'; // Remove transition for dragging
    overlayElement.style.cursor = 'move';
    overlayElement.style.border = '2px solid rgba(91, 123, 158, 0.5)'; // Add a subtle border
    
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '15px';
    resizeHandle.style.height = '15px';
    resizeHandle.style.cursor = 'se-resize';
    resizeHandle.style.background = 'rgba(91, 123, 158, 0.5)';
    overlayElement.appendChild(resizeHandle);

    document.body.appendChild(overlayElement);
    isOverlayVisible = true;

    // Add drag functionality
    setupDragging(overlayElement);
    // Add resize functionality
    setupResize(overlayElement, resizeHandle);

    // If we have saved position, use it
    const data = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_CAPTURE' });
    if (data.capture?.overlayPosition) {
        const pos = data.capture.overlayPosition;
        overlayElement.style.left = `${pos.x}px`;
        overlayElement.style.top = `${pos.y}px`;
        overlayElement.style.width = `${pos.width}px`;
        overlayElement.style.height = `${pos.height}px`;
    }
}

// Setup dragging
function setupDragging(element: HTMLElement) {
    let isDragging = false;
    let currentX: number;
    let currentY: number;
    let initialX: number;
    let initialY: number;

    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e: MouseEvent) {
        if ((e.target as HTMLElement).style.cursor === 'se-resize') return;
        
        initialX = e.clientX - element.offsetLeft;
        initialY = e.clientY - element.offsetTop;
        isDragging = true;
    }

    function drag(e: MouseEvent) {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // Constrain to window bounds
        currentX = Math.max(0, Math.min(currentX, window.innerWidth - element.offsetWidth));
        currentY = Math.max(0, Math.min(currentY, window.innerHeight - element.offsetHeight));

        element.style.left = `${currentX}px`;
        element.style.top = `${currentY}px`;
    }

    function dragEnd() {
        isDragging = false;
        savePosition(element);
    }
}

// Setup resizing
function setupResize(element: HTMLElement, handle: HTMLElement) {
    let isResizing = false;
    let originalWidth: number;
    let originalHeight: number;
    let originalX: number;
    let originalY: number;

    handle.addEventListener('mousedown', resizeStart);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', resizeEnd);

    function resizeStart(e: MouseEvent) {
        isResizing = true;
        originalWidth = element.offsetWidth;
        originalHeight = element.offsetHeight;
        originalX = e.clientX;
        originalY = e.clientY;
        e.stopPropagation(); // Prevent dragging from starting
    }

    function resize(e: MouseEvent) {
        if (!isResizing) return;
    
        const width = originalWidth + (e.clientX - originalX);
        const height = originalHeight + (e.clientY - originalY);
    
        // Minimum and maximum size constraints
        const maxWidth = window.innerWidth - element.offsetLeft;  // Can't exceed window width
        const maxHeight = window.innerHeight - element.offsetTop; // Can't exceed window height
        
        const clampedWidth = Math.max(100, Math.min(width, maxWidth));
        const clampedHeight = Math.max(100, Math.min(height, maxHeight));
    
        element.style.width = `${clampedWidth}px`;
        element.style.height = `${clampedHeight}px`;
    }

    function resizeEnd() {
        isResizing = false;
        savePosition(element);
    }
}

// Save position periodically during drag/resize
function savePosition(element: HTMLElement) {
    const position = {
        x: element.offsetLeft,
        y: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight
    };
    chrome.runtime.sendMessage({ 
        type: 'UPDATE_OVERLAY_POSITION', 
        position 
    });
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
            // Create a promise for the async operation
            toggleOverlay(message.screenshot).catch(error => {
                console.error('Error toggling overlay:', error);
            });
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
