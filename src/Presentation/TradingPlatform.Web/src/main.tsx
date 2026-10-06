import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { TimezoneProvider } from './context/TimezoneContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TimezoneProvider>
      <App />
    </TimezoneProvider>
  </React.StrictMode>
);

