/**
 * The single GraphQL query each page uses. In normal visits the site reads the
 * same data straight from the JSON files in /content; inside the Tina editor
 * this query is re-run live so edits appear instantly.
 */
const mediaFields = `src alt mp4Fallback caption { title lines position tone }`

export const pageQuery = /* GraphQL */ `
query page($relativePath: String!) {
  site(relativePath: "site.json") {
    caseStudyOrder {
      caseStudy {
        ... on CaseStudy {
          _sys { filename }
          title
          category
          draft
          navigationLogo
          heroImage { ${mediaFields} }
        }
      }
    }
    about {
      portraits { ${mediaFields} }
      navImage
      navTagline
      statementLine1
      statementLine2
      aboutTitle
      aboutParagraphs
      servicesTitle
      services
    }
  }
  caseStudy(relativePath: $relativePath) {
    _sys { filename }
    title
    category
    draft
    navigationLogo
    heroImage { ${mediaFields} }
    intro { title subtitle copy }
    blocks {
      __typename
      ... on CaseStudyBlocksOneImage { image { ${mediaFields} } }
      ... on CaseStudyBlocksTwoImages { images { ${mediaFields} } }
      ... on CaseStudyBlocksImageTextLeft { image { ${mediaFields} } title subtitle copy }
      ... on CaseStudyBlocksImageTextRight { image { ${mediaFields} } title subtitle copy }
      ... on CaseStudyBlocksTwoText { leftText rightText }
    }
    credits { name roles }
  }
}
`
