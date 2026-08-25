import React from 'react'
import { TopNavigation, Container } from '@cloudscape-design/components'

export default function App() {
  return (
    <div>
      <TopNavigation identity={{ title: 'AWS AI Marketplace' }} />
      <Container header={<h2>Welcome</h2>}>
        <p>Cloudscape smoke test app — frontend works.</p>
      </Container>
    </div>
  )
}
