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

export async function projectsDelete(id: string, profile?: string) {
  const data = await graphqlMutation(MUTATION, { id }, "projectManagementDeleteProject", profile);
  const project = data.projectManagementDeleteProject as { id: string; deleted?: boolean };
  console.log(`Deleted project [${project.id}]`);
}
