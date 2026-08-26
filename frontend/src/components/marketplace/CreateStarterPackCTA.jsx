import React from 'react'
import { Box, Button, Container, Header, SpaceBetween } from '@cloudscape-design/components'

/**
 * CreateStarterPackCTA renders a closing call-to-action encouraging users
 * to build their own starter pack.
 *
 * @param {Object} props - Component props.
 * @param {() => void} [props.onCreate] - Handler for the create action.
 * @param {() => void} [props.onContact] - Handler for the contact action.
 * @returns {React.ReactElement} The create starter pack CTA.
 */
export default function CreateStarterPackCTA({ onCreate, onContact }) {
  return (
    <Container
      header={
        <Header
          variant="h2"
          description="Have a use case in mind? Package it into a reusable starter pack."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="primary" iconName="add-plus" onClick={onCreate}>
                Create Starter Pack
              </Button>
              <Button iconName="envelope" onClick={onContact}>
                Contact Us
              </Button>
            </SpaceBetween>
          }
        >
          Build Your Own Starter Pack
        </Header>
      }
    >
      <Box variant="p" color="text-body-secondary">
        Combine industry-trained orchestrated agents into a prebuilt workflow and accelerate
        your clients' idea-to-production journey.
      </Box>
    </Container>
  )
}
