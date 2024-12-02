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
  overlayPosition?: { 
    x: number; 
    y: number;
    width: number;
    height: number; 
  };
};

let captures: TabCapture[] = [];
const MAX_CAPTURES = 20;
let currentCaptureIndex: number | null = null;

// ================================
// Helper Functions
// ================================

// Capture metadata and screenshot of the tab
// INPUT: the tab to capture
// OUTPUT: the capture object or null if capture failed
async function captureTab(tab: chrome.tabs.Tab): Promise<TabCapture | null> {
  // check if tab is capturable (exists & is not a special tab)
  if (!tab.id || !tab.url || tab.url.startsWith('chrome://')) {
    console.warn('Tab is not capturable:', tab.url);
    return null;
  }

  try {
    // Attempt to capture the tab
    const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    return {
      id: Date.now().toString(),  // Unique ID based on timestamp
      url: tab.url,               // URL of the tab
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
    // if we get the "tabs cannot be edited" error, retry once after a longer delay
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

// initialize extension upon installation or reload
// INPUT: none
// OUTPUT: none
async function initialize() {
  try {
    // load existing captures from chrome's storage
    const data = await chrome.storage.local.get('captures');
    captures = Array.isArray(data.captures) ? data.captures : [];

    // Set badge count with the number of captures
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
    // Check if we have any captures, if not, return an error
    const data = await chrome.storage.local.get('captures');
    captures = Array.isArray(data.captures) ? data.captures : [];
    if (captures.length === 0) {
      console.log('No captures available');
      sendResponse({ error: 'No captures available' });
      return true;
    }

    // return most recent capture obj
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
    currentCaptureIndex = null;
    // Reset badge to 0 correspondingly
    chrome.action.setBadgeText({ text: '0' });

    // force hide overlay in all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'RESET_OVERLAY' });
        } catch (error) {
          // Tab might not have content script loaded, that's ok
          console.log('Could not reset overlay for tab:', tab.id);
        }
      }
    }

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

// Handle user-initiated commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command:', command);
  const data = await chrome.storage.local.get('captures');
  captures = Array.isArray(data.captures) ? data.captures : [];

  switch (command) {
    // capture the active tab (Alt + C) & notify content script for toast
    case 'capture_tab': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        await handleCapture(tab);
        currentCaptureIndex = 0;
        // only send if the id of the current tab is available
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'CAPTURE_COMPLETE',
            captureCount: captures.length,
          });
        }
      }
      break;
    }
    // navigate to the next or previous capture (Alt + Right / Alt + Left)
    case 'next_capture':
    case 'previous_capture': {
      if (captures.length === 0) {
        console.log('No captures available');
        return;
      }
      // if currentCaptureIndex is null (first capture), set it to 0 
      if (currentCaptureIndex === null) {
        currentCaptureIndex = 0;
      } else {
        // the change is determined by whether the cmd is next or previous
        const delta = command === 'next_capture' ? 1 : -1;
        currentCaptureIndex = (currentCaptureIndex + delta + captures.length) % captures.length;
      }

      const currCapture = captures[currentCaptureIndex];
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      // if we have both a current capture and the id of the current tab
      if (tab?.id && currCapture) {
        // tell the content script to update the current capture with the screenshot
        chrome.tabs.sendMessage(tab.id, {
          type: 'UPDATE_CURRENT_CAPTURE',
          screenshot: currCapture.screenshot,
          idx: currentCaptureIndex,
        });
      }
      break;
    }
    // toggle the overlay (Alt + Shift + Space)
    case 'toggle_overlay': {
      console.log('Toggling overlay');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      // if we have the id of the current tab and captures available
      if (tab?.id && captures.length > 0 && currentCaptureIndex !== null) {
        const currCapture = captures[currentCaptureIndex];
        console.log('Current capture:', currCapture.title);
        if (currCapture) {
          // send message to content script to toggle overlay, showing the screenshot
          console.log('Sending message to tab', tab.id);
          chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_OVERLAY',
            screenshot: currCapture.screenshot,
          });
        }
      }
      break;
    }
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, sender);

  switch (message.type) {
    // get the latest capture for the popup
    case 'GET_LATEST_CAPTURE':
      getLatestCapture(sendResponse);
      return true;
    // clear all captures (when button is clicked in popup)
    case 'CLEAR_CAPTURES':
      clearCaptures(sendResponse);
      return true;
    // get all captures for the popup (when it opens)
    case 'GET_ALL_CAPTURES':
      chrome.storage.local.get('captures', (data) => {
        try {
          captures = Array.isArray(data.captures) ? data.captures : [];
          if (captures.length > 0 && currentCaptureIndex === null) {
            currentCaptureIndex = 0;
          }
          sendResponse({ captures, currentCaptureIndex });
        } catch (error) {
          console.error('Error getting captures:', error);
          sendResponse({ captures: [], currentCaptureIndex: null });
        }
      });
      return true;
    // get the current capture 
    case 'GET_CURRENT_CAPTURE':
      // Send current capture if available
      if (currentCaptureIndex !== null && captures.length > 0) {
        sendResponse({ capture: captures[currentCaptureIndex] });
      } else {
        sendResponse({ capture: null });
      }
      return true;
    // update overlay position for the current capture
    case 'UPDATE_OVERLAY_POSITION':
      if (currentCaptureIndex !== null && captures.length > 0) {
        // Update position for current capture
        captures[currentCaptureIndex].overlayPosition = message.position;
        // Save to storage
        chrome.storage.local.set({ captures }).catch(error => {
          console.error('Error saving overlay position:', error);
        });
      }
      return true;
    // debug by checking what's in storage
    case 'DEBUG_CHECK_STORAGE':
      chrome.storage.local.get(null, (items) => {
        console.log("All storage items:", items);
        sendResponse({ storage: items });
      });
      return true;
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// init extension on installation or startup
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);