import React from 'react'
import {
  Badge,
  Box,
  Button,
  Cards,
  Container,
  Header,
  SpaceBetween,
} from '@cloudscape-design/components'

/**
 * Cloudscape card definition for a case study.
 */
const caseStudyCardDefinition = {
  header: (study) => study.title,
  sections: [
    {
      id: 'industry',
      content: (study) => <Badge color="blue">{study.industry}</Badge>,
    },
    {
      id: 'description',
      content: (study) => (
        <Box variant="p" color="text-body-secondary">
          {study.description}
        </Box>
      ),
    },
    {
      id: 'actions',
      content: () => <Button variant="link">Read case study</Button>,
    },
  ],
}

/**
 * CaseStudies renders a grid of customer case studies.
 *
 * @param {Object} props - Component props.
 * @param {{ id: string, title: string, industry: string, description: string }[]} props.caseStudies - Case studies.
 * @returns {React.ReactElement} The case studies section.
 */
export default function CaseStudies({ caseStudies }) {
  return (
    <Container header={<Header variant="h2">Case Studies</Header>}>
      <Cards
        cardDefinition={caseStudyCardDefinition}
        items={caseStudies}
        trackBy="id"
        cardsPerRow={[{ cards: 1 }, { minWidth: 640, cards: 2 }, { minWidth: 1100, cards: 3 }]}
        empty={
          <Box textAlign="center" color="inherit">
            <b>No case studies</b>
          </Box>
        }
      />
    </Container>
  )
}
