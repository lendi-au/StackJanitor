import { APIGatewayEvent } from "aws-lambda";
import { BitbucketWebhookEvent, DataItem, GitTag, State } from "stackjanitor";
import { DataModel, dataModel } from "../data/DynamoDataModel";
import { logger } from "../logger";
import { handleDataItem } from "./monitorCloudFormationStack";
import { findStacksFromTag } from "../helpers";

export const SEARCH_KEY = "tags";

export enum Response {
  IGNORE = "Ignored as PR is not in Merged or Declined state",
  SUCCESS = "Request processed"
}

export const bitbucketEventParser = (
  eventData: BitbucketWebhookEvent
): GitTag => ({
  repository: eventData.pullrequest.source.repository.name,
  branch: eventData.pullrequest.source.branch.name
});

export const isBitbucketEvent = (event: any): event is BitbucketWebhookEvent =>
  event.hasOwnProperty("pullrequest") && event.hasOwnProperty("repository");

const deleteDynamoRow = async (dataItem: DataItem, dataModel: DataModel) =>
  handleDataItem(
    {
      stackName: dataItem.stackName,
      stackId: dataItem.stackId
    },
    dataModel.destroy
  );

export const bitBucketEventHandler = async (
  eventData: BitbucketWebhookEvent,
  dataModel: DataModel
) => {
  const state = eventData.pullrequest.state;
  const inDesiredState = isInDesiredState(state);
  if (!inDesiredState)
    return {
      statusCode: 200,
      body: Response.IGNORE
    };
  const gitTag = bitbucketEventParser(eventData);
  const stacksFromTag = await findStacksFromTag(gitTag, SEARCH_KEY);
  for (let stack of stacksFromTag) {
    try {
      await deleteDynamoRow(stack, dataModel);
    } catch (e) {
      logger.error(e);
    }
  }
  return {
    statusCode: 200,
    body: Response.SUCCESS
  };
};

export const isInDesiredState = (state: State) =>
  state === State.Merged ? true : state === State.Declined;

export const index = async (event: APIGatewayEvent) => {
  if (!event.body) {
    return {
      statusCode: 200,
      body: Response.IGNORE
    };
  }

  const eventData = JSON.parse(event.body);
  if (isBitbucketEvent(eventData)) {
    return await bitBucketEventHandler(eventData, dataModel);
  }

  return {
    statusCode: 200,
    body: Response.IGNORE
  };
};
