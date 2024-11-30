  type TabCapture = {
    id: string;
    url: string;
    title: string;
    screenshot: string;
    timestamp: number;
  }
  
  let captures: TabCapture[] = [];
  const MAX_CAPTURES = 20;
  let currentTabId: number | null = null;
  
  // Helper function to wait
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Safely get a tab - returns null if tab can't be accessed
  async function safeGetTab(tabId: number): Promise<chrome.tabs.Tab | null> {
    try {
      return await chrome.tabs.get(tabId);
    } catch (error) {
      console.error('Failed to get tab:', error);
      return null;
    }
  }
  
  // Check if a tab is capturable
  function isTabCapturable(tab: chrome.tabs.Tab): boolean {
    if (!tab.url) return false;
    
    // List of URL patterns that can't be captured
    const restrictedPatterns = [
      'chrome://',
      'chrome-extension://',
      'chrome-search://',
      'chrome-devtools://',
      'about:',
      'edge://',
      'brave://',
      'opera://',
      'view-source:',
      'file://'
    ];
  
    return !restrictedPatterns.some(pattern => tab.url!.startsWith(pattern));
  }
  
  // Listen for tab switches
  // Capture previous tab when switching
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log('Tab switch detected:', activeInfo);
  
    // Try to capture the previous tab first
    if (currentTabId && currentTabId !== activeInfo.tabId) {
      const previousTab = await safeGetTab(currentTabId);
      if (previousTab) {
        await attemptCapture(previousTab);
      }
    }
  
    // Update current tab ID
    currentTabId = activeInfo.tabId;
  });
  
  async function attemptCapture(tab: chrome.tabs.Tab, retries = 3): Promise<boolean> {
    console.log('Attempting to capture tab:', tab.url);
    
    if (!isTabCapturable(tab)) {
      console.log('Tab is not capturable:', tab.url);
      return false;
    }
  
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await delay(attempt * 500); // Increasingly longer delays between retries
        const capture = await captureTab(tab);
        if (capture) {
          await saveCapture(capture);
          return true;
        }
      } catch (error) {
        console.log(`Capture attempt ${attempt + 1} failed:`, error);
      }
    }
    return false;
  }
  
  async function captureTab(tab: chrome.tabs.Tab): Promise<TabCapture | null> {
    if (!tab.id) return null;
  
    try {
      console.log('Taking screenshot...');
      const screenshot = await chrome.tabs.captureVisibleTab(
        tab.windowId,
        { format: 'png' }
      );
      
      if (!screenshot) {
        console.log('Screenshot capture returned undefined');
        return null;
      }
  
      console.log('Screenshot captured successfully');
      return {
        id: Date.now().toString(),
        url: tab.url || '',
        title: tab.title || '',
        screenshot,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error during screenshot capture:', error);
      return null;
    }
  }
  
  async function saveCapture(capture: TabCapture) {
    console.log('Saving capture:', capture.title);
    captures.unshift(capture);
    
    if (captures.length > MAX_CAPTURES) {
      captures = captures.slice(0, MAX_CAPTURES);
    }
  
    try {
      await chrome.storage.local.set({ captures });
      await updateBadge();
      console.log('Capture saved successfully');
    } catch (error) {
      console.error('Error saving capture:', error);
    }
    console.log('Saved captures. Total count:', captures.length);
  }
  
  async function updateBadge() {
    const count = captures.length.toString();
    try {
      await chrome.action.setBadgeText({ text: count });
      await chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }
  
  // Initialization function
  async function initialize() {
    console.log('Initializing extension');
    
    try {
      // Load existing captures
      const data = await chrome.storage.local.get('captures');
      captures = Array.isArray(data.captures) ? data.captures : [];
      await updateBadge();
      
      // Get and capture current tab
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab?.id) {
        currentTabId = currentTab.id;
        await attemptCapture(currentTab);
      }
    } catch (error) {
      console.error('Error during initialization:', error);
      captures = [];
      await updateBadge();
    }
  }
  
  // Run initialization when extension is installed or updated
  chrome.runtime.onInstalled.addListener(initialize);
  
  // Run initialization when browser starts up
  chrome.runtime.onStartup.addListener(initialize);
  
  // Also listen for tab updates to catch URL changes
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log('Tab updated:', tabId, changeInfo, tab);
    if (changeInfo.status === 'complete' && !tab.url?.startsWith('chrome://')) {
      console.log('Tab updated:', tab);
      await delay(500); // Wait for page to settle
      const capture = await captureTab(tab);
      if (capture) {
        await saveCapture(capture);
      }
    }
  });