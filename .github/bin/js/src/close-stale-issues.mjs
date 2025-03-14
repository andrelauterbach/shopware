/** @type number */
const DAYS_UNTIL_CLOSE = 30;

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param issueId {string}
*/
async function closeIssue(github, core, issueId) {
    const res = await github.graphql(
        `mutation closeIssue($issueId: ID!) {
            closeIssue(input: {
                issueId: $issueId,
                stateReason:NOT_PLANNED
            }) {
                clientMutationId
            }
        }`,
        {
            issueId: issueId
        }
    )

    core.debug(`closeIssue response: ${JSON.stringify(res)}`)
}

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param projectNumber {number}
 * @param dryRun {boolean}
 */
export const main = async (github, core, dryRun) => {
    const now = new Date()
    now.setDate(now.getDate() - DAYS_UNTIL_CLOSE)
    const closeDate = now.toISOString().split('T')[0];

    const query = `
        query {
            search(
              type: ISSUE
              first: 100
              query: "repo:shopware/shopware is:issue state:open label:AboutToClose updated:<=$closeDate"
            ) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  ... on Issue {
                    id
                    title
                    url
                    parent {
                      issueType {
                        name
                      }
                    }
                    labels(first: 20) {
                      nodes {
                        name
                      }
                    }
                    projectItems(first: 10) {
                      nodes {
                        fieldValueByName(name: "Status") {
                          ... on ProjectV2ItemFieldSingleSelectValue {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
    `;
    // replace because GraphQL doesn't support variables in strings...
    const res = await github.graphql(query.replace("$closeDate", closeDate), {
        headers: {
            "GraphQL-Features": "issue_types"
        }
    })

    const issues = res.search.edges

    for (const issueNode of issues) {
        const issue = issueNode.node
        if (dryRun) {
            core.info(`Would close "${issue.title}" (${issue.url})`)
            continue
        }

        await closeIssue(github, core, issue.id)
    }
}


