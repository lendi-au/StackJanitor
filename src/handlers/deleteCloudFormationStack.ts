import { DynamoDBStreamEvent } from "aws-lambda";
import { CloudFormation, DynamoDB } from "aws-sdk";
import { logger } from "../logger";
import { checkStackJanitorStatus } from "./logCloudFormationStack";
import { StackStatus } from "../StackStatusTag";

const cloudFormation = new CloudFormation();

export const index = async (event: DynamoDBStreamEvent): Promise<void> => {
  const removeRecords = event.Records.filter(
    record => record.eventName === "REMOVE"
  );

  const items = removeRecords.map(i => {
    if (i.dynamodb && i.dynamodb.NewImage) {
      const image = i.dynamodb.NewImage;
      return DynamoDB.Converter.unmarshall(image);
    } else {
      return {};
    }
  });
  const stackNames = items.map(i => i.stackName);

  for (let stackName of stackNames) {
    const status = await checkStackJanitorStatus(stackName);
    if (status === StackStatus.Enabled) {
      try {
        await cloudFormation.deleteStack({ StackName: stackName }).promise();
      } catch (e) {
        logger.error(e);
      }
    }
  }
};
