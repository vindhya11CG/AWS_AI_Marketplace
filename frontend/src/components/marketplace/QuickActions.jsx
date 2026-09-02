import React from 'react'
import { Button, ButtonDropdown, SpaceBetween } from '@cloudscape-design/components'

export default function QuickActions({
  onBrowseStarterPacks,
  onBrowseAgents,
  onCreateStarterPack,
  onContactUs,
}) {
  return (
    <div className="quick-actions-bar">
      <SpaceBetween direction="horizontal" size="xs">
        <Button variant="primary" iconName="folder" onClick={onBrowseStarterPacks}>
          Starter Packs
        </Button>
        <Button variant="primary" iconName="gen-ai" onClick={onBrowseAgents}>
          Agents
        </Button>
        <ButtonDropdown
          variant="primary"
          items={[
            { id: 'blank', text: 'Start from blank' },
            { id: 'template', text: 'Start from template' },
            { id: 'import', text: 'Import existing workflow' },
          ]}
          onItemClick={onCreateStarterPack}
        >
          Create Your Own Starter Pack
        </ButtonDropdown>
        <Button variant="primary" iconName="envelope" onClick={onContactUs}>
          Contact Us
        </Button>
      </SpaceBetween>
    </div>
  )
}
