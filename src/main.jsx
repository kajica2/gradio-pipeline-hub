import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Apply theme before render to avoid flash
(function () {
  try {
    const stored = localStorage.getItem('ghub-theme');
    if (stored) {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {
    /* localStorage may be unavailable */
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
