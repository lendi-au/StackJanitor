import { CloudFormation } from "aws-sdk";

const cloudFormation = new CloudFormation();

export function deleteStack(stackName: string) {
  return cloudFormation.deleteStack({ StackName: stackName }).promise();
}
