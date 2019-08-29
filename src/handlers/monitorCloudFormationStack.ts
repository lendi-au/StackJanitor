import config from "../config";
import { DynamoDB } from "aws-sdk";
import {
  CloudFormationEvent,
  DynamoDbLog,
  StackJanitorStatus
} from "stackjanitor";
import { logger } from "../logger";
import {
  DeleteItemInput,
  DeleteItemOutput,
  PutItemInput,
  PutItemOutput,
  UpdateItemInput,
  UpdateItemOutput
} from "aws-sdk/clients/dynamodb";

const documentClient = new DynamoDB();
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

export const generateInputParams = (dynamoDBLog: DynamoDbLog): PutItemInput => {
  const { event, expirationTime } = dynamoDBLog;
  const putItemInput: PutItemInput = {
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
  const inputParams: PutItemInput = generateInputParams(dynamoDBLog);
  return documentClient.putItem(inputParams).promise();
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
  return documentClient.updateItem(updateParams).promise();
};

export const generateDeleteParams = (event: CloudFormationEvent) => {
  let stackName: string;
  let stackId: string;

  if (event.detail.eventName === RequestType.Delete) {
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
  const deleteParams: DeleteItemInput = generateDeleteParams(event);
  return documentClient.deleteItem(deleteParams).promise();
};

export const getExpirationTime = (eventTime: string): number =>
  new Date(eventTime).getTime() / 1000 +
  Number(config.DEFAULT_EXPIRATION_PERIOD);

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
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
