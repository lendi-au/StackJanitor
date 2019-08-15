import { DynamoDBStreamEvent } from "aws-lambda";
import { CloudFormation } from "aws-sdk";
import { logger } from "./logger";
import { checkStackJanitorStatus, StackTag } from "./logCloudFormationStack";
import { DeleteStackInput } from "aws-sdk/clients/cloudformation";

const cloudFormation = new CloudFormation();

export enum Action {
  REMOVE = "REMOVE"
}

export const getStackNamesFromStreamEvent = (
  event: DynamoDBStreamEvent
): string[] =>
  event.Records.filter(record => record.eventName === Action.REMOVE).map(
    record => record.dynamodb.Keys.stackName.S
  );

export const deleteStack = async (
  params: DeleteStackInput
): Promise<boolean> => {
  try {
    await cloudFormation.deleteStack(params).promise();
    return true;
  } catch (e) {
    logger.error(e);
    return false;
  }
};

export const index = async (event: DynamoDBStreamEvent): Promise<boolean> => {
  let deleteResult: boolean = false;
  const StackNames = await getStackNamesFromStreamEvent(event);

  for (let StackName of StackNames) {
    const status = await checkStackJanitorStatus(StackName);
    if (status === StackTag.ENABLED) {
      deleteResult = await deleteStack({ StackName });
    }
  }

  return deleteResult;
};
