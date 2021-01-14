import { DynamoDBStreamEvent } from "aws-lambda";
import { logger } from "../logger";
import { StackStatus } from "../tag/TagStatus";
import {
  DynamoDBEventType,
  ParsedRecord,
  parseEventRecords
} from "./dynamoParser";
import { CustomTag, DataItem } from "stackjanitor";
import { deleteStack } from "../cloudformation";
import config from "../config";
import {
  generateRepeatedDeleteItem,
  handleDataItem
} from "./monitorCloudFormationStack";
import { dataModel } from "../data/DynamoDataModel";

class StackJanitorNotEnabledError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function isStackJanitorEnabled(tags: CustomTag[]) {
  const status = tags.find(tag => tag.key === "stackjanitor")?.value;
  return status === StackStatus.Enabled;
}

export const deleteCloudFormationStack = async (item: DataItem) => {
  const { stackName, tags } = item;

  const isEnabled = isStackJanitorEnabled(JSON.parse(tags));

  if (!isEnabled) {
    throw new StackJanitorNotEnabledError(
      `StackJanitor is not enabled for ${stackName}`
    );
  }

  logger.info(`Deleting CFN stack: ${stackName}`);
  await deleteStack(stackName);
  logger.info(`CFN Stack: ${stackName} deleted successfully`);
};

async function processRecords(records: ParsedRecord<DataItem>[]) {
  for (const record of records) {
    const { eventID, oldData, eventName } = record;
    const eventDetails = `Event ID: ${eventID}, Event Name: ${eventName}`;

    logger.info(`Started processing Dynamo stream. ${eventDetails}`);

    if (!(eventName === DynamoDBEventType.Remove) || !oldData) {
      logger.info(`Ignoring event ${eventName}. ${eventDetails}`);
      return;
    }

    if (!oldData) {
      logger.info(`Data is null ${eventName}. Cannot proceed. ${eventDetails}`);
      return;
    }

    try {
      await deleteCloudFormationStack(oldData);
    } catch (err) {
      if (
        err instanceof StackJanitorNotEnabledError ||
        (err instanceof ValidationError &&
          err.message.includes("does not exist"))
      ) {
        logger.error(`${err.message} - ${eventDetails}`);
        return;
      }

      logger.error(`${err.message} - ${eventDetails}`);
      // throw err;

      // Handles when there is a dependency between some stack deletes
      // and a successive attempt at deleting will succeed.
      // So here we recreate the dynamodb record with a shorter TTL
      // based on the deleteCount
      if (
        record.oldData?.deleteCount &&
        record.oldData.deleteCount > config.MAX_CLEANUP_RETRY
      ) {
        // Log message to cloudwatch
        logger.error(
          `Failed to delete stack after ${config.MAX_CLEANUP_RETRY} additional attempts: ${oldData.stackName}`
        );
      } else {
        // Recreate record
        const deleteItem = generateRepeatedDeleteItem(oldData);
        await handleDataItem(deleteItem, dataModel.create);
        return;
      }
    }
  }
}

export const index = async (event: DynamoDBStreamEvent) => {
  const records = parseEventRecords<DataItem>(event);
  await processRecords(records);
};
