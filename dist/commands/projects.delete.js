import { graphqlMutation } from "../lib/graphql-api.js";
const MUTATION = `
mutation projectManagementDeleteProject($id: ID!) {
  projectManagementDeleteProject(input: { id: $id }) {
    ... on ProjectManagement_Project {
      id
      deleted
    }
  }
}`;
export async function projectsDelete(id, profile) {
    const data = await graphqlMutation(MUTATION, { id }, "projectManagementDeleteProject", profile);
    const project = data.projectManagementDeleteProject;
    console.log(`Deleted project [${project.id}]`);
}
