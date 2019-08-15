import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, StackJanitorStatus } from "stackjanitor";
import { logger } from "./helpers";
import { Stack, Tag } from "aws-sdk/clients/cloudformation";
import { deleteItem, RequestType } from "./monitorCloudFormationStack";

const cloudFormation = new CloudFormation();

export enum StackTag {
  TAG = "stackjanitor",
  ENABLED = "enabled",
  DISABLED = "disabled"
}

export const getTagsFromStacks = async (stacks: Stack[]): Promise<Tag[]> =>
  stacks
    .map(stackInfo => stackInfo.Tags)
    .reduce((currentTag, accumulatedTags) =>
      accumulatedTags.concat(currentTag)
    );

export const getStackJanitorStatus = (tags: Tag[]): string => {
  const tag = tags.find(tag => tag.Key === StackTag.TAG);
  return tag ? tag.Value : "disabled";
};

export const index = async (
  event: CloudFormationEvent,
  _context: Context
): Promise<StackJanitorStatus> => {
  let Status: string = StackTag.DISABLED;

  try {
    const params = {
      StackName: event.detail.requestParameters.stackName
    };

    const { Stacks } = await cloudFormation.describeStacks(params).promise();

    const tags = await getTagsFromStacks(Stacks);
    Status = getStackJanitorStatus(tags);
  } catch (e) {
    logger(e);
  }

  if (event.detail.eventName === RequestType.UPDATE && Status === "disabled") {
    await deleteItem(event);
  }

  return {
    event,
    results: {
      stackjanitor: Status
    }
  };
};
