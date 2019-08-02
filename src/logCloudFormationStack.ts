import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, Const, StackJanitorStatus } from "./types";
import { logger } from "./helpers";

const cloudFormation = new CloudFormation();

export const getTagsFromStacks = async (
  stacks: CloudFormation.Stack[]
): Promise<CloudFormation.Tag[]> =>
  stacks
    .map(stackInfo => stackInfo.Tags)
    .reduce((currentTag, accumulatedTags) =>
      accumulatedTags.concat(currentTag)
    );

export const getStackJanitorStatus = (tags: CloudFormation.Tag[]): string => {
  const tag = tags.find(tag => tag.Key === Const.TAG);
  return tag ? tag.Value : "disabled";
};

export const index = async (
  event: CloudFormationEvent,
  _context: Context
): Promise<StackJanitorStatus> => {
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
    results: {
      stackjanitor: Status
    }
  };
};
