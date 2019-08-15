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

export const getTagsFromStacks = (stacks: Stack[]): Tag[] =>
  stacks
    .map(stackInfo => stackInfo.Tags)
    .reduce((currentTag, accumulatedTags) =>
      accumulatedTags.concat(currentTag)
    );

export const getStackJanitorStatus = (tags: Tag[]): string => {
  const tag = tags.find(tag => tag.Key === StackTag.TAG);
  return tag ? tag.Value : "disabled";
};

export const describeStacks = async StackName => {
  const { Stacks } = await cloudFormation
    .describeStacks({
      StackName
    })
    .promise();
  return Stacks;
};

export const checkStackJanitorStatus = async StackName => {
  const Stacks = await describeStacks(StackName);
  const tags = getTagsFromStacks(Stacks);
  return getStackJanitorStatus(tags);
};

export const index = async (
  event: CloudFormationEvent,
  _context: Context
): Promise<StackJanitorStatus> => {
  let status: string = StackTag.DISABLED;

  try {
    status = await checkStackJanitorStatus(
      event.detail.requestParameters.stackName
    );
  } catch (e) {
    logger(e);
  }

  if (
    event.detail.eventName === RequestType.UPDATE &&
    status === StackTag.DISABLED
  ) {
    await deleteItem(event);
  }

  return {
    event,
    results: {
      stackjanitor: status
    }
  };
};
