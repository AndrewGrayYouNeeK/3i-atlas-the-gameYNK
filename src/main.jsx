import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import { initNativeShell } from '@/lib/native.js'
import '@/index.css'

void initNativeShell()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
