import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClowkProvider } from '@clowk/react'
import './index.css'
import App from './App.tsx'
import { PUBLISHABLE_KEY, configureClowk } from './clowk.ts'

configureClowk()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClowkProvider publishableKey={PUBLISHABLE_KEY}>
      <App />
    </ClowkProvider>
  </StrictMode>,
)
