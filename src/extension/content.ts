// content.ts

let isOverlayVisible = false;
let overlayElement: HTMLDivElement | null = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message, sender);
  if (message.type === 'TOGGLE_OVERLAY') {
    toggleOverlay(message.screenshot);
  } else if (message.type === 'NEXT_CAPTURE') {
    // Implement logic to show the next capture
  } else if (message.type === 'PREVIOUS_CAPTURE') {
    // Implement logic to show the previous capture
  }
});

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
  overlayElement.style.opacity = '0.7'; // Adjust as needed
  overlayElement.style.pointerEvents = 'none'; // Allows interaction with the page
  overlayElement.style.zIndex = '9999'; // Ensures it's on top

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



// function showSidebar() {
//     if (sidebarElement) {
//       sidebarElement.remove();
//     }
  
//     sidebarElement = document.createElement('div');
//     sidebarElement.id = 'ghostTabs-sidebar';
//     // Sidebar styles
//     sidebarElement.style.position = 'fixed';
//     sidebarElement.style.top = '0';
//     sidebarElement.style.right = '0';
//     sidebarElement.style.width = '200px';
//     sidebarElement.style.height = '100%';
//     sidebarElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
//     sidebarElement.style.zIndex = '10000';
//     sidebarElement.style.overflowY = 'auto';
  
//     // Clear Captures Button
//     const clearButton = document.createElement('button');
//     clearButton.textContent = 'Clear Captures';
//     clearButton.onclick = () => {
//       chrome.runtime.sendMessage({ type: 'CLEAR_CAPTURES' });
//       // Clear the captures array and update the sidebar
//       captures = [];
//       updateSidebar();
//     };
//     sidebarElement.appendChild(clearButton);
  
//     // Thumbnails
//     captures.forEach((capture) => {
//       // Thumbnail Image
//       const thumbnail = document.createElement('img');
//       thumbnail.src = capture.screenshot;
//       thumbnail.style.width = '100%';
//       thumbnail.style.cursor = 'pointer';
  
//       if (capture.id === currentCaptureId) {
//         thumbnail.classList.add('selected'); // Add CSS class for selected thumbnail
//       }
  
//       thumbnail.onclick = () => {
//         currentCaptureId = capture.id;
//         showOverlay(capture.screenshot);
//         updateSidebar();
//       };
//       sidebarElement.appendChild(thumbnail);
  
//       // Title
//       const titleDiv = document.createElement('div');
//       titleDiv.textContent = capture.title;
//       titleDiv.className = 'title';
//       sidebarElement.appendChild(titleDiv);
//     });
  
//     document.body.appendChild(sidebarElement);
//   }
  
//   function updateSidebar() {
//     // Remove existing sidebar and recreate it to reflect the updated state
//     if (sidebarElement) {
//       sidebarElement.remove();
//     }
//     showSidebar();
//   }
  





// // Create and inject the overlay container
// const overlayContainer = document.createElement('div');
// overlayContainer.id = 'ghost-tabs-overlay-container';
// document.body.appendChild(overlayContainer);

// // Track overlay visibility
// let isOverlayVisible = false;
// console.log('Content script loaded');
// // Listen for Alt+Space
// document.addEventListener('keydown', async (event) => {
//     console.log('Keydown event:', event);
//     // Check for Alt+Space
//     if (event.altKey && event.code === 'Space') {
//         console.log('Alt+Space pressed');
//         event.preventDefault(); // Prevent default browser behavior

//         if (!isOverlayVisible) {
//             // Request most recent capture from background script
//             try {
//                 const response = await chrome.runtime.sendMessage({ type: 'GET_LATEST_CAPTURE' });
//                 if (response?.capture) {
//                     showOverlay(response.capture);
//                 }
//             } catch (error) {
//                 console.error('Failed to get capture:', error);
//             }
//         } else {
//             hideOverlay();
//         }
//     }
// });

// function showOverlay(capture: { screenshot: string }) {
//     // Create overlay element which displays the screenshot as an image over the entire page
//     overlayContainer.innerHTML = `
//     <div class="ghost-tabs-overlay" 
//             style="position: fixed; 
//                 top: 0; 
//                 left: 0; 
//                 width: 100vw; 
//                 height: 100vh; 
//                 background-color: rgba(0, 0, 0, 0.3); 
//                 z-index: 2147483647; 
//                 display: flex; 
//                 justify-content: center; 
//                 align-items: center; 
//                 opacity: 0; 
//                 transition: opacity 0.2s ease-in-out;">
//         <img src="${capture.screenshot}" 
//             style="max-width: 95%; 
//                     max-height: 95%; 
//                     object-fit: contain;" />
//     </div>
//     `;

//     // Force reflow then add opacity
//     const overlay = overlayContainer.firstElementChild as HTMLElement;
//     overlay.offsetHeight; // Trigger reflow
//     overlay.style.opacity = '1';

//     isOverlayVisible = true;
// }

// function hideOverlay() {
//     const overlay = overlayContainer.firstElementChild as HTMLElement;
//     if (overlay) {
//         overlay.style.opacity = '0';
//         // Remove after fade out
//         setTimeout(() => {
//             overlayContainer.innerHTML = '';
//         }, 200);
//     }
//     isOverlayVisible = false;
// }

// // Cleanup function
// function cleanup() {
//     overlayContainer.remove();
// }

// // Listen for extension messages
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     console.log('Message received:', message, sender);
//     if (message.type === 'CLEANUP') {
//         cleanup();
//         sendResponse({ success: true });
//     }
// });