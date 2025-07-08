// ===================================================================
// FILENAME: src/index.jsx
// PURPOSE: נקודת הכניסה הראשית של אפליקציית ה-React.
// ===================================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // מייבא את העיצוב הגלובלי
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);