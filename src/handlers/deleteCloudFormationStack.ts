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

class StackJanitorNotEnabledError extends Error {
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
      if (err instanceof StackJanitorNotEnabledError) {
        logger.error(`${err.message} - ${eventDetails}`);
        return;
      }
      logger.error(err);
      throw err;
    }
  }
}

export const index = async (event: DynamoDBStreamEvent) => {
  const records = parseEventRecords<DataItem>(event);
  await processRecords(records);
};
