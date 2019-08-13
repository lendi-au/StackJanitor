import { DynamoDBStreamEvent } from "aws-lambda";
import { CloudFormation } from "aws-sdk";
import { logger } from "./helpers";

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

export const deleteStack = async params => {
  try {
    await cloudFormation.deleteStack(params).promise();
    return true;
  } catch (e) {
    logger(e);
    return false;
  }
};

export const index = async (event: DynamoDBStreamEvent) => {
  let deleteResult: boolean = false;
  const StackNames = await getStackNamesFromStreamEvent(event);

  for (let StackName of StackNames) {
    const params = {
      StackName
    };
    deleteResult = await deleteStack(params);
  }

  return deleteResult;
};
