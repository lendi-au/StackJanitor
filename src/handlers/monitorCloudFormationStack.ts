import config from "../config";
import {
  CloudFormationEvent,
  DataItem,
  DeleteItem,
  StackJanitorStatus,
} from "stackjanitor";
import { logger } from "../logger";
import { ActionHandler, DataModel, dataModel } from "../data/DynamoDataModel";

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
    stackId: event.detail.responseElements.stackId,
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

export const generateDeleteItem = (event: CloudFormationEvent): DeleteItem => {
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
    stackName,
    stackId,
  };
};

export const handleDataItem = async (
  item: DataItem | DeleteItem,
  handler: ActionHandler,
) => {
  try {
    await handler(item);
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

export const monitorCloudFormationStack = (
  event: CloudFormationEvent,
  dataMapper: DataModel,
) => {
  switch (event.detail.eventName) {
    case RequestType.Create:
      const inputItem = generateItemFromEvent(event);
      return handleDataItem(inputItem, dataMapper.create);

    case RequestType.Update:
      const updateItem = generateItemFromEvent(event);
      return handleDataItem(updateItem, dataMapper.update);

    case RequestType.Delete:
      const deleteItem = generateDeleteItem(event);
      return handleDataItem(deleteItem, dataMapper.destroy);

    default:
      return MonitoringResultStatus.Ignore;
  }
};

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  const { event } = stackJanitorStatus;
  return monitorCloudFormationStack(event, dataModel);
};
