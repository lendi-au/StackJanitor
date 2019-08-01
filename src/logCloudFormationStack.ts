import { CloudFormation } from "aws-sdk";
import { Context } from "aws-lambda";
import { CloudFormationEvent, CONST } from "./types";
import { Tag } from "aws-sdk/clients/cloudformation";
const cloudFormation = new CloudFormation();

const getStackTags = (event: CloudFormationEvent): Promise<Tag[]> =>
  new Promise((resolve, reject) => {
    try {
      const params = {
        StackName: event.detail.requestParameters.stackName
      };

      cloudFormation.describeStacks(params, (err, data) => {
        if (err) {
          return reject(err);
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

  const tags = await getStackTags(event);
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
