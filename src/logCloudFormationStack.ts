import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, CONST, describeStacks } from "./types";
import { Tag } from "aws-sdk/clients/cloudformation";
const cloudFormation = new CloudFormation();
export const getStackTags = (
  event: CloudFormationEvent,
  describeStacks: describeStacks
): Promise<Tag[]> =>
  new Promise((resolve, reject) => {
    try {
      const params = {
        StackName: event.detail.requestParameters.stackName
      };

      describeStacks(params, (err, data) => {
        if (err) {
          return reject(err.message);
        }
        let tags: Tag[] = [];
        data.Stacks.forEach(stack => {
          stack.Tags.forEach(tag => {
            tags.push(tag);
          });
        });
        return resolve(tags);
      });
    } catch (e) {
      return reject(e);
    }
  });

export const index = async (event: CloudFormationEvent, _context: Context) => {
  let tagValue: string = CONST.DISABLED;

  const tags = await getStackTags(event, cloudFormation.describeStacks);
  tags.forEach(tag => {
    if (tag.Key === CONST.TAG) {
      tagValue = tag.Value;
    }
  });

  return {
    results: {
      stackjanitor: tagValue
    }
  };
};
