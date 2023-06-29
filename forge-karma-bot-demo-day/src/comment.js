import { fetchComment } from "/src/api.js";
import { updateKarmaScores } from "/src/karma.js";
import {
  findKarmaInstructions,
  PullRequestCommentedEvent,
  generateKarmaReply,
} from "bitbucket-karma-helpers";
import { replyToComment } from "/src/api.js";

/**
 * @description this will run our logic when the comment is created.
 * @param {Object} event
 * @param {ForgeContext} context
 */
export const onCreated = async (event, context) => {
  // make sure the comment is created by an actual user, otherwise we'll enter an infinite loop when our own app adds a comment back.
  if (event.actor.type !== "user") return;
  console.log('event', event)
  console.log('context', context)

  // convert the raw event into an instance of the class so it's easier to work with.
  const commentEvent = new PullRequestCommentedEvent(event);

  // get the full comment details.
  let comment;

  try {
    comment = await fetchComment(commentEvent);
    console.log("retrieved comment");
  } catch (e) {
    console.error(`Unable to fetch comment ${commentEvent.commentId}`);
    console.error(e);
    return null;
  }

  // exit if the comment could not be retrieved.
  if (!comment || !comment?.content?.raw) return;

  // Get the relative score changes provided in the comment
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
