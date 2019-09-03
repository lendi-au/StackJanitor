import { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import { CloudFormation } from "aws-sdk";
import { logger } from "../logger";
import {
  convertTags,
  getStackJanitorStatus,
  getTagsFromStacks
} from "./logCloudFormationStack";
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

export const checkStackJanitorStatus = async (
  Stacks: CloudFormation.Stack[]
) => {
  try {
    const tags = getTagsFromStacks(Stacks);
    const customTags = convertTags(tags);
    return getStackJanitorStatus(customTags);
  } catch (e) {
    logger.error(e);
    return StackStatus.Disabled;
  }
};

export const deleteCloudFormationStack = async (
  event: DynamoDBStreamEvent,
  cloudFormation: CloudFormation
) => {
  const StackNames = await getStackNamesFromStreamEvent(event);

  for (let StackName of StackNames) {
    if (!StackName) {
      return;
    }
    const { Stacks } = await cloudFormation
      .describeStacks({ StackName })
      .promise();

    if (!Stacks) {
      return;
    }

    const status = await checkStackJanitorStatus(Stacks);
    if (status === StackStatus.Enabled) {
      try {
        await cloudFormation.deleteStack({ StackName }).promise();
      } catch (e) {
        logger.error(e);
      }
    }
  }
};

export const index = async (event: DynamoDBStreamEvent) => {
  return await deleteCloudFormationStack(event, cloudFormation);
};
