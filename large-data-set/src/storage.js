import { storage, startsWith } from "@forge/api";

// Create a key composed from the issueKey
function termKey(issueKey) {
  return `term-${issueKey}`;
}

export async function getIssuesFromProject(projectKey) {
  return await storage.query()
    .where('key', startsWith(termKey(projectKey)))
    .limit(20)
    .getMany();
}

// Stores the issueKey, summary pair using termKey(issueKey) as the key
export async function storeIssue(issueKey, summary) {

  // TODO: Exercise 4 save issuekey and summary with the following key-value pair format
  //       key = termKey(issueKey)
  //       value = { issueKey, summary}
  //       
  //       Hint: https://developer.atlassian.com/platform/forge/runtime-reference/storage-api/#storage-set
  //
  // return await <use the Storage API for setting here>;
  return await storage.set(termKey(issueKey), { issueKey, summary });
}