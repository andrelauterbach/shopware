/** @type number */
const FRAMEWORK_GROUP_PROJECT_NUMBER = 27;

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param projectNumber {number} Number of the project
 *
 * @returns {Promise<{node_id: string, priority_field_id: string, priority_options: Array<{id: string, name: string>}}>}
*/
async function getProjectInfo(github, core, projectNumber) {
    const res = await github.graphql(
        `query getProjectInfo($organization: String!, $projectNumber: Int!) {
          organization(login: $organization) {
            projectV2(number: $projectNumber) {
              id
              field(name: "Priority") {
                ... on ProjectV2SingleSelectField {
                  id
                  options {
                    id
                    name
                  }
                }
              }
            }
          }
        }
        `,
        {
            organization: "shopware",
            projectNumber: projectNumber,
        }
    )

    core.debug(`getProjectInfo response: ${JSON.stringify(res)}`)

    const project = res.organization.projectV2

    return {
        node_id: project.id,
        priority_field_id: project.field.id,
        priority_options: project.field.options
    }
}

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param projectId {string} ID of the project
 * @param cardId {string} ID of the card
 * @param fieldId {string} ID of the field
 * @param valueId {string} ID of the value
 *
 * @returns {Promise}
*/
async function setFieldValue(github, core, projectId, cardId, fieldId, valueId) {
    const res = await github.graphql(
        `mutation setFieldValue($projectId: ID!, $itemId: ID!, $fieldId: ID!, $valueId: String!) {
            updateProjectV2ItemFieldValue(input: {
              projectId: $projectId,
              itemId: $itemId,
              fieldId: $fieldId,
              value: {singleSelectOptionId: $valueId}
            }) {
              projectV2Item {
                id
              }
            }
          }`,
        {
            projectId: projectId,
            itemId: cardId,
            fieldId: fieldId,
            valueId: valueId,
        }
    )

    core.debug(`setFieldValue response: ${JSON.stringify(res)}`)
}

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param issue {{number: number}} issue object
 * @param projectNumber {number}
 *
 * @returns Promise<{{node_id: string}|null}
 */
async function findCardIssueInProject(github, core, issue, projectNumber) {
    const res = await github.graphql(
        `query findIssue($issueNumber: Int!) {
          repository(owner: "shopware", name: "shopware") {
            issue(number: $issueNumber) {
              projectItems(first: 10) {
                nodes {
                  id
                  project {
                    id
                    number
                  }
                }
              }
              id
              number
            }
          }
        }`,
        {
            issueNumber: issue.number,
        }
    )

    core.debug(`findIssueInProject response: ${JSON.stringify(res)}`)

    const cards = res.repository.issue.projectItems.nodes

    const cardId = cards.find((card) => card.project.number === projectNumber)?.id

    if (!cardId) {
        return null
    }

    return {
        node_id: cardId,
    }
}

/**
 * @param github {import('@octokit/rest').Octokit} Github Octokit instance
 * @param core {import('@actions/core')} for logging
 * @param context {import('@actions/github').context} info about the current event
 */
export const main = async (github, core, context) => {
    const issue = context.payload.issue;
    core.debug(`Issue node ID: ${issue.node_id}`)

    const priorityLabel = issue.labels.find((label) =>
        label.name.startsWith("priority/")
    )?.name;

    if (!priorityLabel) {
        return;
    }
    core.info(`Found priority label: ${priorityLabel}`)

    const priority = priorityLabel.split('/')[1]
    core.info(`Priority: ${priority}`)

    const projectInfo = await getProjectInfo(github, core, FRAMEWORK_GROUP_PROJECT_NUMBER)
    const priorityOption = projectInfo.priority_options.find(x => x.name == priority)

    if (!priorityOption) {
        throw new Error(`Unknown priority "${priority}`)
    }

    const cardId = await findCardIssueInProject(github, core, issue, FRAMEWORK_GROUP_PROJECT_NUMBER)

    if (!cardId) {
        core.warning(`Couldn't find issue ${issue.number} in project with number ${FRAMEWORK_GROUP_PROJECT_NUMBER}`)
        return
    }

    core.info(`Setting priority for issue ${issue.number}`)

    await setFieldValue(github, core, projectInfo.node_id, cardId.node_id, projectInfo.priority_field_id, priorityOption.id)
}

