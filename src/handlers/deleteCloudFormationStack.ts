import { DynamoDBStreamEvent } from "aws-lambda";
import { logger } from "../logger";
import { StackStatus } from "../tag/TagStatus";
import {
  DynamoDBEventType,
  ParsedRecord,
  parseEventRecords,
} from "./dynamoParser";
import { CustomTag, DataItem } from "stackjanitor";
import { deleteStack } from "../cloudformation";
import config from "../config";
import {
  generateRepeatedDeleteItem,
  handleDataItem,
} from "./monitorCloudFormationStack";
import { Actions, JanitorRecord } from "../data/DynamoDataModel";

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
  const status = tags.find((tag) => tag.key === "stackjanitor")?.value;
  return status === StackStatus.Enabled;
}

export const deleteCloudFormationStack = async (item: DataItem) => {
  const { stackName, tags } = item;

  const isEnabled = isStackJanitorEnabled(JSON.parse(tags));

  if (!isEnabled) {
    throw new StackJanitorNotEnabledError(
      `StackJanitor is not enabled for ${stackName}`,
    );
  }

  logger.info({ stackInfo: item }, `Deleting CFN stack: ${stackName}`);

  await deleteStack(stackName);

  logger.info(
    { stackInfo: item },
    `CFN Stack: ${stackName} deleted successfully`,
  );
};

async function processRecords(records: ParsedRecord<DataItem>[]) {
  for (const record of records) {
    const { eventID, oldData, eventName } = record;
    const eventDetails = {
      eventID,
      eventName,
    };

    logger.info(eventDetails, `Started processing Dynamo stream.`);

    if (!(eventName === DynamoDBEventType.Remove) || !oldData) {
      logger.info(eventDetails, `Ignoring event ${eventName}.`);
      return;
    }

    if (!oldData) {
      logger.info(
        eventDetails,
        `Data is null for ${eventName}. Cannot proceed.`,
      );
      return;
    }

    try {
      await deleteCloudFormationStack(oldData);
    } catch (err: any) {
      if (
        err instanceof StackJanitorNotEnabledError ||
        (err instanceof ValidationError &&
          err.message.includes("does not exist"))
      ) {
        logger.error(
          {
            stackInfo: oldData,
            ...eventDetails,
          },
          `${err.message}`,
        );
        return;
      }

      logger.error(
        {
          stackInfo: oldData,
          ...eventDetails,
        },
        `${err.message}`,
      );
      // throw err;

      // Handles when there is a dependency between some stack deletes
      // and a successive attempt at deleting will succeed.
      // So here we recreate the dynamodb record with a shorter TTL
      // based on the deleteCount
      if (
        record.oldData?.deleteCount &&
        record.oldData.deleteCount > Number(config.MAX_CLEANUP_RETRY)
      ) {
        // Log message to cloudwatch
        logger.error(
          {
            stackInfo: oldData,
            ...eventDetails,
          },
          `Failed to delete stack after ${config.MAX_CLEANUP_RETRY} additional attempts: ${oldData.stackName}`,
        );
      } else {
        // Recreate record
        const deleteItem = generateRepeatedDeleteItem(oldData);
        await handleDataItem(deleteItem, JanitorRecord, Actions.Create);
        return;
      }
    }
  }
}

export const index = async (event: DynamoDBStreamEvent) => {
  const records = parseEventRecords<DataItem>(event);
  await processRecords(records);
};
