// Overlay.tsx
import React from 'react';
import './Overlay.css'; // Import any styles you need

type OverlayProps = {
  screenshot: string;
  isVisible: boolean;
};

const Overlay: React.FC<OverlayProps> = ({ screenshot, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="overlay">
      <img src={screenshot} alt="Captured Tab" className="overlay-image" />
    </div>
  );
};

export default Overlay;
