import { CloudFormation } from "aws-sdk";
import {
  CloudFormationEvent,
  CustomTag,
  StackJanitorStatus,
  StackStatus,
  TagName
} from "stackjanitor";
import { logger } from "../logger";
import { Stack, StackName, Tag } from "aws-sdk/clients/cloudformation";
import { deleteItem, RequestType } from "./monitorCloudFormationStack";

const cloudFormation = new CloudFormation();

export const getTagsFromStacks = (stacks: Stack[]): Tag[] =>
  stacks
    .filter(stackInfo => Array.isArray(stackInfo.Tags))
    .map(stackInfo => stackInfo.Tags!)
    .reduce((currentTag, accumulatedTags) =>
      accumulatedTags.concat(currentTag)
    );

export const findTag = (tags: CustomTag[]) => tags.find(t => t.key === TagName);

export const getStackJanitorStatus = (tags: CustomTag[]): StackStatus => {
  const tag = findTag(tags);
  if (tag && tag.value === StackStatus.Enabled) {
    return StackStatus.Enabled;
  }
  return StackStatus.Disabled;
};

export const describeStacks = async (StackName: StackName) => {
  return cloudFormation
    .describeStacks({
      StackName
    })
    .promise();
};

export const convertTags = (tags: Tag[]): CustomTag[] => {
  return tags.map(tag => {
    return {
      key: tag.Key,
      value: tag.Value
    };
  });
};

export const index = async (
  event: CloudFormationEvent
): Promise<StackJanitorStatus> => {
  let stackStatus: StackStatus = StackStatus.Disabled;

  // only CreateEvent has tags in event->detail->requestParameters
  if (event.detail.eventName === RequestType.Create) {
    const tags = event.detail.requestParameters.tags;
    stackStatus = getStackJanitorStatus(tags);
  } else {
    // For all other types of Stack events tags need to be fetched
    try {
      const { Stacks } = await describeStacks(
        event.detail.requestParameters.stackName
      );

      if (Stacks) {
        const tags = getTagsFromStacks(Stacks);
        const customTags = convertTags(tags);
        event.detail.requestParameters.tags = customTags;
        stackStatus = getStackJanitorStatus(customTags);
      }
    } catch (e) {
      logger.error(e);
    }

    // if updated stack has no or disabled stackjanitor tag remove DD row
    if (
      event.detail.eventName === RequestType.Update &&
      stackStatus !== StackStatus.Enabled
    ) {
      await deleteItem(event);
    }
  }

  return {
    event,
    results: {
      stackjanitor: stackStatus
    }
  };
};
