import config from "../config";
import { CloudFormationEvent, StackJanitorStatus } from "stackjanitor";
import { logger } from "../logger";
import { stackJanitorData } from "../data/StackJanitorDataModel";
import { promisify } from "util";

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

export const generateItemFromEvent = (event: CloudFormationEvent) => {
  const expirationTime = getExpirationTime(event.detail.eventTime);
  return {
    stackName: event.detail.requestParameters.stackName,
    stackId: event.detail.responseElements.stackId,
    expirationTime: expirationTime,
    tags: event.detail.requestParameters.tags
  };
};

export const generateDeleteItem = (event: CloudFormationEvent) => {
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

export const putItem = (event: CloudFormationEvent) => {
  const item = generateItemFromEvent(event);
  return promisify(stackJanitorData.create)(item);
};

export const updateItem = (event: CloudFormationEvent) => {
  const item = generateItemFromEvent(event);
  return promisify(stackJanitorData.update)(item);
};

export const deleteItem = (event: CloudFormationEvent) => {
  const item = generateDeleteItem(event);
  return promisify(stackJanitorData.destroy)(item);
};

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  const { event } = stackJanitorStatus;

  switch (event.detail.eventName) {
    case RequestType.Create:
      try {
        await putItem(event);
        return MonitoringResultStatus.Success;
      } catch (e) {
        logger.error(e);
      }
      break;

    case RequestType.Update:
      try {
        await updateItem(event);
        return MonitoringResultStatus.Success;
      } catch (e) {
        logger.error(e);
      }
      break;

    case RequestType.Delete:
      try {
        await deleteItem(event);
        return MonitoringResultStatus.Success;
      } catch (e) {
        logger.error(e);
      }
      break;

    default:
      return MonitoringResultStatus.Ignore;
  }
};
