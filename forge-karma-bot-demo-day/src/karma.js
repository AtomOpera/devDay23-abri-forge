import { updateKarma } from "/src/storage.js";
import { replyToComment } from "/src/api.js";

/**
 * @param {KarmaInstruction[]} karmaInstructions
 * @param {PullRequestComment} comment
 * @returns {Promise<KarmaScore[]>}
 */
export const updateKarmaScores = async (karmaInstructions, comment) => {
    console.log("updating karma scores");
    const scores = [];

    // update all the scores for each instruction. Returning the updated score for each.
    for (const instruction of karmaInstructions) {
        const score = await updateKarma(instruction, comment);
        scores.push(score);
    }

    // return the list of updated scores.
    return scores;
};

/**
 * @param {string[]} karmaReplies
 * @param {PullRequestCommentedEvent} commentEvent
 * @param {PullRequestComment} comment
 * @returns {Promise<void>}
 */
export const processKarmaReplies = async (
    karmaReplies,
    commentEvent,
    comment
) => {
    console.log("processing karma updates");
    if (!karmaReplies.length) return;

    // default comment is the first item in the list.
    let karmaComment = karmaReplies[0];

    // combine multiple items if they exist.
    if (karmaReplies.length > 1) {
        karmaComment = karmaReplies.map((s) => `* ${s}`).join("\n");
    }

    // create the reply comment.
    try {
        console.log(`replying to karma comment: ${karmaComment}`);

        await replyToComment(commentEvent, karmaComment);
    } catch (e) {
        console.error(`Unable to write reply to comment ${comment.id}`);
        console.error(e);
    }
};
