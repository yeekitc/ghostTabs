// ================================
// File: background.ts
// Background script for capturing and saving screenshots of active tabs
// ================================

type TabCapture = {
  id: string;
  url: string;
  title: string;
  screenshot: string;
  timestamp: number;
};

let captures: TabCapture[] = [];
const MAX_CAPTURES = 20;
// let currentTabId: number | null = null;
let currentCaptureIndex: number | null = null;

// ================================
// Helper Functions
// ================================

// Capture metadata and screenshot of the tab
// INPUT: the tab to capture
// OUTPUT: the capture object or null if capture failed
async function captureTab(tab: chrome.tabs.Tab): Promise<TabCapture | null> {
  // Check if tab is capturable (exists & is not a special tab)
  if (!tab.id || !tab.url || tab.url.startsWith('chrome://')) {
    console.warn('Tab is not capturable:', tab.url);
    return null;
  }

  try {
    // Attempt to capture the tab
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    return {
      id: Date.now().toString(), // Unique ID based on timestamp
      url: tab.url, // URL of the tab
      title: tab.title || 'Untitled', // Title of the tab (default to 'Untitled')
      screenshot, // Base64-encoded PNG screenshot
      timestamp: Date.now(), // Timestamp of the capture
    };
  } catch (error) {
    console.error('Error capturing tab:', error);
    return null;
  }
}

// Save capture and update badge
// INPUT: the capture object to save
// OUTPUT: success status
async function saveCapture(capture: TabCapture) {
  // Add capture to the beginning of the array
  captures.unshift(capture);
  // but keep only the last MAX_CAPTURES (20)
  if (captures.length > MAX_CAPTURES) {
    captures = captures.slice(0, MAX_CAPTURES);
  }

  // Save to storage
  await chrome.storage.local.set({ captures });

  // Update badge
  chrome.action.setBadgeText({ text: captures.length.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

// Helper function to wait
// INPUT: time in milliseconds
// OUTPUT: promise that resolves after time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main capture logic
// INPUT: the tab to capture
// OUTPUT: none
async function handleCapture(tab: chrome.tabs.Tab) {
  try {
    // Wait a short moment before capturing
    await delay(150);
    const capture = await captureTab(tab);
    if (capture) {
      await saveCapture(capture);
    }
  } catch (error) {
    console.error('Error in handleCapture:', error);
    // If we get the "tabs cannot be edited" error, retry once after a longer delay
    if (error) {
      console.log('Retrying capture in 500ms...');
      try {
        await delay(500);
        const capture = await captureTab(tab);
        if (capture) {
          await saveCapture(capture);
        }
      } catch (retryError) {
        console.error('Retry capture failed:', retryError);
      }
    }
  }
}

// Initialize extension upon installation or reload
async function initialize() {
  try {
    // Load existing captures from storage
    const data = await chrome.storage.local.get('captures');
    captures = Array.isArray(data.captures) ? data.captures : [];

    // Set badge count
    chrome.action.setBadgeText({ text: captures.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });

    // Initialize currentCaptureIndex
    currentCaptureIndex = captures.length > 0 ? 0 : null;
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// ================================
// Message Handling
// ================================
async function getLatestCapture(sendResponse: (response: any) => void) {
  try {
    // Check if we have any captures
    if (captures.length === 0) {
      console.log('No captures available');
      sendResponse({ error: 'No captures available' });
      return true;
    }

    // Return most recent capture
    const latestCapture = captures[0];
    console.log('Sending latest capture:', latestCapture.title);
    sendResponse({ capture: latestCapture });
  } catch (error) {
    console.error('Error handling GET_LATEST_CAPTURE:', error);
    sendResponse({ error: 'Failed to get latest capture' });
  }
}

async function clearCaptures(sendResponse: (response: any) => void) {
  try {
    // Clear all captures
    captures = [];
    await chrome.storage.local.set({ captures: [] });
    // Reset badge
    chrome.action.setBadgeText({ text: '0' });

    console.log('All captures cleared');
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error clearing captures:', error);
    sendResponse({ error: 'Failed to clear captures' });
  }
}


// ================================
// Event Listeners
// ================================

// Handle tab activation (switching)
// chrome.tabs.onActivated.addListener(async (activeInfo) => {
//   const prevTabId = currentTabId;
//   // Update currentTabId to the new active tab
//   currentTabId = activeInfo.tabId;
//   // capture the previous tab if it's different from the current active tab
//   if (prevTabId && prevTabId !== activeInfo.tabId) {
//     try {
//       const prevTab = await chrome.tabs.get(prevTabId);
//       if (prevTab) {
//         await handleCapture(prevTab);
//       }
//     } catch (error) {
//       console.error('Error capturing tab:', error);
//     }
//   }
// });

// Handle user-initiated capture
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command:', command);
  if (command === 'capture_tab') {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      handleCapture(tab);
      currentCaptureIndex = 0;
    }
  } else if (command === 'next_capture') {
    // find the target tab (the next newest one) in storage
    // should we keep track of the index of the current tab?
    if (captures.length === 0) {
      console.log('No captures available');
      return;
    }

    if (currentCaptureIndex === null) {
      currentCaptureIndex = 0;
    } else {
      currentCaptureIndex = (currentCaptureIndex + 1) % captures.length;
    }

    const currCapture = captures[currentCaptureIndex];
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && currCapture) {
      // send message to content script to update current capture
      chrome.tabs.sendMessage(tab.id, { 
        type: 'UPDATE_CURRENT_CAPTURE',
        screenshot: currCapture.screenshot,
        idx: currentCaptureIndex,
      });
      // show popup while cycling through captures
      chrome.action.openPopup();
    }
  } else if (command === 'previous_capture') {
    // find the target tab (the previous one) in storage
    if (captures.length === 0) {
      console.log('No captures available');
      return;
    }

    if (currentCaptureIndex === null) {
      currentCaptureIndex = 0;
    } else {
      currentCaptureIndex = (currentCaptureIndex - 1 + captures.length) % captures.length;
    }

    const currCapture = captures[currentCaptureIndex];
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && currCapture) {
      // send message to content script to update current capture
      chrome.tabs.sendMessage(tab.id, { 
        type: 'UPDATE_CURRENT_CAPTURE',
        screenshot: currCapture.screenshot,
        idx: currentCaptureIndex,
      });
      // show popup while cycling through captures
      chrome.action.openPopup();
    }
  } else if (command === '_execute_action') {
    // toggle the overlay on the current tab
    // send a message to the content script to toggle the overlay
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id && captures.length > 0 && currentCaptureIndex !== null) {
      const currCapture = captures[currentCaptureIndex];
      if (currCapture) {
        // send message to content script to toggle overlay
        chrome.tabs.sendMessage(tab.id, { 
          type: 'TOGGLE_OVERLAY',
          screenshot: currCapture.screenshot,
        });
      } else {
        console.warn('No capture found at index:', currentCaptureIndex);
      }
    }
  } else {
    console.warn('Unknown command:', command);
  }
});

// Initialize extension on installation or startup
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, sender);
  if (message.type === 'GET_LATEST_CAPTURE') {
    getLatestCapture(sendResponse);
    return true; 
  } else if (message.type === 'CLEAR_CAPTURES') {
    clearCaptures(sendResponse);
    return true;
  } else if (message.type === 'GET_ALL_CAPTURES') {
    sendResponse({ captures, currentCaptureIndex });
    return true;
  } else {
    console.warn('Unknown message type:', message.type);
  }
});