import { RetryOptions, InvocationError, InvocationErrorCode } from "@forge/events"
import ForgeUI, { render, Fragment, Text, Macro, useProductContext, useState, TextField, useConfig, MacroConfig } from "@forge/ui";
import api, { route, storage, startsWith } from "@forge/api";

// storage
import { storeIssue } from "./storage";

// definition table
import { DefinitionTable } from "./definition-table";

// Async events
import Resolver from "@forge/resolver";
import { Queue } from '@forge/events';

const resolver = new Resolver();
const queue = new Queue({ key: 'queue-name' });

const App = () => {
  const context = useProductContext();

  // Gets the value from the Macro Config
  const config = useConfig();
  const projectKey = config?.projectKey;

  // If the macro is not set return a generic text
  if (!config || !projectKey) {
    return (
      <Fragment>
        <Text>No project key set</Text>
      </Fragment>
    );
  }

  // Call Jira REST API
  // TODO: Challenge - call only when there are changes to issues
  const [searchResults] = useState(async () => await searchIssues(projectKey));

  // TODO: Save search results to storage

  // TODO: Retrieve data from storage

  // TODO: Exercise 2 Populate the issue keys and summaries from the response
  const issueKeys = [];
  const summaries = [];
  
  searchResults.forEach((obj) => {
    issueKeys.push(obj.key);
    summaries.push(obj.fields.summary);
  });

  return (
    <Fragment>
      <Text>Getting information from project: {projectKey}</Text>
      <DefinitionTable issueKeys={issueKeys} summaries={summaries} />
    </Fragment>
  );
};

// REST API Module
const searchIssues = async (projectKey) => {

  // TODO: Exercise 1 Define the Jira REST API to be used here
  //       Put the endpoint in the `backticks`
  //       Remember to use the `projectKey` parameter
  //       After saving the file, run `forge tunnel` so that you can see the logs
  const restEndpoint = route`/rest/api/2/search?jql=project=${projectKey}&fields=key,summary`;

  const response = await api
    .asUser()
    .requestJira(restEndpoint);
  
  const data = await response.json();

  console.log(`Response data: ${JSON.stringify(data.issues, null, 2)}`);

  // Rate-limit error handling here

  return data.issues;

};

// save search results to storage
const storeSearchResults = async (searchResults) => {
  for (let obj of searchResults) {
    await storeIssue(obj.key, obj.fields.summary);
  }
}

// Async events
resolver.define("event-listener", async ({ payload, context }) => {
  console.log(`Event listener: ${payload}`);

  // TODO: Async event handling
});

export const handler = resolver.getDefinitions();


// Product event handling
export async function onIssueCreated(event, context) {

  console.log(`event: ${JSON.stringify(event, null, 2)}`);

  // TODO: save the event payload to store
  return true;

}

const Config = () => {
  return (
    <MacroConfig>
      <TextField name="projectKey" label="Project Key" />
    </MacroConfig>
  );
};
export const run = render(
  <Macro
    app={<App />}
  />
);

export const config = render(<Config />);
