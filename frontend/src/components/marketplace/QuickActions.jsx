import React from 'react'
import { Button, ButtonDropdown, SpaceBetween } from '@cloudscape-design/components'

/**
 * QuickActions renders the primary marketplace call-to-action controls.
 *
 * @param {Object} props - Component props.
 * @param {() => void} [props.onBrowseStarterPacks] - Handler for browsing starter packs.
 * @param {() => void} [props.onBrowseAgents] - Handler for browsing agents.
 * @param {() => void} [props.onCreateStarterPack] - Handler for creating a starter pack.
 * @param {() => void} [props.onContactUs] - Handler for contacting the team.
 * @returns {React.ReactElement} The quick actions bar.
 */
export default function QuickActions({
  onBrowseStarterPacks,
  onBrowseAgents,
  onCreateStarterPack,
  onContactUs,
}) {
  return (
    <SpaceBetween direction="horizontal" size="xs">
      <Button variant="primary" iconName="folder" onClick={onBrowseStarterPacks}>
        Starter Packs
      </Button>
      <Button iconName="gen-ai" onClick={onBrowseAgents}>
        Agents
      </Button>
      <ButtonDropdown
        items={[
          { id: 'blank', text: 'Start from blank' },
          { id: 'template', text: 'Start from template' },
          { id: 'import', text: 'Import existing workflow' },
        ]}
        onItemClick={onCreateStarterPack}
      >
        Create Your Own Starter Pack
      </ButtonDropdown>
      <Button iconName="envelope" onClick={onContactUs}>
        Contact Us
      </Button>
    </SpaceBetween>
  )
}
