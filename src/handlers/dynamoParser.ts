import {
  AttributeValue,
  DynamoDBRecord,
  DynamoDBStreamEvent,
  StreamRecord,
} from "aws-lambda";
import pkg from "lodash";
import pino from "pino";
import { unmarshall } from "../helpers";

const dynamoLoggerName = "StackJanitor-DynamoDB-stream-logger";

const createModuleLogger = (moduleName: string, level?: string) => {
  return pino({
    name: moduleName,
    base: null,
  }).child({
    module: moduleName,
    level,
    base: null,
  });
};

export enum DynamoDBEventType {
  Insert = "INSERT",
  Modify = "MODIFY",
  Remove = "REMOVE",
}

export interface ParsedRecord<T> {
  data: T | null;
  oldData: T | null;
  eventName: DynamoDBEventType;
  eventID: string;
}

export const logger = createModuleLogger(dynamoLoggerName);

const isModifiedRecordWithoutAnyChange = (record: DynamoDBRecord) =>
  record.dynamodb &&
  record.eventName === "MODIFY" &&
  !isThereChange(record.dynamodb);

function isThereChange(streamRecord: StreamRecord) {
  if (!streamRecord.NewImage || !streamRecord.OldImage) {
    logger.error("Failed to process DynamoDB stream", streamRecord);
    return;
  }

  const { updatedAt: niUpdated, ...newImage } = streamRecord.NewImage;
  const { updatedAt: oiUpdated, ...oldImage } = streamRecord.OldImage;

  return !pkg.isEqual(oldImage, newImage);
}

interface UnmarshalledData<T> {
  newData: T | null;
  oldData: T | null;
}

interface Image {
  [key: string]: AttributeValue;
}

function unmarshallItem(data: Image) {
  return unmarshall(data);
}

function unmarshallStream<T>(record: DynamoDBRecord): UnmarshalledData<T> {
  const newData = record.dynamodb?.NewImage
    ? (unmarshallItem(record.dynamodb?.NewImage) as T)
    : null;
  const oldData = record.dynamodb?.OldImage
    ? (unmarshallItem(record.dynamodb.OldImage) as T)
    : null;

  return { newData, oldData };
}

export function parseEventRecords<T>(
  event: DynamoDBStreamEvent,
): ParsedRecord<T>[] {
  if (event.Records.length === 0) {
    throw new Error("No records found.");
  }

  return event.Records.map((record): ParsedRecord<T> | undefined => {
    if (!record.eventName) {
      throw Error("DynamoDB stream event name is undefined");
    }

    if (isModifiedRecordWithoutAnyChange(record)) {
      logger.error(
        `DynamoDB stream record was not modified. Dropping event ID: ${record.eventID}`,
      );
      return;
    }

    const { newData, oldData } = unmarshallStream<T>(record);
    const eventName = record.eventName as DynamoDBEventType;

    return { data: newData, oldData, eventName, eventID: record.eventID! };
  }).filter((data): data is ParsedRecord<T> => !!data);
}
