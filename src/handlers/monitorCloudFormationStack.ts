import config from "../config";
import {
  CloudFormationEvent,
  DataItem,
  DeleteItem,
  StackJanitorStatus
} from "stackjanitor";
import { logger } from "../logger";
import {
  ActionHandler,
  DataMapper,
  dataMapper
} from "../data/DynamoDataMapper";

export enum RequestType {
  Create = "CreateStack",
  Update = "UpdateStack",
  Delete = "DeleteStack"
}

export enum MonitoringResultStatus {
  Success = "success",
  Ignore = "ignore"
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
    tags: event.detail.requestParameters.tags
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
    stackId
  };
};

export const handleDataItem = async (
  item: DataItem | DeleteItem,
  handler: ActionHandler
) => {
  try {
    await handler(item);
    return MonitoringResultStatus.Success;
  } catch (e) {
    logger.error(e);
    return MonitoringResultStatus.Ignore;
  }
};

export const monitorCloudFormationStack = (
  event: CloudFormationEvent,
  dataMapper: DataMapper
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
  return await monitorCloudFormationStack(event, dataMapper);
};
