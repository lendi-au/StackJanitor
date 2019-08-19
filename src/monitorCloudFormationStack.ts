import config from "./config";
import { DynamoDB } from "aws-sdk";
import {
  CloudFormationEvent,
  DynamoDbLog,
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

export const generateInputParams = (dynamoDBLog: DynamoDbLog): PutItemInput => {
  const { event, expirationTime } = dynamoDBLog;
  const putItemInput = {
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

  // put all tags in the DynamoDB input params
  putItemInput.Item["tags"] = {
    L: event.detail.requestParameters.tags.map(tag => ({
      M: {
        [tag.key]: {
          S: tag.value
        }
      }
    }))
  };

  return putItemInput;
};

export const putItem = (dynamoDBLog: DynamoDbLog): Promise<PutItemOutput> => {
  try {
    const inputParams: PutItemInput = generateInputParams(dynamoDBLog);
    return documentClient.putItem(inputParams).promise();
  } catch (e) {
    logger(e);
  }
};

export const updateItem = (
  dynamoDBLog: DynamoDbLog
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

export const generateDeleteParams = (event: CloudFormationEvent) => {
  let stackName: string;
  let stackId: string;

  if (event.detail.eventName === RequestType.DELETE) {
    stackName = event.detail.requestParameters.stackName.split("/")[1];
    stackId = event.detail.requestParameters.stackName;
  } else {
    stackName = event.detail.requestParameters.stackName;
    stackId = event.detail.responseElements.stackId;
  }

  return {
    Key: {
      stackName: {
        S: stackName
      },
      stackId: {
        S: stackId
      }
    },
    TableName: tableName
  };
};

export const deleteItem = (
  event: CloudFormationEvent
): Promise<DeleteItemOutput> => {
  try {
    const deleteParams: DeleteItemInput = generateDeleteParams(event);
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
