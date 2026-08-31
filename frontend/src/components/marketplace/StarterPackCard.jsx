import React from 'react'
import {
  Badge,
  Box,
  Button,
  Cards,
  SpaceBetween,
} from '@cloudscape-design/components'

/**
 * Creates Cloudscape card definition for a starter pack with dynamic event handlers.
 */
const createStarterPackCardDefinition = (onViewDetails) => ({
  header: (pack) => (
    <span
      style={{ cursor: 'pointer', color: '#0073bb', fontWeight: 600 }}
      onClick={() => onViewDetails && onViewDetails(pack)}
    >
      {pack.title}
    </span>
  ),
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
          <Button
            variant="link"
            onClick={() => onViewDetails && onViewDetails(pack)}
          >
            View details
          </Button>
        </SpaceBetween>
      ),
    },
  ],
})

/**
 * StarterPackCards renders a responsive grid of starter pack cards.
 *
 * @param {Object} props - Component props.
 * @param {import('../../data/marketplaceData').StarterPack[]} props.starterPacks - Packs to render.
 * @param {(pack: any) => void} [props.onViewDetails] - Details modal trigger callback.
 * @returns {React.ReactElement} The starter pack cards grid.
 */
export default function StarterPackCards({ starterPacks, onViewDetails }) {
  const cardDefinition = createStarterPackCardDefinition(onViewDetails)

  return (
    <Cards
      cardDefinition={cardDefinition}
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
