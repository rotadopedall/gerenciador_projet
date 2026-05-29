import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(13, 18, 32, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(12px)',
            fontSize: '13px',
            fontFamily: 'IBM Plex Sans',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#080c14' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#080c14' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
