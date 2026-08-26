import React from 'react'
import {
  Badge,
  Box,
  Button,
  Cards,
  SpaceBetween,
} from '@cloudscape-design/components'

/**
 * Cloudscape card definition for a starter pack.
 * Extracted so it can be reused and unit tested independently.
 */
const starterPackCardDefinition = {
  header: (pack) => pack.title,
  sections: [
    {
      id: 'description',
      content: (pack) => (
        <Box variant="p" color="text-body-secondary">
          {pack.description}
        </Box>
      ),
    },
    {
      id: 'benefits',
      header: 'Business benefits',
      content: (pack) => pack.benefits,
    },
    {
      id: 'tags',
      content: (pack) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Badge color="blue">{pack.category}</Badge>
          {pack.demoAvailable ? (
            <Badge color="green">Demo available</Badge>
          ) : (
            <Badge color="grey">Demo on request</Badge>
          )}
        </SpaceBetween>
      ),
    },
    {
      id: 'actions',
      content: (pack) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" disabled={!pack.demoAvailable}>
            Launch
          </Button>
          <Button variant="link">View details</Button>
        </SpaceBetween>
      ),
    },
  ],
}

/**
 * StarterPackCards renders a responsive grid of starter pack cards.
 *
 * @param {Object} props - Component props.
 * @param {import('../../data/marketplaceData').StarterPack[]} props.starterPacks - Packs to render.
 * @returns {React.ReactElement} The starter pack cards grid.
 */
export default function StarterPackCards({ starterPacks }) {
  return (
    <Cards
      cardDefinition={starterPackCardDefinition}
      items={starterPacks}
      trackBy="id"
      cardsPerRow={[{ cards: 1 }, { minWidth: 640, cards: 2 }, { minWidth: 1100, cards: 3 }]}
      empty={
        <Box textAlign="center" color="inherit">
          <b>No starter packs</b>
          <Box variant="p" color="inherit">
            No starter packs match the current filters.
          </Box>
        </Box>
      }
    />
  )
}
