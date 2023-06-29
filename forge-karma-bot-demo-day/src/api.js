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
 * @param {string} comment
 * @param {PullRequestCommentedEvent} parent
 * @returns {Promise<void>}
 */
export const replyToComment = async (comment, parent) => {
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
