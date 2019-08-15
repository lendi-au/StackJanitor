import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, StackJanitorStatus } from "stackjanitor";
import { logger } from "../logger";
import { Stack, StackName, Tag } from "aws-sdk/clients/cloudformation";
import { deleteItem, RequestType } from "./monitorCloudFormationStack";
import { StackStatus, TagName } from "../StackStatusTag";

const cloudFormation = new CloudFormation();

export const getTagsFromStacks = (stacks: Stack[]): Tag[] =>
  stacks
    .map(stackInfo => stackInfo.Tags)
    .reduce((currentTag, accumulatedTags) =>
      accumulatedTags.concat(currentTag)
    );

export const getStackJanitorStatus = (tags: Tag[]): StackStatus => {
  const tag = tags.find(tag => tag.Key === TagName);

  if (tag.Value === StackStatus.Enabled) {
    return StackStatus.Enabled;
  } else {
    return StackStatus.Disabled;
  }
};

export const describeStacks = async (StackName: StackName) => {
  const { Stacks } = await cloudFormation
    .describeStacks({
      StackName
    })
    .promise();
  return Stacks;
};

export const checkStackJanitorStatus = async (
  StackName: StackName
): Promise<StackStatus> => {
  const Stacks = await describeStacks(StackName);
  const tags = getTagsFromStacks(Stacks);
  return getStackJanitorStatus(tags);
};

export const index = async (
  event: CloudFormationEvent,
  _context: Context
): Promise<StackJanitorStatus> => {
  let status: StackStatus = StackStatus.Disabled;

  try {
    status = await checkStackJanitorStatus(
      event.detail.requestParameters.stackName
    );
  } catch (e) {
    logger.error(e);
  }

  if (
    event.detail.eventName === RequestType.Update &&
    status !== StackStatus.Enabled
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
