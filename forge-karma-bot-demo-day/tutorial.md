## Bitbucket Karma Bot.
- This tutorial is designed to build a simple Forge app in Bitbucket Cloud that allows developers to recognise good work from each other and keep a running tally of score.
- This score is called "Karma" and basically just represents a count of all the times other developers have recognised something good that another has done.
- It's granted by simply mentioning the person you want to give it to in a comment, followed by a series of "++" or "--" signs to either grant, or take away Karma points from the mentioned person.
- Karma is tracked for each user across the entirety of a Bitbucket Workspace.

## Before you start:
- You will need a basic understanding of Git and basic web-development (particularly Javascript).
- Create a Bitbucket Cloud account and workspace if you do not already have one.
  - Go to https://bitbucket.org/
  - Click “Get it free”.
  - Click “Next” to skip the Jira Software add on.
  - Enter your email address or select an SSO provider to log in with.
  - If required, verify your email address and Log In to Bitbucket Cloud.
- Create a repository in Bitbucket cloud.
- Create a Pull Request on Bitbucket Cloud against that repository.
  - This may require you to pull the repo down to your local machine, create a branch, make a small change, and then push it back up. 
- Follow Getting started with Forge (https://developer.atlassian.com/platform/forge/getting-started/#before-you-begin) and ensure you have installed the Forge CLI and all dependencies including Docker, an LTS release of Node.js (version 16.x or 18.x), and npm. See Operating System specific instructions for Apple macOS, Linux, or Windows 10.
- Test your local environment is set up correctly by running the forge whoami command, which should display your name and email address. 
- Install a JavaScript-friendly IDE you are comfortable with when developing Forge apps.

## Plan:
- App Loop Overview
  - Events
    - Comment Created Event
  - Functions
    - Get Comment Data
    - Parse Comment data to get score change
    - Read existing scores from Forge Storage
    - Update new scores in Forge Storage
    - Send Comment Reply back to Bitbucket with new scores.
  - UI Extensions
    - Out of scope for this tutorial

## Getting Started
- Creat a new app using the blank template
```shell
forge create
```

- CD into the directory for the app created.
```shell
cd <my-app-name>
```

- Initialise Git and an NPM project.
  - You can use the default values for the NPM project.
```shell
git init
npm init
```

- We're also going to install a helper library we created designed to make the creation of this app a bit easier.
```shell
npm i bitbucket-karma-helpers
```
- Open `manifest.yml` and familiarise yourself with the structure. This is how you tell Forge how to run and interact with your app. We will be making updates in here later.

## First Function
- We need to be able to run some logic when a comment is created in Bitbucket Cloud.
- In `/src` create a file to hold our code related to comments: `/src/comment.js`
- Inside this file we're going to create a function that will run whenever a new comment is added to a PR, we call this a "Handler Function".
  - You can name this function whatever you like, but try to make it something that makes sense in the context of how its used.
  - Forge Handler Functions always take two arguments, the event that was sent from the product and a ForgeContext object that contains information provided by the Forge platform.
    - Don't worry too much about the comments in the code examples. It's just a way of getting things like type-hints and auto-complete in vanilla Javascript without needing to use something like Typescript which can be a bit complicated to setup and use.
    - Everything you need to use these comments is contained in the `bitbucket-karma-helpers` library you downloaded earlier.
  - Make sure you export the function so that it can be accessed by the Forge runtime.
```javascript
/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  console.log(`Processed comment event`);
  console.log(event);
};
```

- Now that we have a function to run, we need to wire it up to the events coming from Bitbucket.
  - Delete the `index.js` file.
  - Open `manifest.yml` file.
    - Under modules: => function change the key of the function to something logical like `on-comment-created`
    - Then change the handler to map to the file and then function you created in the previous step.
      - So for `/src/comment.js` and `onCommentCreated` the handler would be `handler: comment.onCreated`
        - Note that handler paths assume the code you're running is in the `/src` directory.
```yaml
modules:
  # registered the function code with Forge
  function:
    # given the function a name
    - key: on-comment-created
      # told forge where to find the code to run
      handler: comment.onCreated
app:
  id: <your-app-id-here>
  ```

- What we've done here is we've just registered the function we created in `/src/comment.js` with the Forge runtime so that Forge knows where to find the code when we want to run the `on-comment-created` function.
  - But this is only half of what we need to do. We’ve told Forge where to find the `onCommentCreated` code, but we haven’t told Forge when we want it to run that code.
- To do this, we go back to the manifest file.
  - Under the module area we are going to add a `trigger` section.
  - We give this trigger a unique name using the key: property, we’re going to use `on-pullrequest-commented`
  - We then need to tell Forge which of the previously registered functions we created we want it to run when this trigger fires.
    - So we specify a `function:` property, and we simply set that to be the key of the function we previously registered.
      - `function: on-comment-created`
  - And then finally, we need to tell Forge which of the native product-events that Bitbucket emits should actually fire this trigger.
    - Events have names defined by Bitbucket Cloud, so they do need to be precise.
    - For this we use `avi:bitbucket:created:pullrequest-comment`
```yaml
modules:
  # registered the function code with Forge
  function:
    # given the function a name
    - key: on-comment-created
      # told forge where to find the code to run
      handler: comment.onCreated
  # define the trigger to run the code
  trigger:
    # given the trigger a name
    - key: pull-request-commented
      # told it what function we want to run when it fires
      function: on-comment-created
      # told it what events from BBC we want it to be triggered by.
      events:
        - avi:bitbucket:created:pullrequest-comment
app:
  id: <your-app-id-here>
```

- Finally, because we’re listening to the pull request commented event, we need to give our app some permissions so that Forge knows it’s authorized to access that data from Bitbucket.
  - At the top of your manifest file add a `permissions:` section, with a `scopes:` section under it.
    - Under the `scopes:` section, add the following API permission scope: `- 'read:pullrequest:bitbucket'`
    - This gives your app permission to read data relating to Pull Requests.
```yaml
permissions:
  scopes:
    - 'read:pullrequest:bitbucket'
modules:
  # registered the function code with Forge
  function:
    # given the function a name
    - key: on-comment-created
      # told forge where to find the code to run
      handler: comment.onCreated
  # define the trigger to run the code
  trigger:
    # given the trigger a name
    - key: pull-request-commented
      # told it what function we want to run when it fires
      function: on-comment-created
      # told it what events from BBC we want it to be triggered by.
      events:
        - avi:bitbucket:created:pullrequest-comment
app:
  id: <your-app-id-here>
```

### Review:
- We’ve created a Javascript file called “comment” and exported a function called “onCreated” that we want Forge to run whenever a comment is added to a PR.
```javascript
/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  console.log(`Processed comment event`);
  console.log(event);
};
```

- We’ve then registered this code with Forge via the manifest.yml file so that Forge knows where to find the code to run whenever we refer to the `on-comment-created` function.
- Finally, we’ve told Forge that we want to run that function whenever the pull-request-commented trigger fires, and we’ve told Forge that this trigger is driven off of the pull request-comment event.
- And then we've given the app permission to read the Pull Request data sent in the event that triggers it with the `permissions:` section.
```yaml
permissions:
  scopes:
    - 'read:pullrequest:bitbucket'
modules:
  # registered the function code with Forge
  function:
    # given the function a name
    - key: on-comment-created
      # told forge where to find the code to run
      handler: comment.onCreated
  # define the trigger to run the code
  trigger:
    # given the trigger a name
    - key: pull-request-commented
      # told it what function we want to run when it fires
      function: on-comment-created
      # told it what events from BBC we want it to be triggered by.
      events:
        - avi:bitbucket:created:pullrequest-comment
app:
  id: <your-app-id-here>
```

## Smoke Test
- We actually should have an E2E working app now. It won’t do much, but it should work, so lets test it.
  - First we need to deploy the app to the Forge platform.
    - Open your terminal and run `forge deploy`
    - Once completed, your app is deployed to the Forge platform in Development mode.
  - Now we need to install the app in your Workspace.
    - Go to Bitbucket cloud and copy your Workspace URL from the address bar.
      - It should look something like `bitbucket.org/emunday_atlassian`
    - Now run `forge install -p bitbucket` to tell the CLI you want to install your app into the Bitbucket product.
    - Then enter the previously copied workspace url and press enter.
    - You’ll get a prompt asking if the scopes specified are correct, this is indicating what API access the forge app will have. Just confirm and continue.
    - Your app should now be installed.
  - So now it’s time to test it.
    - Make sure you have the Docker client running, and then in your terminal `run forge tunnel` to run the local development tunnel. This might take a minute or two.
    - You should now have a prompt saying “listening for requests”.
    - Go to the pull request you created earlier in Bitbucket cloud, and leave a comment.
    - Go back to your terminal and if all has gone well, you should see a bunch of information printed out to the terminal.
      - This is a real-time feed of your app running. What you see in your terminal was the `console.log()` command you put in your function.
- Believe it or not, we’re done with the most complex part of this whole process now.
  - You’ve scaffolded a Forge app, setup it’s manifest, given it some permissions, deployed it, installed it, and now tested it.
  - Everything from here is just business logic.

## Checking for User:
- First up, we want to make sure that the person who triggered the event is actually a user so that we don't reply to our own comments.
- To do that, lets update the code in `comment.js`.
  - We should also remove the `console.log()` code we added before as we don't need to log that stuff any more.
```javascript
/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;
};
```

## Dealing with the Event:
- Next up, we have this event argument that was sent to the app, but it’s just raw data and we want to make it a bit more convenient to work with.
  - At the top of the file, import the `PullRequestCommentedEvent` class from the `bitbucket-karma-helpers` library we installed earlier.
  - Then just create a new instance of that class, passing the raw event from Forge into it as the only argument.
    - This class is just a simple wrapper around the event that has some utility properties to make it quicker to get data from the event.
    - It’s nothing Forge specific, it’s just to make life easier. If you’re interested in the code for this, it’s available in the `helpers` folder of the tutorial repo.
```javascript
import {
  PullRequestCommentedEvent,
} from "bitbucket-karma-helpers";

/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;
  
  // convert the raw event into an instance of the class so it's easier to work with.
  const commentEvent = new PullRequestCommentedEvent(event);
};
```

## Getting Comment Data:
- The event that was sent to us doesn’t actually contain much data. It doesn’t contain the full comment, or anything about the repository or the Pull Request, it just contains their ID’s.
  - In order to work with the Comment data, we need to go back to Bitbucket and get the full data for the comment.
  - Create a new file under `/src` called `api.js`
  - Now as part of this functionality, we’re going to call the Bitbucket API, which requires us to use some functionality from the Forge API library which we’ll need to install.
    - In your terminal, run: `npm i @forge/api`
    - Once that’s done, import the api and route helpers in your `api.js` file like this `import api, { route } from "@forge/api";`
```javascript
import api, { route } from "@forge/api";

/**
 * @param {PullRequestCommentedEvent} event
 * @returns {Promise<PullRequestComment>}
 */
export const fetchComment = async (event) => {
  const res = await api
    .asApp()
    .requestBitbucket(
      route`/2.0/repositories/${event.workspaceId}/${event.repositoryId}/pullrequests/${event.pullRequestId}/comments/${event.commentId}?fields=content.*,user.*,id`
    );

  return res.json();
};
```
  - You can see that we pass the event that was sent to our app into this function, and then we’re using the api.asApp().requestBitbucket() function provided by the Forge API library to make a request to the Bitbucket API. 
    - The function is super helpful because it totally automates the really complex processes around authentication. 
    - The `asApp()` section basically tells Forge that you want to use the authentication & permissions “identity” of the Forge App itself. 
    - There is an alternative to this which is `asUser()` which uses the auth/permissions of the current active user too, but we’re not using that with that. 
    - This functionality abstracts away possibly the most complex part of building integrations.
        - You get fully featured, secure OAuth - with literally zero complexity for the developer.
    - You can also see that we’re using that `route` template string. This lets you offload the complexity of managing the domain/sub-domain of the Site who's api you are calling to the Forge runtime.
          - All you need to do is provide the API path to the endpoint you want to call, and Forge will figure out all the other routing complexity for you.
          - This all just uses standard Bitbucket Cloud REST API's, nothing Forge specific: https://developer.atlassian.com/cloud/bitbucket/rest/api-group-pullrequests/#api-group-pullrequests
          - Finally, you’re interpolating a few values into the API path.
          - The object that is returned from that function has a `.json()` method on it to parse the response, and then we return that value from the function.
- Back in the `comment.js` file, we’re going to import the function we just created, and then save the output of that to a variable. We’re also going to wrap that in a try/catch block to handle any errors.
```javascript
import {
  PullRequestCommentedEvent,
} from "bitbucket-karma-helpers";
import { fetchComment } from "/src/api.js";


/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;
  
  // convert the raw event into an instance of the class so it's easier to work with.
  const commentEvent = new PullRequestCommentedEvent(event);
  
  // get the comment data from Bitbcket API
  let comment;
  try {
    comment = await fetchComment(commentEvent);
    console.log("retrieved comment");
  } catch (e) {
    console.error(`Unable to fetch comment ${commentEvent.commentId}`);
    console.error(e);
    return;
  }
};
```

## Checking Score Changes:
- We now have the full comment data, now we can actually check to see if any changes in the Karma points were found.
  - Everything we’re going to do here is just business logic, there’s absolutely nothing Forge related.
  - In addition, a lot of it is fairly fiddly regex pattern matching to look for the "++" and "--" signs, count how many of them there are, aggregate them if there’s multiple users tagged in a single comment, etc.
  - Because of this, we've created another helper function in the `bitbucket-karma-helpers` package that we can just import and use instead.
    - Again, if you’re interested, all the code for these helpers is available in the tutorial repo under the `helpers` folder.
  - In `comment.js`, import that `findKarmaInstructions` function from the library, and pass the raw content of the comment to it to get back all the Karma updates.
```javascript
import {
  PullRequestCommentedEvent,
  findKarmaInstructions,
} from "bitbucket-karma-helpers";
import { fetchComment } from "/src/api.js";

/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;
  
  // convert the raw event into an instance of the class so it's easier to work with.
  const commentEvent = new PullRequestCommentedEvent(event);
  
  let comment;
  try {
    comment = await fetchComment(commentEvent);
    console.log("retrieved comment");
  } catch (e) {
    console.error(`Unable to fetch comment ${commentEvent.commentId}`);
    console.error(e);
    return;
  }
  
  // Get the Karma instructions from the comment.
  const karmaInstructions = findKarmaInstructions(comment.content.raw);
};
```

## Updating Score and Generating Response:
- We now know what changes we need to make to each users Karma score. What we’re going to do now is update everyone’s scores, and generate a message to return back to the product as a reply to the original comment. 
  - The first thing we’re going to do is create a `storage.js` file, we’re going to use this to store some data in the Forge App Storage feature to track peoples Karma scores. 
  - The reason we need to do this first is that we want to reply to the comment with peoples updated Karma scores, not their old ones. So we need to work with Forge Storage before we can generate the message to send back. 
    - App Storage is basically a little database built into Forge. It lets you store data against a particular App installation. This is particularly powerful because it means that a given app can share pieces of data across different screens etc in the product, as long as it’s all within the same App. 
      - To give you a practical example, we can store the Karma score of each user in Storage from one Pull Request, and then access/update that score from a different pull request. 
      - We could, in theory, even allow people to add/remove Karma from things like Code comments or other text-entry fields if we wanted to, but we’re not going to do that today.
  - In the `storage.js` file we’re going to import the `storage` function from the forge/api library, and then create three simple functions for managing Karma scores in Forge Storage.
  - We're also going to check if the user giving the Karma is trying to give it to themselves.
    - If they are, we don't give them any extra, and instead just return the current amount.
```javascript
import { storage } from "@forge/api";

/**
 * @param {string} userId
 * @returns {Promise<number>}
 */
const getKarma = async (userId) => {
  return (await storage.get(userId)) || 0;
};

/**
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<void>}
 */
const setKarma = async (userId, amount) => {
  await storage.set(userId, amount);
};

/**
 * @param {KarmaInstruction} instruction
 * @param {PullRequestComment} comment
 * @returns {Promise<KarmaScore>}
 */
export const updateKarma = async (instruction, comment) => {
  const current = await getKarma(instruction.user);

  // if the user is giving points to themselves, do not update their score, just return the existing score.
  if (instruction.user === comment.user.account_id)
    return { user: instruction.user, score: current };

  // otherwise, update their score and return the new value.
  const next = current + instruction.change;
  await setKarma(instruction.user, next);
  return { user: instruction.user, score: next };
};
```

  - Back in `karma.js`, import the `updateKarma` function you just created, so that we can set and get peoples current Karma scores before generating the message to send back.
  - Call that function and save the output to a variable `karmaScores` for the next step in the process.
```javascript
import {
  PullRequestCommentedEvent,
  findKarmaInstructions,
} from "bitbucket-karma-helpers";
import { fetchComment } from "/src/api.js";

/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;

  // convert the raw event into an instance of the class so it's easier to work with.
  const commentEvent = new PullRequestCommentedEvent(event);

  let comment;
  try {
    comment = await fetchComment(commentEvent);
    console.log("retrieved comment");
  } catch (e) {
    console.error(`Unable to fetch comment ${commentEvent.commentId}`);
    console.error(e);
    return;
  }

  // Get the Karma instructions from the comment.
  const karmaInstructions = findKarmaInstructions(comment.content.raw);

  // Update scores and return the new totals per user.
  const karmaScores = await updateKarmaScores(karmaInstructions, comment);
};
```

- We’re then going to use a function from the helpers library that takes the `karmaScores` + the original comment, and generates an array of strings to send as a reply to the original comment.
  - Import the `generateKarmaReplies` function from the `bitbucket-karma-helpers` library.
  - Then call the `generateKarmaReply` function, saving the output to a variable called `karmaReply`.
    - Part of this function checks to make sure the user isn't giving themselves Karma. If they are, they get returned a message telling them to stop.
```javascript
import {
  PullRequestCommentedEvent,
  findKarmaInstructions,
  generateKarmaReply,
} from "bitbucket-karma-helpers";
import { fetchComment } from "/src/api.js";

/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;

  // convert the raw event into an instance of the class so it's easier to work with.
  const commentEvent = new PullRequestCommentedEvent(event);

  let comment;
  try {
    comment = await fetchComment(commentEvent);
    console.log("retrieved comment");
  } catch (e) {
    console.error(`Unable to fetch comment ${commentEvent.commentId}`);
    console.error(e);
    return;
  }

  // Get the Karma instructions from the comment.
  const karmaInstructions = findKarmaInstructions(comment.content.raw);

  // Update scores and return the new totals per user.
  const karmaScores = await updateKarmaScores(karmaInstructions, comment);

  // generate a list of replies to send back.
  const karmaReply = await generateKarmaReply(karmaScores, comment);
};

```

## Sending Reply Comments:
- The last step of this process is to send a reply comment back to Bitbucket, telling the users who were given points what they’re updated point number is, or telling the self-karma-er to stop it.
  - The first thing we’re going to do is go to the `api.js` file and create a new function called `replyToComment` which will take the original Comment Event and the string for the new comment to post.
    - We’re going to use the same `route` feature from the `@forge/api` library as we did before to generate the URL for the Create Comment API.
    - We’re then just going to create a request body following the structure provided in the Bitbucket Cloud API docs for creating a comment, and then add that body into the configuration object for making the API call.
    - Finally, use the same `requestBitbucket()` function as before to call the Bitbucket API, passing in the route you want to call, and the details of the request we want to make.
```javascript
import api, { route } from "@forge/api";

/**
 * @param {PullRequestCommentedEvent} event
 * @returns {Promise<PullRequestComment>}
 */
export const fetchComment = async (event) => {
  const res = await api
    .asApp()
    .requestBitbucket(
      route`/2.0/repositories/${event.workspaceId}/${event.repositoryId}/pullrequests/${event.pullRequestId}/comments/${event.commentId}?fields=content.*,user.*,id`
    );

  return res.json();
};

/**
 * @param {PullRequestCommentedEvent} parent
 * @param {string} comment
 * @returns {Promise<void>}
 */
export const replyToComment = async (parent, comment) => {
  const requestRoute = route`/2.0/repositories/${parent.workspaceId}/${parent.repositoryId}/pullrequests/${parent.pullRequestId}/comments`;

  const body = {
    content: {
      raw: comment,
    },
    parent: {
      id: parent.commentId,
    },
  };

  const requestDetails = {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  };

  await api.asApp().requestBitbucket(requestRoute, requestDetails);
};
```

  - Back in `comment.js`, import the new `replytoComment` function and then call that function, passing the `karmaReply` and `commentEvent` variables as arguments.
    - Make sure that's wrapped in a try/catch block in case there are any errors with the API request.
  - Add a final `console.log` so that you can see when everything has completed.
```javascript
import {
  PullRequestCommentedEvent,
  findKarmaInstructions,
  generateKarmaReply,
} from "bitbucket-karma-helpers";
import { fetchComment } from "/src/api.js";
import { replyToComment } from "/src/api.js";

/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;

  // convert the raw event into an instance of the class so it's easier to work with.
  const commentEvent = new PullRequestCommentedEvent(event);

  let comment;
  try {
    comment = await fetchComment(commentEvent);
    console.log("retrieved comment");
  } catch (e) {
    console.error(`Unable to fetch comment ${commentEvent.commentId}`);
    console.error(e);
    return;
  }

  // Get the Karma instructions from the comment.
  const karmaInstructions = findKarmaInstructions(comment.content.raw);

  // Update scores and return the new totals per user.
  const karmaScores = await updateKarmaScores(karmaInstructions, comment);

  // generate a list of replies to send back.
  const karmaReply = await generateKarmaReply(karmaScores, comment);

  // create the reply comment.
  try {
    await replyToComment(karmaReply, commentEvent);
  } catch (e) {
    console.error(`Unable to write reply to comment ${comment.id}`);
    console.error(e);
    return;
  }

  console.log(`Processed comment ${comment.id}`);
};
```

## Testing Again:
- Fire back up your forge tunnel commands so you can test the app.
  - If you still have the tunnel running, I want you to close it with ctrl+c and then re-run it.
```shell
forge tunnel
```

- If you go to your terminal, you’re going to see that there are some permission errors. This is because you are trying to use features that you haven’t asked for the API scopes for.
  - Open up your `manifest.yml` file, and there are two new scopes you need to add to the scopes section.
    - One allows you to write back to the pull request API, for creating the comment.
    - The other allows you to access the Forge Storage api, for storing your Karma scores.
```yaml
permissions:
  scopes:
    - 'read:pullrequest:bitbucket'
    - 'write:pullrequest:bitbucket'
    - 'storage:app'
modules:
  # registered the function code with Forge
  function:
    # given the function a name
    - key: on-comment-created
      # told forge where to find the code to run
      handler: comment.onCreated
  # defined the trigger to run the code
  trigger:
    # given the trigger a name
    - key: pull-request-commented
      # told it what function we want to run when it fires
      function: on-comment-created
      # told it what events from BBC we want it to be triggered by.
      events:
        - avi:bitbucket:created:pullrequest-comment
app:
  id: <your-app-id-here>
```

- Now, because we’ve updated the scopes our App can access, we need to update its installation.
  - This is to make sure that admins of the Workspaces it’s installed in get to explicitly approve any changes in App scopes before they are applied.
  - Because you’re working in a Workspace that you are the admin of today, that should be pretty simple.
- First, you need to deploy the updated version of your app to the Forge platform.
```shell
forge deploy
```

- Then you need to update the existing installations of your app in the Workspace you are working in.
    - Run `forge install --upgrade` in your terminal 
    - It will ask you what site you want to update the installation on, there should be only one choice, so just press enter 
    - It will confirm the new scopes you’ve granted to the app, so enter "y" and press enter 
    - The app installation will then update, and now you can run the `forge tunnel` again so you can test the app.
- Once you see “Listening for requests…” you’re ready to test.
  - Go to your Pull Request and @tag yourself in a comment, followed by a bunch of “+” signs. 
  - You should see in your terminal some logs, telling you the comment was processed. 
  - Now go back to Bitbucket and click on the little “reload page” popup down the bottom. 
    - You should see a response from your app telling you you’ve been bad!
  - If you have another person in your workspace, try @tagging them instead and adding "++" signs. 
    - Watch the same process and then reload the page, you should see the reply from the App telling the person how many points they now have in Karmas.
