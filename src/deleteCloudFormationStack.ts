import { DynamoDBStreamEvent } from "aws-lambda";
import { CloudFormation } from "aws-sdk";
import { logger } from "./helpers";

const cloudFormation = new CloudFormation();

export enum Const {
  REMOVE = "REMOVE"
}

export const getStackNamesFromStreamEvent = (
  event: DynamoDBStreamEvent
): string[] =>
  event.Records.filter(record => record.eventName === Const.REMOVE).map(
    record => record.dynamodb.Keys.stackName.S
  );

export const index = async (event: DynamoDBStreamEvent) => {
  logger(event);
  getStackNamesFromStreamEvent(event).map(StackName => {
    const params = {
      StackName
    };

    // TODO: Delete CloudJanitorTest only for the time being
    if (StackName === "CloudJanitorTest") {
      cloudFormation.deleteStack(params);
    }
  });
};
