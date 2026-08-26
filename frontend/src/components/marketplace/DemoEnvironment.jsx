import React from 'react'
import {
  Box,
  Button,
  Container,
  Header,
  Link,
  SpaceBetween,
} from '@cloudscape-design/components'

/**
 * DemoEnvironment renders access points to the live demo environment,
 * guest login, and platform documentation.
 *
 * @param {Object} props - Component props.
 * @param {() => void} [props.onLaunchDemo] - Handler for launching the demo.
 * @param {() => void} [props.onGuestLogin] - Handler for guest login.
 * @returns {React.ReactElement} The demo environment section.
 */
export default function DemoEnvironment({ onLaunchDemo, onGuestLogin }) {
  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Try the platform hands-on before you build."
        >
          Demo Environment
        </Header>
      }
    >
      <SpaceBetween size="m">
        <Box variant="p" color="text-body-secondary">
          Explore the Agentic Experience demo, sign in as a guest, and review the platform
          guide to get started quickly.
        </Box>
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" iconName="external" onClick={onLaunchDemo}>
            Agentic Experience Demo
          </Button>
          <Button iconName="user-profile" onClick={onGuestLogin}>
            Guest Login
          </Button>
          <Link href="#/platform-guide" external>
            Platform Guide / How-To
          </Link>
        </SpaceBetween>
      </SpaceBetween>
    </Container>
  )
}
