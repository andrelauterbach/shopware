/** @type number */
const DAYS_UNTIL_STALE = 180

/**
 * @param projectNumber {number}
 *
 * @returns {string|null}
*/
function getQuery(projectNumber) {
    switch (projectNumber) {
        case 27:
            return `
                query {
                    search(
                      type: ISSUE
                      first: 100
                      query: "repo:shopware/shopware is:issue state:open project:shopware/27 label:priority/low -label:AboutToClose -label:DoNotClose created:<=$staleDate"
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
              `
        default:
            return null
    }
}

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param label {string}
 *
 * returns {Promise<string|null>}
*/
async function getLabelId(github, core, label) {
    const res = await github.graphql(
        `query getLabelId($label: String!) {
           repository(owner: "shopware", name: "shopware") {
             label(name:$label) {
               id
             }
           }
         }`,
        {
            label: label
        }
    )

    core.debug(`getLabelId response: ${JSON.stringify(res)}`)

    return res.repository.label.id
}

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param issueId {string}
 * @param labelId {string}
 *
 * returns {Promise}
*/
async function addLabelToIssue(github, core, issueId, labelId) {
    const res = await github.graphql(
        `mutation addLabelToIssue($issueId: ID!, labelId: ID!) {
            addLabelsToLabelable(input: {
                labelIds: [$labelId],
                labelableId: $issueId
            }) {
                clientMutationId
            }
        }`,
        {
            labelId: labelId,
            issueId: issueId
        }
    )

    core.debug(`addLabelToIssue response: ${JSON.stringify(res)}`)
}

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param projectNumber {number}
 * @param dryRun {boolean}
 */
export const main = async (github, core, projectNumber, dryRun) => {
    const now = new Date()
    now.setDate(now.getDate() - DAYS_UNTIL_STALE)
    const staleDate = now.toISOString().split('T')[0];

    const query = getQuery(projectNumber);
    if (!query) {
        throw new Error(`There is no query for the project with the number ${projectNumber}`);
    }

    // replace because GraphQL doesn't support variables in strings...
    const res = await github.graphql(query.replace("$staleDate", staleDate), {
        headers: {
            "GraphQL-Features": "issue_types"
        }
    })

    const issues = res.search.edges

    for (const issueNode of issues) {
        const issue = issueNode.node
        const parentIssueType = issue.parent?.issueType
        /** @type [{name: string}] */
        const labels = issue.labels.nodes
        const priorityLabel = labels.find((label) =>
            label.name.startsWith("priority/")
        )?.name;

        const statusInProject = issue.projectItems.nodes.find((project) => project.number === 27)?.fieldValueByName

        if (priorityLabel && (priorityLabel.split('/')[1] === "low" || statusInProject === "Backlog") && parentIssueType !== "Epic") {
            if (dryRun) {
                core.info(`Would set "${issue.title}" (${issue.url}) to AboutToClose`)
                continue
            }
            const aboutToCloseLabelId = await getLabelId(github, core, "AboutToClose")
            await addLabelToIssue(github, core, issue.id, aboutToCloseLabelId)
        }
    }
}

