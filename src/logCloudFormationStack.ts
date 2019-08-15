import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, StackJanitorStatus } from "stackjanitor";
import { logger } from "./helpers";
import { Stack, StackName, Tag } from "aws-sdk/clients/cloudformation";
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
  return tag ? tag.Value : StackTag.DISABLED;
};

export const describeStacks = async (StackName: StackName) => {
  const { Stacks } = await cloudFormation
    .describeStacks({
      StackName
    })
    .promise();
  return Stacks;
};

export const checkStackJanitorStatus = async (StackName: StackName) => {
  const Stacks = await describeStacks(StackName);
  const tags = getTagsFromStacks(Stacks);
  return getStackJanitorStatus(tags);
};

export const index = async (
  event: CloudFormationEvent,
  _context: Context
): Promise<StackJanitorStatus> => {
  let status: string = StackTag.DISABLED;
  let tags: Tag[];

  // CreateEvent has tags in event->detail->requestParameters
  if (event.detail.eventName === RequestType.CREATE) {
    tags = event.detail.requestParameters.tags;
    status = getStackJanitorStatus(tags);
    return {
      event,
      results: {
        stackjanitor: status
      }
    };
  }

  // For all other types of Stack events tags need to fetched
  try {
    const Stacks = await describeStacks(
      event.detail.requestParameters.stackName
    );
    tags = getTagsFromStacks(Stacks);
    status = getStackJanitorStatus(tags);
  } catch (e) {
    logger(e);
  }

  // if updated stack has no or disabled stackjanitor tag remove DD row
  if (
    event.detail.eventName === RequestType.UPDATE &&
    status !== StackTag.ENABLED
  ) {
    await deleteItem(event);
  }

  return {
    event,
    tags: tags,
    results: {
      stackjanitor: status
    }
  };
};
