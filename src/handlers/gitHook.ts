import { APIGatewayEvent } from "aws-lambda";
import {
  BitbucketWebhookEvent,
  DataItem,
  GithubWebhookEvent,
  GitTag,
  State
} from "stackjanitor";
import { logger } from "../logger";
import { deleteDynamoRow, findStacksFromTag } from "../helpers";

export const SEARCH_KEY = "tags";

export enum Response {
  Ignore = "Ignored as PR is not in Merged or Declined state",
  Success = "Request processed"
}

export const bitbucketEventParser = (
  eventData: BitbucketWebhookEvent
): GitTag => ({
  repository: eventData.pullrequest.source.repository.name,
  branch: eventData.pullrequest.source.branch.name
});

export const gitHubEventParser = (eventData: GithubWebhookEvent): GitTag => ({
  repository: eventData.repository.name,
  branch: eventData.pull_request.head.ref
});

export const isBitbucketEvent = (event: any): event is BitbucketWebhookEvent =>
  event.hasOwnProperty("pullrequest") && event.hasOwnProperty("repository");

export const isGithubEvent = (event: any): event is GithubWebhookEvent =>
  event.hasOwnProperty("pull_request") && event.hasOwnProperty("repository");

export const bitBucketEventHandler = async (
  eventData: BitbucketWebhookEvent
) => {
  const state = eventData.pullrequest.state;
  const inDesiredState = isInDesiredState(state);
  if (!inDesiredState)
    return {
      statusCode: 200,
      body: Response.Ignore
    };
  const gitTag = bitbucketEventParser(eventData);
  return findAndDeleteStacksFromTag(gitTag);
};

export const gitHubEventHandler = async (eventData: GithubWebhookEvent) => {
  const mergedState = eventData.pull_request.merged;
  if (!mergedState)
    return {
      statusCode: 200,
      body: Response.Ignore
    };
  const gitTag = gitHubEventParser(eventData);
  return findAndDeleteStacksFromTag(gitTag);
};

export const findAndDeleteStacksFromTag = async (gitTag: GitTag) => {
  const stacksFromTag = await findStacksFromTag(gitTag, SEARCH_KEY);
  return deleteStacks(stacksFromTag);
};

export const deleteStacks = async (stacks: DataItem[]) => {
  for (let stack of stacks) {
    try {
      await deleteDynamoRow(stack);
    } catch (e) {
      logger.error(e);
    }
  }
  return {
    statusCode: 200,
    body: Response.Success
  };
};

export const isInDesiredState = (state: State) =>
  state === State.Merged ? true : state === State.Declined;

export const index = async (event: APIGatewayEvent) => {
  if (!event.body) {
    return {
      statusCode: 200,
      body: Response.Ignore
    };
  }

  const eventData = JSON.parse(event.body);
  if (isBitbucketEvent(eventData)) {
    return await bitBucketEventHandler(eventData);
  }
  if (isGithubEvent(eventData)) {
    return await gitHubEventHandler(eventData);
  }

  return {
    statusCode: 200,
    body: Response.Ignore
  };
};
