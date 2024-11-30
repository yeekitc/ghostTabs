// Simple overlay to start with
// import React, { useState, useEffect } from 'react';

// const SimpleOverlay = () => {
//   const [isVisible, setIsVisible] = useState(false);
//   const [content, setContent] = useState(null);

//   useEffect(() => {
//     const handleKeyPress = (e) => {
//       if (e.altKey && e.code === 'Space') {
//         setIsVisible(!isVisible);
//       }
//     };

//     window.addEventListener('keydown', handleKeyPress);
//     return () => window.removeEventListener('keydown', handleKeyPress);
//   }, [isVisible]);

//   return isVisible ? (
//     <div className="fixed top-4 right-4 p-4 bg-white shadow-lg">
//       {content || 'No content captured yet'}
//     </div>
//   ) : null;
// };