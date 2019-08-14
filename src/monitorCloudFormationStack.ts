import config from "./config";
import { DynamoDB } from "aws-sdk";
import {
  CloudFormationEvent,
  DynamoDBLog,
  StackJanitorStatus
} from "stackjanitor";
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
const tableName = config.DEFAULT_DYNAMODB_TABLE;

export enum RequestType {
  CREATE = "CreateStack",
  UPDATE = "UpdateStack",
  DELETE = "DeleteStack"
}

export enum Response {
  SUCCESS = "success",
  IGNORE = "ignore"
}

export const putItem = (dynamoDBLog: DynamoDBLog): Promise<PutItemOutput> => {
  const { event, expirationTime } = dynamoDBLog;
  try {
    const inputParams: PutItemInput = {
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
    return documentClient.putItem(inputParams).promise();
  } catch (e) {
    logger(e);
  }
};

export const updateItem = (
  dynamoDBLog: DynamoDBLog
): Promise<UpdateItemOutput> => {
  const { event, expirationTime } = dynamoDBLog;

  try {
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
    return documentClient.updateItem(updateParams).promise();
  } catch (e) {
    logger(e);
  }
};

export const deleteItem = (
  event: CloudFormationEvent
): Promise<DeleteItemOutput> => {
  try {
    const deleteParams: DeleteItemInput = {
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
    return documentClient.deleteItem(deleteParams).promise();
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
  const { event } = stackJanitorStatus;
  const expirationTime = getExpirationTime(event.detail.eventTime);

  if (event.detail.eventName === RequestType.CREATE) {
    try {
      await putItem({ event, expirationTime });
      return Response.SUCCESS;
    } catch (e) {
      logger(e);
    }
  }
  if (event.detail.eventName === RequestType.UPDATE) {
    try {
      await updateItem({ event, expirationTime });
      return Response.SUCCESS;
    } catch (e) {
      logger(e);
    }
  }

  if (event.detail.eventName === RequestType.DELETE) {
    try {
      await deleteItem(event);
    } catch (e) {
      logger(e);
    }
    return Response.SUCCESS;
  }

  return Response.IGNORE;
};
