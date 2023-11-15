import { CloudFormation, Stack } from "@aws-sdk/client-cloudformation";

export const describeAllStacks = async (
  nextToken?: string,
): Promise<Stack[]> => {
  const cloudFormation = new CloudFormation();
  let returnValue: Stack[] = [];
  const allStacks = await cloudFormation.describeStacks({
    NextToken: nextToken,
  });
  if (!allStacks.Stacks) {
    return returnValue;
  }
  returnValue = returnValue.concat(allStacks.Stacks);
  if (allStacks.NextToken) {
    returnValue = returnValue.concat(
      await describeAllStacks(allStacks.NextToken),
    );
  }
  return returnValue;
};
