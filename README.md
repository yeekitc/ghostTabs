# GhostTabs

GhostTabs is a Chrome extension that helps users maintain context while switching between tabs, particularly useful for tasks like form-filling and research. The extension allows users to capture tab content and quickly reference it through a semi-transparent overlay system, all controlled via keyboard shortcuts.

## Features

- **Manual Tab Capture**: Capture any tab's content with Alt+C
- **Quick Reference Overlay**: Toggle a semi-transparent overlay of captured content with Alt+Shift+Space
- **History Navigation**: Cycle through recent captures with Alt+Left/Alt+Right
- **Visual History**: View all captures in a clean, organized popup interface
- **Auto-Cleanup**: Maintains the last 20 captures to manage storage efficiently
- **Visual Feedback**: Badge counter shows number of active captures
- **Toast Notifications**: Non-intrusive feedback for user actions

## Tech Stack

- TypeScript
- React
- Vite
- Chrome Extension APIs

## Installation

### From Repository

1. Clone the repository:
```bash
git clone https://github.com/yeekitc/ghostTabs.git
```

2. Install dependencies:
```bash
cd ghostTabs
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` directory from your build

### Usage

After installation, the extension can be controlled using these keyboard shortcuts:

- `Alt+C`: Capture the current tab
- `Alt+Shift+Space`: Toggle overlay of current capture
- `Alt+Left`/`Alt+Right`: Navigate through capture history
- Click the extension icon to view capture history

## Project Structure

```
ghostTabs/
├── dist/               # Built extension files
├── public/             # Static assets
├── src/
│   ├── App.tsx         # Main popup component
│   ├── components/     # React components
│   ├── extension/      # Extension scripts
│   │   ├── background.ts
│   │   ├── content.ts
│   └── ...
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Make your changes
3. Build the extension:
```bash
npm run build
```

4. Reload the extension in Chrome:
   - Go to `chrome://extensions/`
   - Find GhostTabs
   - Click the refresh icon

## Technical Notes

- The extension uses Chrome's `tabs.captureVisibleTab` API for screenshots
- Storage is managed using Chrome's `storage.local` API with a 20-capture limit
- Communication between components uses Chrome's messaging system
- The overlay system is implemented via content scripts

## Privacy Considerations

- Captures are only made when explicitly triggered by the user
- All data is stored in your browser
- Captures are automatically cleaned up when exceeding the 20-capture limit