import config from "./config";
import { DynamoDB } from "aws-sdk";
import { StackJanitorStatus } from "stackjanitor";
import { logger } from "./helpers";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

const documentClient = new DynamoDB.DocumentClient();

export enum RequestType {
  CREATE = "CreateStack",
  UPDATE = "UpdateStack",
  DELETE = "DeleteStack"
}

export enum Const {
  EXPIRATION_MESSAGE = "Expiration time should be greater than current time.",
  SUCCESS = "success",
  IGNORE = "ignore"
}

export const checkExpirationTime = (time: number): boolean =>
  time > config.SECONDS_SINCE_EPOCH;

export const putItem = (
  params: DocumentClient.PutItemInput
): Promise<DocumentClient.PutItemOutput> => {
  try {
    return documentClient.put(params).promise();
  } catch (e) {
    logger(e);
  }
};

export const updateItem = (
  params: DocumentClient.UpdateItemInput
): Promise<DocumentClient.UpdateItemOutput> => {
  try {
    return documentClient.update(params).promise();
  } catch (e) {
    logger(e);
  }
};

export const deleteItem = (
  params: DocumentClient.DeleteItemInput
): Promise<DocumentClient.DeleteItemOutput> => {
  try {
    return documentClient.delete(params).promise();
  } catch (e) {
    logger(e);
  }
};

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  logger(stackJanitorStatus);
  const tableName = config.DEFAULT_DYNAMODB_TABLE;
  const { event } = stackJanitorStatus;

  if (event.detail.eventName === RequestType.CREATE) {
    const inputParams = {
      TableName: tableName,
      Item: {
        stackName: event.detail.requestParameters.stackName,
        stackId: event.detail.responseElements.stackId,
        expirationTime: config.EXPIRATION_TIME
      }
    };
    if (checkExpirationTime(inputParams.Item.expirationTime)) {
      await putItem(inputParams);
      return Const.SUCCESS;
    } else {
      logger(new Error(Const.EXPIRATION_MESSAGE));
    }
  }
  if (event.detail.eventName === RequestType.UPDATE) {
    const updateParams = {
      TableName: tableName,
      Key: {
        stackName: event.detail.requestParameters.stackName,
        stackId: event.detail.responseElements.stackId,
        expirationTime: config.EXPIRATION_TIME
      }
    };
    if (checkExpirationTime(updateParams.Key.expirationTime)) {
      await updateItem(updateParams);
      return Const.SUCCESS;
    } else {
      logger(new Error(Const.EXPIRATION_MESSAGE));
    }
  }

  if (event.detail.eventName === RequestType.DELETE) {
    const deleteParams = {
      TableName: tableName,
      Key: {
        stackName: event.detail.requestParameters.stackName,
        stackId: event.detail.responseElements.stackId
      }
    };
    try {
      await deleteItem(deleteParams);
    } catch (e) {
      logger(e);
    }
    return Const.SUCCESS;
  }

  return Const.IGNORE;
};
