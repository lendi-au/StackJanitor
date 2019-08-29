import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import { CloudFormation } from "aws-sdk";
import { logger } from "../logger";
import {
  convertTags,
  describeStacks,
  getStackJanitorStatus,
  getTagsFromStacks
} from "./logCloudFormationStack";
import { StackName } from "aws-sdk/clients/cloudformation";
import { StackStatus } from "../tag/TagStatus";

const cloudFormation = new CloudFormation();

export enum Action {
  REMOVE = "REMOVE"
}

export const getStackNamesFromStreamEvent = (
  event: DynamoDBStreamEvent
): (string | undefined)[] => {
  const removeRecords = event.Records.filter(
    record => record.eventName === Action.REMOVE
  );

  return removeRecords.map((record: DynamoDBRecord) => {
    if (record.dynamodb && record.dynamodb.Keys) {
      return record.dynamodb.Keys.stackName.S;
    }
  });
};

export const checkStackJanitorStatus = async (StackName: StackName) => {
  try {
    const { Stacks } = await describeStacks(StackName);
    if (!Stacks) {
      return StackStatus.Disabled;
    }
    const tags = getTagsFromStacks(Stacks);
    const customTags = convertTags(tags);
    return getStackJanitorStatus(customTags);
  } catch (e) {
    logger.error(e);
    return StackStatus.Disabled;
  }
};

export const index = async (event: DynamoDBStreamEvent) => {
  const StackNames = await getStackNamesFromStreamEvent(event);

  for (let StackName of StackNames) {
    if (!StackName) {
      return;
    }
    const status = await checkStackJanitorStatus(StackName);
    if (status === StackStatus.Enabled) {
      try {
        await cloudFormation.deleteStack({ StackName }).promise();
      } catch (e) {
        logger.error(e);
      }
    }
  }
};
