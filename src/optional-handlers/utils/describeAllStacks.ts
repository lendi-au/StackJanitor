import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStacksCommandInput,
  Stack,
} from "@aws-sdk/client-cloudformation";

export const describeAllStacks = async (
  nextToken?: string,
): Promise<Stack[]> => {
  const cloudFormation = new CloudFormationClient();
  let returnValue: Stack[] = [];
  const describeStacksInput: DescribeStacksCommandInput = {
    NextToken: nextToken,
  };
  const describeStacksCmd = new DescribeStacksCommand(describeStacksInput);
  const allStacks = await cloudFormation.send(describeStacksCmd);
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
