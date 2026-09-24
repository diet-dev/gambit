import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../assets/main.css'
import RemoteBoard from './RemoteBoard'

createRoot(document.getElementById('remote-root')!).render(
  <StrictMode>
    <RemoteBoard />
  </StrictMode>
)
