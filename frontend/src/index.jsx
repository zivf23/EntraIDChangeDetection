// ===================================================================
// FILENAME: src/index.jsx
// PURPOSE: נקודת הכניסה הראשית של אפליקציית ה-React.
// UPDATED: אין צורך בטעינת ה-loader מכאן, זה מטופל ע"י config-overrides.js
// ===================================================================
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css'; // מייבא את העיצוב הגלובלי
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);