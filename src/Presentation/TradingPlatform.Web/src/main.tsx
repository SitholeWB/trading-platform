import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { TimezoneProvider } from './context/TimezoneContext';
import { LanguageProvider } from './context/LanguageContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <TimezoneProvider>
        <App />
      </TimezoneProvider>
    </LanguageProvider>
  </React.StrictMode>
);

