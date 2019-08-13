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

export const index = async (event: DynamoDBStreamEvent) => {
  getStackNamesFromStreamEvent(event).map(async StackName => {
    const params = {
      StackName
    };

    // TODO: Delete CloudJanitorTest only for the time being
    if (StackName === "CloudJanitorTest") {
      try {
        await cloudFormation.deleteStack(params, (err, data) => {
          if (err) return logger(err);
          logger(data);
        });
      } catch (e) {
        logger(e);
      }
    }
  });
};
