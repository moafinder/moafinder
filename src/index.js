import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './App.css';

// Entry point for the React application. Wraps the App component in
// BrowserRouter to enable client-side routing. The CSS import must
// occur here so that Tailwind or any global styles are applied
// throughout the application.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);