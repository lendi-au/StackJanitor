import { DynamoDBStreamEvent } from "aws-lambda";
import { CloudFormation, DynamoDB } from "aws-sdk";
import { logger } from "./logger";
import { checkStackJanitorStatus, StackTag } from "./logCloudFormationStack";

const cloudFormation = new CloudFormation();

export const index = async (event: DynamoDBStreamEvent): Promise<void> => {
  const removeRecords = event.Records.filter(
    record => record.eventName === "REMOVE"
  );

  const items = removeRecords.map(i =>
    DynamoDB.Converter.unmarshall(i.dynamodb.NewImage)
  );
  const stackNames = items.map(i => i.stackName);

  for (let stackName of stackNames) {
    const status = await checkStackJanitorStatus(stackName);
    if (status === StackTag.ENABLED) {
      try {
        await cloudFormation.deleteStack({ StackName: stackName }).promise();
      } catch (e) {
        logger.error(e);
      }
    }
  }
};
