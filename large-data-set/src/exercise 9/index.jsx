import { RetryOptions, InvocationError, InvocationErrorCode } from "@forge/events"
import ForgeUI, { render, Fragment, Text, Macro, useProductContext, useState, TextField, useConfig, MacroConfig } from "@forge/ui";
import api, { route } from "@forge/api";

// storage
import { getIssuesFromProject, storeIssue } from "./storage";

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
  // TODO: Challenge - This gets called everytime the macro is loaded.
  //       Make this initial loading part to on demand (via button click perhaps?)     
  const [searchResults] = useState(async () => await searchIssues(projectKey));

  // Save search results to storage
  useState(async() => await storeSearchResults(searchResults));

  // Retrieve data from storage
  const [queryResult] = useState(async () => await getIssuesFromProject(projectKey)) ;

  console.log(queryResult);

  const issueKeys = [];
  const summaries = [];

  queryResult.results.forEach((obj) => {
    console.log(obj.value);
    issueKeys.push(obj.value.issueKey);
    summaries.push(obj.value.summary);
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
  console.log(`Event received by the listener: ${JSON.stringify(payload, null, 2)}`);

  let retryDelay = 20;

  if (payload.retryContext) {
    const baseDelay = 20;
    // Exponential backoff
    // Homework: Add jitter to add randomness and break synchronization
    retryDelay = (baseDelay * (2 ** payload.retryContext.retryCount));
  }  

  // Solution: Exercise 8 - Async event handling
  try {
    await storeIssue(payload.issueKey, payload.summary);
  } catch (error) {
    return new InvocationError({
      retryAfter: retryDelay,
      retryReason: InvocationErrorCode.FUNCTION_RETRY_REQUEST,
      retryData: {
        issueKey: payload.issueKey,
        summary: payload.summary
      }
    });
  }
});

export const handler = resolver.getDefinitions();


// Product event handling
export async function onIssueCreated(event, context) {

  // Calling Storage API a couple of times is fine
  // but there is a batch job that created 1000+ of issues
  // this will call storge.set 1000+ times and we'll hit the operation limits!
  // Commenting this out as part of the exercise
  // storeIssue( event.issue.key, event.issue.fields.summary );

  const payload = {
    "issueKey": event.issue.key,
    "summary": event.issue.fields.summary
  }

  await queue.push(payload, { delayInSeconds: 0.5 });

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
