import { useState, useEffect } from 'react'
import './App.css'

// Define the type for our captures
type TabCapture = {
  id: string;
  url: string;
  title: string;
  screenshot: string;
  timestamp: number;
}

function App() {
  const [captures, setCaptures] = useState<TabCapture[]>([]);

  useEffect(() => {
    // Load captures when popup opens
    const loadCaptures = async () => {
      const result = await chrome.storage.local.get('captures');
      setCaptures(result.captures || []);
    };
    
    loadCaptures();
  }, []);

  const handleClearCaptures = async () => {
    await chrome.storage.local.set({ captures: [] });
    setCaptures([]);
  };

  return (
    <div className="p-4 max-w-md">
      <h1 className="text-xl font-bold mb-4">GhostTabs Debug</h1>
      
      {/* Status information */}
      <div className="mb-4 p-2 bg-gray-100 rounded">
        <div>Total Captures: {captures.length}</div>
        <div>Latest Capture: {captures[0]?.timestamp ? 
          new Date(captures[0].timestamp).toLocaleString() : 
          'None'}
        </div>
      </div>

      {/* Display captures */}
      <div className="space-y-4">
        {captures.map((capture) => (
          <div key={capture.id} className="border p-2 rounded">
            <div className="font-medium">{capture.title}</div>
            <div className="text-sm text-gray-600">{capture.url}</div>
            <div className="text-xs text-gray-500">
              {new Date(capture.timestamp).toLocaleString()}
            </div>
            <img 
              src={capture.screenshot} 
              alt={capture.title}
              className="mt-2 w-full h-auto border rounded"
            />
          </div>
        ))}
      </div>

      {/* Debug controls */}
      <div className="mt-4">
        <button
          onClick={handleClearCaptures}
          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Clear All Captures
        </button>
      </div>
    </div>
  )
}

export default App

// // import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   // const [count, setCount] = useState(0)

//   const onclick = async () => {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//     chrome.scripting.executeScript({
//       target: { tabId: tab.id! },
//       func: () => {
//         console.log('hello from the tab');
//         document.body.style.backgroundColor = 'red';
//       }
//     });
//   }

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>GhostTabs</h1>
//       <div className="card">
//         <button onClick={onclick}>
//           Click me!
//         </button>
//         <p>
//           Edit <code>src/App.tsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
