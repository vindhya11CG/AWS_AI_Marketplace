import React from 'react'
import { TopNavigation } from '@cloudscape-design/components'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div>
      <TopNavigation
        identity={{ title: 'Amplifier for Agentic AI' }}
        utilities={[
          {
            type: 'button',
            text: 'Log Out',
          },
        ]}
      />
      <Dashboard />
    </div>
  )
}
