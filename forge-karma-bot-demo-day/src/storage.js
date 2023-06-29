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
