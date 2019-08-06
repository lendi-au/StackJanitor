import config from "./config";
import { DynamoDB } from "aws-sdk";
import { StackJanitorStatus } from "stackjanitor";
import { logger } from "./helpers";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

const documentClient = new DynamoDB.DocumentClient();

export enum RequestType {
  CREATE = "Create",
  UPDATE = "Update"
}

const ExpirationTime =
  new Date().getTime() + 1000 * 60 * 60 * config.DEFAULT_EXPIRATION_HOURS;

export const putItem = async (
  params: DocumentClient.PutItemInput
): Promise<DocumentClient.PutItemOutput> => {
  try {
    return await documentClient.put(params).promise();
  } catch (e) {
    logger(e.message);
  }
};

export const updateItem = async (
  params: DocumentClient.UpdateItemInput
): Promise<DocumentClient.UpdateItemOutput> => {
  try {
    return await documentClient.update(params).promise();
  } catch (e) {
    logger(e.message);
  }
};

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  const tableName = config.DYNAMODB_TABLE;
  const { event } = stackJanitorStatus;

  if (event.detail.eventName == RequestType.CREATE) {
    const inputParams = {
      TableName: tableName,
      Item: {
        stackName: event.detail.requestParameters.stackName,
        expirationTime: ExpirationTime
      }
    };
    return putItem(inputParams);
  }
  if (event.detail.eventName == RequestType.UPDATE) {
    const updateParams = {
      TableName: tableName,
      Key: {
        stackName: event.detail.requestParameters.stackName,
        expirationTime: ExpirationTime
      }
    };
    return updateItem(updateParams);
  }
};
