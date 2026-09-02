import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import '@cloudscape-design/global-styles/index.css'
import { applyMode, Mode } from '@cloudscape-design/global-styles'
import './styles.css'

// Enable Cloudscape Light Mode with clean AWS Marketplace theme
applyMode(Mode.Light)

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
