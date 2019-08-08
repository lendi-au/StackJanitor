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

export enum Response {
  SUCCESS = "success",
  IGNORE = "ignore"
}

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

export const getExirationTime = (eventTime: string): number =>
  new Date(eventTime).getTime() / 1000 +
  Number(config.DEFAULT_EXPIRATION_PERIOD);

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  logger(stackJanitorStatus);
  const tableName = config.DEFAULT_DYNAMODB_TABLE;
  const { event } = stackJanitorStatus;

  const expirationTime = getExirationTime(event.detail.eventTime);

  if (event.detail.eventName === RequestType.CREATE) {
    const inputParams = {
      TableName: tableName,
      Item: {
        stackName: event.detail.requestParameters.stackName,
        stackId: event.detail.responseElements.stackId,
        expirationTime: expirationTime
      }
    };
    try {
      await putItem(inputParams);
      return Response.SUCCESS;
    } catch (e) {
      logger(e);
    }
  }
  if (event.detail.eventName === RequestType.UPDATE) {
    const updateParams = {
      TableName: tableName,
      Key: {
        stackName: { S: event.detail.requestParameters.stackName }
      },
      ReturnConsumedCapacity: "TOTAL",
      UpdateExpression: "SET #ET = :n",
      ExpressionAttributeNames: {
        "#ET": "expirationTime"
      },
      ExpressionAttributeValues: {
        ":n": { N: expirationTime }
      }
    };
    try {
      await updateItem(updateParams);
      return Response.SUCCESS;
    } catch (e) {
      logger(e);
    }
  }

  if (event.detail.eventName === RequestType.DELETE) {
    const deleteParams = {
      TableName: tableName,
      Key: {
        stackName: event.detail.requestParameters.stackName
      }
    };
    try {
      await deleteItem(deleteParams);
    } catch (e) {
      logger(e);
    }
    return Response.SUCCESS;
  }

  return Response.IGNORE;
};
