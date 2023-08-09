import { CloudFormation } from "@aws-sdk/client-cloudformation";

const cloudFormation = new CloudFormation();

export function deleteStack(stackName: string) {
  return cloudFormation.deleteStack({ StackName: stackName });
}
