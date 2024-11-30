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
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Main capture logic
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
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

// ================================
// Event Listeners
// ================================

// Handle tab activation (switching)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab) {
      await handleCapture(tab);
    }
  } catch (error) {
    console.error('Error capturing tab:', error);
  }
});

// Handle tab update
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log('Tab updated:', tabId, changeInfo, tab);
  // Capture tab on complete load
  if (changeInfo.status === 'complete') {
    await delay(500); // Wait for page to settle
    await handleCapture(tab);
  }
});

// Initialize extension on installation or startup
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);
