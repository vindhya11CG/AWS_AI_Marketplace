import React from 'react'
import { Box, Header, SpaceBetween } from '@cloudscape-design/components'

/**
 * HeroBanner renders the marketplace introduction / hero area.
 * Explains what Starter Packs are and the value they provide.
 *
 * @returns {React.ReactElement} The hero banner.
 */
export default function HeroBanner() {
  return (
    <Box padding={{ vertical: 'l' }}>
      <SpaceBetween size="s">
        <Header variant="h1" description="Discover, explore, and launch industry-specific AI Starter Packs.">
          AI Marketplace
        </Header>
        <Box variant="p" color="text-body-secondary" fontSize="body-m">
          AI Starter Packs are prebuilt workflows with industry-specific trained orchestrated
          agents. This helps your clients move from idea to production faster.
        </Box>
      </SpaceBetween>
    </Box>
  )
}
