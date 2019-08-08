import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, StackJanitorStatus } from "stackjanitor";
import { logger } from "./helpers";
import { Stack, Tag } from "aws-sdk/clients/cloudformation";

const cloudFormation = new CloudFormation();

export enum Const {
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
  const tag = tags.find(tag => tag.Key === Const.TAG);
  return tag ? tag.Value : "disabled";
};

export const index = async (
  event: CloudFormationEvent,
  _context: Context
): Promise<StackJanitorStatus> => {
  logger(event);
  let Status: string = Const.DISABLED;

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

  return {
    event,
    results: {
      stackjanitor: Status
    }
  };
};
