import { CloudFormation, Stack, Tag } from "@aws-sdk/client-cloudformation";

import { CloudFormationEvent, CustomTag } from "stackjanitor";
import { logger } from "../logger";
import {
  generateDeleteItem,
  handleDataItem,
  RequestType,
} from "./monitorCloudFormationStack";
import { StackStatus, TagName } from "../tag/TagStatus";
import { dataModel } from "../data/DynamoDataModel";

export const getTagsFromStacks = (stacks: Stack[]): Tag[] =>
  stacks
    .filter((stackInfo) => Array.isArray(stackInfo.Tags))
    .map((stackInfo) => stackInfo.Tags!)
    .reduce((currentTag, accumulatedTags) =>
      accumulatedTags.concat(currentTag),
    );

export const findTag = (tags: CustomTag[]) =>
  tags.find((t) => t.key === TagName);

export const getStackJanitorStatus = (tags: CustomTag[]): StackStatus => {
  const tag = findTag(tags);
  if (tag && tag.value === StackStatus.Enabled) {
    return StackStatus.Enabled;
  }
  return StackStatus.Disabled;
};

interface TagsWithValues {
  Key: string;
  Value: string;
}

export const convertTags = (tags: Tag[]): CustomTag[] => {
  const filtered = tags.filter((tag) => {
    typeof tag.Key === "string" && typeof tag.Value === "string";
  }) as TagsWithValues[];
  return filtered.map((tag) => ({
    key: tag.Key,
    value: tag.Value,
  }));
};

export const logCloudFormationStack = async (
  event: CloudFormationEvent,
  cloudFormation: CloudFormation,
) => {
  let stackStatus: StackStatus = StackStatus.Disabled;
  const eventName = event.detail.eventName;

  // only CreateEvent has tags in event->detail->requestParameters
  if (eventName === RequestType.Create) {
    const tags = event.detail.requestParameters.tags;
    stackStatus = getStackJanitorStatus(tags);
  } else {
    // For all other types of Stack events tags need to be fetched
    try {
      console.log("describing...");
      const { Stacks } = await cloudFormation.describeStacks({
        StackName: event.detail.requestParameters.stackName,
      });

      console.log(JSON.stringify(Stacks));

      console.log("where error yo");

      if (Stacks) {
        const tags = getTagsFromStacks(Stacks);
        const customTags = convertTags(tags);
        event.detail.requestParameters.tags = customTags;
        stackStatus = getStackJanitorStatus(customTags);
      }
    } catch (e: any) {
      console.log("error yo");
      console.log(e);
      logger.error(
        {
          event,
          stack: e.stack,
        },
        e.message,
      );
    }

    // if updated stack has no or disabled stackjanitor tag remove Dynamo row
    if (
      eventName === RequestType.Update &&
      stackStatus !== StackStatus.Enabled
    ) {
      const item = generateDeleteItem(event);
      console.log("error here?");
      await handleDataItem(item, dataModel.destroy);
      console.log("error oh no here?");
    }
  }

  return {
    event,
    results: {
      stackjanitor: stackStatus,
    },
  };
};
