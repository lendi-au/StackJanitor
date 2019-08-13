import config from "./config";
import { DynamoDB } from "aws-sdk";
import { StackJanitorStatus } from "stackjanitor";
import { logger } from "./helpers";
import {
  DeleteItemInput,
  DeleteItemOutput,
  PutItemInput,
  PutItemOutput,
  UpdateItemInput,
  UpdateItemOutput
} from "aws-sdk/clients/dynamodb";
import { Context } from "aws-lambda";

const documentClient = new DynamoDB();

export enum RequestType {
  CREATE = "CreateStack",
  UPDATE = "UpdateStack",
  DELETE = "DeleteStack"
}

export enum Response {
  SUCCESS = "success",
  IGNORE = "ignore"
}

export const putItem = (params: PutItemInput): Promise<PutItemOutput> => {
  try {
    return documentClient.putItem(params).promise();
  } catch (e) {
    logger(e);
  }
};

export const updateItem = (
  params: UpdateItemInput
): Promise<UpdateItemOutput> => {
  try {
    return documentClient.updateItem(params).promise();
  } catch (e) {
    logger(e);
  }
};

export const deleteItem = (
  params: DeleteItemInput
): Promise<DeleteItemOutput> => {
  try {
    return documentClient.deleteItem(params).promise();
  } catch (e) {
    logger(e);
  }
};

export const getExpirationTime = (eventTime: string): number =>
  new Date(eventTime).getTime() / 1000 +
  Number(config.DEFAULT_EXPIRATION_PERIOD);

export const index = async (
  stackJanitorStatus: StackJanitorStatus,
  _context: Context
) => {
  const tableName = config.DEFAULT_DYNAMODB_TABLE;
  const { event } = stackJanitorStatus;

  const expirationTime = getExpirationTime(event.detail.eventTime);

  if (event.detail.eventName === RequestType.CREATE) {
    const inputParams = {
      TableName: tableName,
      Item: {
        stackName: {
          S: event.detail.requestParameters.stackName
        },
        stackId: {
          S: event.detail.responseElements.stackId
        },
        expirationTime: {
          N: "" + expirationTime
        }
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

    try {
      await updateItem(updateParams);
      return Response.SUCCESS;
    } catch (e) {
      logger(e);
    }
  }

  if (event.detail.eventName === RequestType.DELETE) {
    const deleteParams = {
      Key: {
        stackName: {
          S: event.detail.requestParameters.stackName.split("/")[1]
        },
        stackId: {
          S: event.detail.requestParameters.stackName
        }
      },
      TableName: tableName
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
