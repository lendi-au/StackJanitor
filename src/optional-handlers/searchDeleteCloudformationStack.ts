import config from "../config";

import * as AWS from "aws-sdk";

import { Stacks } from "aws-sdk/clients/cloudformation";

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
  const desiredStacks = stacks.filter(stack => {
    if (stackStatus.includes(stack.StackStatus)) {
      return stack;
    }
  });
  return desiredStacks;
}

export function returnStackTags(stacks: Stacks) {
  const stackjanitorEnabledStacks = stacks.filter(stack => {
    if (stack.Tags) {
      if (
        stack.Tags.find(tag => tag.Key === "stackjanitor")?.Value === "enabled"
      ) {
        return stack;
      }
    }
  });
  return stackjanitorEnabledStacks;
}

export function isStackExpired(stack: Stacks) {
  const DefaultSearchDeletePeriod =
    Number(config.DEFAULT_EXPIRATION_PERIOD) + 259200; // 259200 seconds === 3 days
  const expiredStacks = stack.filter(stack => {
    let dateTime = new Date().getTime() / 1000;
    if (stack.LastUpdatedTime) {
      const UpdateExpirationTime =
        new Date(stack.LastUpdatedTime).getTime() / 1000 +
        DefaultSearchDeletePeriod;
      if (UpdateExpirationTime < dateTime) {
        return stack;
      }
    } else {
      const CreateExpirationTime =
        new Date(stack.CreationTime).getTime() / 1000 +
        DefaultSearchDeletePeriod;
      if (CreateExpirationTime < dateTime) {
        return stack;
      }
    }
  });
  return expiredStacks;
}

export function getStackName(stack: Stacks) {
  const stackNames = stack.map(stack => {
    const stackName = stack.StackName;
    return stackName;
  });
  return stackNames;
}

export function deleteStack(stackName: string) {
  const cloudFormation = new AWS.CloudFormation();
  console.log(`Deleting stack ${stackName}`);
  return cloudFormation.deleteStack({ StackName: stackName }).promise();
}

export const handler = async () => {
  const cloudFormation = new AWS.CloudFormation();
  AWS.config.update({ region: config.DEFAULT_REGION });
  const allStacks = await cloudFormation.describeStacks().promise();
  if (allStacks.Stacks) {
    const desiredStacks = returnStackStatus(allStacks.Stacks);
    const stackjanitorEnabledStacks = returnStackTags(desiredStacks);
    const expiredStacks = isStackExpired(stackjanitorEnabledStacks);
    const stackNames = getStackName(expiredStacks);
    if (stackNames.length === 0) {
      return "No expired stacks found";
    } else {
      stackNames.forEach(async (stackname: string) => {
        await deleteStack(stackname);
      });
    }
  }
};

// testing only...
// handler();
