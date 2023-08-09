import config from "../config";

import { CloudFormation, Stack } from "@aws-sdk/client-cloudformation";

export const describeAllStacks = async (nextToken?: string) => {
  const cloudFormation = new CloudFormation();
  let returnValue: Stack[] = [];
  const allStacks = await cloudFormation.describeStacks({
    NextToken: nextToken
  });
  if (!allStacks.Stacks) {
    return returnValue;
  }
  returnValue = returnValue.concat(allStacks.Stacks);
  if (allStacks.NextToken) {
    returnValue = returnValue.concat(
      await describeAllStacks(allStacks.NextToken)
    );
  }
  return returnValue;
};

export function returnStackStatus(stacks: Stack[]) {
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
    if (stackStatus.includes(String(stack.StackStatus))) {
      return stack;
    }
  });
  return desiredStacks;
}

export function returnStackTags(stacks: Stack[]) {
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

export function isStackExpired(stack: Stack[]) {
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
    } else if (stack.CreationTime) {
      const CreateExpirationTime =
        new Date(stack.CreationTime).getTime() / 1000 +
        DefaultSearchDeletePeriod;
      if (CreateExpirationTime < dateTime) {
        return stack;
      }
    } else {
      // no create/update time available return stack for deletion as we don't want it!
      return stack;
    }
  });
  return expiredStacks;
}

export function getStackName(stack: Stack[]) {
  const stackNames = stack.map(stack => {
    const stackName = stack.StackName;
    return stackName;
  });
  return stackNames as string[];
}

export function deleteStack(stackName: string) {
  const cloudFormation = new CloudFormation();
  return cloudFormation.deleteStack({ StackName: stackName });
}

export const handler = async () => {
  const allStacks = await describeAllStacks();
  if (allStacks) {
    const desiredStacks = returnStackStatus(allStacks);
    const stackjanitorEnabledStacks = returnStackTags(desiredStacks);
    const expiredStacks = isStackExpired(stackjanitorEnabledStacks);
    const stackNames = getStackName(expiredStacks);
    stackNames.forEach(async (stackname: string) => {
      await deleteStack(stackname);
    });
  }
};
