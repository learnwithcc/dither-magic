import React from 'react'
import ReactDOM from 'react-dom/client'
import Layout from './components/Layout'
import DitheringPanel from './components/DitheringPanel'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Layout>
      <DitheringPanel />
    </Layout>
  </React.StrictMode>,
)
