import config from "../config";
import { DynamoDB } from "aws-sdk";
import {
  CloudFormationEvent,
  DynamoDbLog,
  StackJanitorStatus
} from "stackjanitor";
import { logger } from "../logger";
import {
  DeleteItemOutput,
  PutItemOutput,
  UpdateItemInput,
  UpdateItemOutput
} from "aws-sdk/clients/dynamodb";
import { Context } from "aws-lambda";

const dynamoDb = new DynamoDB();
const documentClient = new DynamoDB.DocumentClient();
const tableName = config.DEFAULT_DYNAMODB_TABLE;

export enum RequestType {
  Create = "CreateStack",
  Update = "UpdateStack",
  Delete = "DeleteStack"
}

export enum MonitoringResultStatus {
  Success = "success",
  Ignore = "ignore"
}

export const putItem = (dynamoDBLog: DynamoDbLog): Promise<PutItemOutput> => {
  const { event, expirationTime } = dynamoDBLog;
  return documentClient
    .put({
      TableName: tableName,
      Item: {
        stackName: event.detail.requestParameters.stackName,
        stackId: event.detail.responseElements.stackId,
        expirationTime: expirationTime
      }
    })
    .promise();
};

export const updateItem = (
  dynamoDBLog: DynamoDbLog
): Promise<UpdateItemOutput> => {
  const { event, expirationTime } = dynamoDBLog;

  const updateParams: UpdateItemInput = {
    ExpressionAttributeNames: {
      "#ET": "expirationTime"
    },
    ExpressionAttributeValues: {
      ":e": {
        N: "" + expirationTime
      }
    },
    Key: {
      stackName: {
        S: event.detail.requestParameters.stackName
      },
      stackId: {
        S: event.detail.responseElements.stackId
      }
    },
    ReturnValues: "ALL_NEW",
    TableName: tableName,
    UpdateExpression: "SET #ET = :e"
  };
  return dynamoDb.updateItem(updateParams).promise();
};

export const deleteItem = (
  event: CloudFormationEvent
): Promise<DeleteItemOutput> => {
  let stackName: string;
  let stackId: string;

  if (event.detail.eventName === RequestType.Delete) {
    stackName = event.detail.requestParameters.stackName.split("/")[1];
    stackId = event.detail.requestParameters.stackName;
  } else {
    stackName = event.detail.requestParameters.stackName;
    stackId = event.detail.responseElements.stackId;
  }

  return documentClient
    .delete({
      TableName: tableName,
      Key: {
        stackName,
        stackId
      }
    })
    .promise();
};

export const getExpirationTime = (eventTime: string): number =>
  new Date(eventTime).getTime() / 1000 +
  Number(config.DEFAULT_EXPIRATION_PERIOD);

export const index = async (
  stackJanitorStatus: StackJanitorStatus,
  _context: Context
): Promise<MonitoringResultStatus> => {
  const { event } = stackJanitorStatus;
  const expirationTime = getExpirationTime(event.detail.eventTime);

  if (event.detail.eventName === RequestType.Create) {
    try {
      await putItem({ event, expirationTime });
      return MonitoringResultStatus.Success;
    } catch (e) {
      logger.error(e);
    }
  }
  if (event.detail.eventName === RequestType.Update) {
    try {
      await updateItem({ event, expirationTime });
      return MonitoringResultStatus.Success;
    } catch (e) {
      logger.error(e);
    }
  }

  if (event.detail.eventName === RequestType.Delete) {
    try {
      await deleteItem(event);
    } catch (e) {
      logger.error(e);
    }
    return MonitoringResultStatus.Success;
  }

  return MonitoringResultStatus.Ignore;
};
