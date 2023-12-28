import {
  CloudFormationClient,
  DeleteStackCommand,
  DeleteStackCommandInput,
} from "@aws-sdk/client-cloudformation";

export function deleteStack(stackName: string) {
  const cloudFormation = new CloudFormationClient();
  const deleteStackInput: DeleteStackCommandInput = { StackName: stackName };
  const deleteStackCommand = new DeleteStackCommand(deleteStackInput);
  return cloudFormation.send(deleteStackCommand);
}
