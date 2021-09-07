import config from "../config";

import * as AWS from "aws-sdk";

import { Stacks } from "aws-sdk/clients/cloudformation";

AWS.config.update({ region: config.DEFAULT_REGION });

const cloudFormation = new AWS.CloudFormation();

export function returnStackStatus(stacks: Stacks) {
  const stackStatus = [
    "CREATE_COMPLETE",
    "UPDATE_COMPLETE",
    "CREATE_FAILED",
    "ROLLBACK_FAILED",
    "ROLLBACK_COMPLETE",
    "DELETE_FAILED",
    "UPDATE_ROLLBACK_FAILED",
    "UPDATE_ROLLBACK_COMPLETE",
    "IMPORT_ROLLBACK_FAILED",
    "IMPORT_ROLLBACK_COMPLETE"
  ];
  const newStacks1 = stacks.filter(stack => {
    if (stackStatus.includes(stack.StackStatus)) {
      return stack;
    }
  });
  return newStacks1;
}

export function returnStackTags(stacks: Stacks) {
  const newStacks2 = stacks.filter(stack => {
    if (stack.Tags) {
      if (
        stack.Tags.find(tag => tag.Key === "stackjanitor")?.Value === "enabled"
      ) {
        return stack;
      }
    }
  });
  return newStacks2;
}

export function isStackExpired(stack: Stacks) {
  const newStacks3 = stack.filter(stack => {
    let dateTime = new Date().getTime() / 1000;
    if (stack.LastUpdatedTime) {
      const UpdateExpirationTime =
        new Date(stack.LastUpdatedTime).getTime() / 1000 +
        Number(config.DEFAULT_EXPIRATION_PERIOD);
      if (UpdateExpirationTime < dateTime) {
        return stack;
      }
    } else {
      const CreateExpirationTime =
        new Date(stack.CreationTime).getTime() / 1000 +
        Number(config.DEFAULT_EXPIRATION_PERIOD);
      if (CreateExpirationTime < dateTime) {
        return stack;
      }
    }
  });
  return newStacks3;
}

export function getStackName(stack: Stacks) {
  const stackNames = stack.map(stack => {
    const stackName = stack.StackName;
    return stackName;
  });
  return stackNames;
}

export function deleteStack(stackName: string) {
  console.log(`Deleting stack ${stackName}`);
  return cloudFormation.deleteStack({ StackName: stackName }).promise();
}

export const handler = async () => {
  const allStacks = await cloudFormation.describeStacks().promise();
  if (allStacks.Stacks) {
    const stacks1 = returnStackStatus(allStacks.Stacks);
    const stacks2 = returnStackTags(stacks1);
    const stacks3 = isStackExpired(stacks2);
    const stackNames = getStackName(stacks3);
    stackNames.forEach(async (stackname: string) => {
      await deleteStack(stackname);
    });
  }
  return "No expired stacks found";
};

// testing only...
// handler();
