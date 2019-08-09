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
  logger(event);
  getStackNamesFromStreamEvent(event).map(async StackName => {
    const params = {
      StackName
    };

    // TODO: Delete CloudJanitorTest only for the time being
    if (StackName === "CloudJanitorTest") {
      logger(params);
      try {
        await cloudFormation.deleteStack(params, (err, data) => {
          logger("getting called");
          if (err) return logger(err);
          logger(data);
        });
      } catch (e) {
        logger(e);
      }
    }
  });
};
