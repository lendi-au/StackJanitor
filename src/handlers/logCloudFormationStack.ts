import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, StackJanitorStatus } from "stackjanitor";
import { logger } from "../logger";
import { Stack, StackName, Tag } from "aws-sdk/clients/cloudformation";
import { deleteItem, RequestType } from "./monitorCloudFormationStack";
import { StackStatus, TagName } from "../tag/StackStatusTag";

const cloudFormation = new CloudFormation();

export const getTagsFromStacks = (stacks: Stack[]): Tag[] =>
  stacks
    .filter(stackInfo => Array.isArray(stackInfo.Tags))
    .map(stackInfo => stackInfo.Tags!)
    .reduce((currentTag, accumulatedTags) =>
      accumulatedTags.concat(currentTag)
    );

export const getStackJanitorStatus = (tags: Tag[]): StackStatus => {
  const tag = tags.find(tag => tag.Key === TagName);

  if (tag && tag.Value === StackStatus.Enabled) {
    return StackStatus.Enabled;
  } else {
    return StackStatus.Disabled;
  }
};

export const checkStackJanitorStatus = async (
  stackName: StackName
): Promise<StackStatus> => {
  const result = await cloudFormation
    .describeStacks({
      StackName: stackName
    })
    .promise();

  if (!result.Stacks) {
    throw new Error(
      `describeStacks call for stack "${stackName}" did not return any value(s).`
    );
  }

  const tags = getTagsFromStacks(result.Stacks);
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
