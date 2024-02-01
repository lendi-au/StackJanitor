import config from "../config";
import {
  CloudFormationEvent,
  DataItem,
  DeleteItem,
  StackJanitorStatus,
} from "stackjanitor";
import { logger } from "../logger";
import { Actions, JanitorRecord } from "../data/DynamoDataModel";
import { Entity } from "dynamodb-toolbox";
import { getStackArn } from "../cloudformation";

export enum RequestType {
  Create = "CreateStack",
  Update = "UpdateStack",
  Delete = "DeleteStack",
}

export enum MonitoringResultStatus {
  Success = "success",
  Ignore = "ignore",
}

export const getExpirationTime = (eventTime: string): number =>
  new Date(eventTime).getTime() / 1000 +
  Number(config.DEFAULT_EXPIRATION_PERIOD);

export const generateItemFromEvent = (event: CloudFormationEvent): DataItem => {
  const expirationTime = getExpirationTime(event.detail.eventTime);
  return {
    stackName: event.detail.requestParameters.stackName,
    stackId: event.detail.responseElements?.stackId,
    expirationTime: expirationTime,
    tags: JSON.stringify(event.detail.requestParameters.tags),
    deleteCount: 0,
  };
};

// Takes the old DataItem and creates a new one as a retry
export const generateRepeatedDeleteItem = (oldItem: DataItem): DataItem => {
  const deleteCount = oldItem.deleteCount ? oldItem.deleteCount + 1 : 1;
  const newExpiration =
    Math.floor(new Date().getTime() / 1000) +
    config.DELETE_INTERVAL * deleteCount;
  return {
    stackName: oldItem.stackName,
    stackId: oldItem.stackId,
    expirationTime: newExpiration,
    tags: oldItem.tags,
    deleteCount,
  };
};

export const generateDeleteItem = async (
  event: CloudFormationEvent,
): Promise<DeleteItem> => {
  let stackName: string;
  let stackId: string | undefined;

  if (event.detail.eventName === RequestType.Delete) {
    logger.info(`matched eventName ${RequestType.Delete}`);
    // matches "arn:aws:cloudformation:ap-southeast-2:01234567890:stack/dna-ml-poc-teddy/fe4b14b0-b0fa-11ee-901a-02e779f78083"
    if (event.detail.requestParameters.stackName.startsWith("arn")) {
      stackName = event.detail.requestParameters.stackName.split("/")[1];
      stackId = event.detail.requestParameters.stackName;
      // tricky else block where the DeleteStack is called but no ARN is in the stackId
    } else {
      stackName = event.detail.requestParameters.stackName;
      stackId = await getStackArn(stackName);
    }
    // when not delete event, should have the stackId in the event body
  } else {
    stackName = event.detail.requestParameters.stackName;
    stackId = event.detail.responseElements?.stackId;
  }

  return {
    stackName,
    stackId,
  };
};

export const handleDataItem = async (
  item: DataItem | DeleteItem,
  handler: Entity,
  action: Actions,
) => {
  try {
    switch (action) {
      case Actions.Create:
        await handler.put(item);
        break;
      case Actions.Destroy:
        if (!item.stackId) {
          logger.info(item, "No stackId to destroy, exiting early");
          break;
        }
        await handler.delete(item);
        break;
      case Actions.Get:
        await handler.get(item);
        break;
      case Actions.Update:
        await handler.update(item);
        break;
      default:
        throw new Error(`Unmatched action: ${action}`);
    }
    return MonitoringResultStatus.Success;
  } catch (e: any) {
    logger.error(
      {
        stackInfo: item,
        stack: e.stack,
      },
      e.message,
    );
    return MonitoringResultStatus.Ignore;
  }
};

export const monitorCloudFormationStack = async (
  event: CloudFormationEvent,
  dataMapper: Entity,
) => {
  switch (event.detail.eventName) {
    case RequestType.Create:
      const inputItem = generateItemFromEvent(event);
      return handleDataItem(inputItem, dataMapper, Actions.Create);

    case RequestType.Update:
      const updateItem = generateItemFromEvent(event);
      return handleDataItem(updateItem, dataMapper, Actions.Update);

    case RequestType.Delete:
      const deleteItem = await generateDeleteItem(event);
      return handleDataItem(deleteItem, dataMapper, Actions.Destroy);

    default:
      return MonitoringResultStatus.Ignore;
  }
};

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  const { event } = stackJanitorStatus;
  return await monitorCloudFormationStack(event, JanitorRecord);
};
