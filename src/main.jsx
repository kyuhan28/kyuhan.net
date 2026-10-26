import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import App from './App'
import PortfolioPage from './PortfolioPage'

// `?view=portfolio` is the portfolio on its own: the page shown inside the desktop's portfolio window.
const embedded = new URLSearchParams(window.location.search).get('view') === 'portfolio'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {embedded ? <PortfolioPage /> : <App />}
  </StrictMode>,
)
