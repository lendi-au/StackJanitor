import {
  CloudFormationClient,
  DeleteStackCommand,
  DeleteStackCommandInput,
  DescribeStacksCommand,
  DescribeStacksInput,
} from "@aws-sdk/client-cloudformation";

export function deleteStack(stackName: string) {
  const cloudFormation = new CloudFormationClient();
  const deleteStackInput: DeleteStackCommandInput = { StackName: stackName };
  const deleteStackCommand = new DeleteStackCommand(deleteStackInput);
  return cloudFormation.send(deleteStackCommand);
}

export const getStackArn = async (
  stackName: string,
): Promise<string | undefined> => {
  const cloudFormation = new CloudFormationClient();
  const describeStackInput: DescribeStacksInput = { StackName: stackName };
  const describeStackCommand = new DescribeStacksCommand(describeStackInput);
  const result = await cloudFormation.send(describeStackCommand);
  return result.Stacks?.[0].StackId;
};
