// ======================
// File: App.tsx
// React component for the GhostTabs popup
// ======================

import { useState, useEffect } from 'react'
import './App.css'

// def type for our captures
type TabCapture = {
  id: string;
  url: string;
  title: string;
  screenshot: string;
  timestamp: number;
}

// ======================
// Main App component
// ======================
function App() {
  const [captures, setCaptures] = useState<TabCapture[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCaptures = async () => {
      setIsLoading(true);
      try {
        const result = await chrome.runtime.sendMessage({ type: 'GET_ALL_CAPTURES' });
        setCaptures(result.captures || []);
        setCurrentIdx(result.currentCaptureIndex);
      } catch (error) {
        console.error('Failed to load captures:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCaptures();
  }, []);

  // async function to clear all captures when the button is clicked
  // sends a message to the background script to clear the captures
  const handleClearCaptures = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'CLEAR_CAPTURES' });
    if (response.success) {
      setCaptures([]);
      setCurrentIdx(null);
    } else {
      console.error('Failed to clear captures:', response.error);
    }
  };

  // Show loading state while fetching initial data
  if (isLoading) {
    return (
      <div className="popup-container">
        <header className="header">
          <h1>GhostTabs</h1>
        </header>
        <div className="loading-state">
          <img
            src="/ghostTabsIcon.png"
            alt="GhostTabs Icon"
            className="loading-icon"
          />
          <p>Loading captures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <header className="header">
        <h1>GhostTabs</h1>
        <div className="header-content">
          <p className="capture-count">
            {captures.length} {captures.length === 1 ? 'capture' : 'captures'} saved
          </p>
          <button
            onClick={handleClearCaptures}
            className="clear-button"
            disabled={captures.length === 0}
          >
            Clear Data
          </button>
        </div>
      </header>
      {/* Render the captures list or an empty state if no captures are available */}
      {captures.length === 0 ? (
        <div className="empty-state">
          <img
            src="/ghostTabsIcon.png"
            alt="GhostTabs Icon"
            className="empty-state-icon"
          />
          <p className="empty-message">No captures yet!</p>
          <p className="empty-hint">
            Use Alt/Option+C to capture the current tab
          </p>
        </div>
      ) : (
        <div className="captures-list">
          {captures.map((capture, index) => (
            <div
              key={capture.id}
              className={`capture-card ${index === currentIdx ? 'current' : ''}`}
            >
              <div>
                <h2 className="capture-title">{capture.title}</h2>
                <time className="capture-timestamp">
                  {new Date(capture.timestamp).toLocaleString()}
                </time>
              </div>

              <div className="capture-thumbnail">
                <img
                  src={capture.screenshot}
                  alt={capture.title}
                />
              </div>

              <div className="capture-metadata">
                <div className="metadata-content">
                  <p className="metadata-label">Metadata:</p>
                  <p className="metadata-field">
                    <span>URL:</span> {capture.url}
                  </p>
                  <p className="metadata-field">
                    <span>Captured:</span>{' '}
                    {new Date(capture.timestamp).toLocaleString()}
                  </p>
                  {index === currentIdx && (
                    <p className="current-indicator">Current Reference</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App