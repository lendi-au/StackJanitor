import config from "./config";
import { DynamoDB } from "aws-sdk";
import { StackJanitorStatus } from "stackjanitor";
import { logger } from "./helpers";
import { DocumentClient } from "aws-sdk/lib/dynamodb/document_client";

const documentClient = new DynamoDB.DocumentClient();

export enum RequestType {
  CREATE = "CreateStack",
  UPDATE = "UpdateStack"
}

export enum Const {
  EXPIRATION_MESSAGE = "Expiration time should be greater than current time.",
  SUCCESS = "success",
  IGNORE = "ignore"
}

const ExpirationTime: number =
  new Date().getTime() + 1000 * 60 * 60 * config.DEFAULT_EXPIRATION_HOURS;

const checkExpirationTime = (time: number): boolean =>
  time > new Date().getTime();

export const putItem = (
  params: DocumentClient.PutItemInput
): Promise<DocumentClient.PutItemOutput> => {
  try {
    return documentClient.put(params).promise();
  } catch (e) {
    logger(e.message);
  }
};

export const updateItem = (
  params: DocumentClient.UpdateItemInput
): Promise<DocumentClient.UpdateItemOutput> => {
  try {
    return documentClient.update(params).promise();
  } catch (e) {
    logger(e.message);
  }
};

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  const tableName = config.DYNAMODB_TABLE;
  const { event } = stackJanitorStatus;

  if (event.detail.eventName === RequestType.CREATE) {
    const inputParams = {
      TableName: tableName,
      Item: {
        stackName: event.detail.requestParameters.stackName,
        expirationTime: ExpirationTime
      }
    };
    if (checkExpirationTime(inputParams.Item.expirationTime)) {
      logger(new Error(Const.EXPIRATION_MESSAGE));
    } else {
      await putItem(inputParams);
      return Const.SUCCESS;
    }
  }
  if (event.detail.eventName === RequestType.UPDATE) {
    const updateParams = {
      TableName: tableName,
      Key: {
        stackName: event.detail.requestParameters.stackName,
        expirationTime: ExpirationTime
      }
    };
    if (checkExpirationTime(updateParams.Key.expirationTime)) {
      logger(new Error(Const.EXPIRATION_MESSAGE));
    } else {
      await updateItem(updateParams);
      return Const.SUCCESS;
    }
  }

  return Const.IGNORE;
};
