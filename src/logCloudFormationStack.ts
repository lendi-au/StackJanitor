import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, CONST } from "./types";
import { Tag } from "aws-sdk/clients/cloudformation";
const cloudFormation = new CloudFormation();

export const getStackTags = async (
  event: CloudFormationEvent
): Promise<Tag[]> => {
  try {
    const params = {
      StackName: event.detail.requestParameters.stackName
    };

    const { Stacks } = await cloudFormation.describeStacks(params).promise();

    return Stacks.map(stackInfo => stackInfo.Tags).reduce(
      (currentTag, accumulatedTags) => accumulatedTags.concat(currentTag)
    );
  } catch (e) {
    return e;
  }
};

export const index = async (event: CloudFormationEvent, _context: Context) => {
  const tags = await getStackTags(event);
  const { Value } = tags.find(tag => tag.Key === CONST.TAG);
  return {
    results: {
      stackjanitor: Value
    }
  };
};
