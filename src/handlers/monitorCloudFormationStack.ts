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
    console.log("matched eventName"); // might need to debug and validate if this if block makes sense.
    // matches "arn:aws:cloudformation:ap-southeast-2:01234567890:stack/dna-ml-poc-teddy/fe4b14b0-b0fa-11ee-901a-02e779f78083"
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
  handler: Entity,
  action: Actions,
) => {
  try {
    switch (action) {
      case Actions.Create:
        await handler.put(item);
        break;
      case Actions.Destroy:
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

export const monitorCloudFormationStack = (
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
      const deleteItem = generateDeleteItem(event);
      return handleDataItem(deleteItem, dataMapper, Actions.Destroy);

    default:
      return MonitoringResultStatus.Ignore;
  }
};

export const index = async (stackJanitorStatus: StackJanitorStatus) => {
  const { event } = stackJanitorStatus;
  return monitorCloudFormationStack(event, JanitorRecord);
};

// (async () => {
//   await index({
//     event: {
//       id: "",
//       detail: {
//         userIdentity: {
//           type: "",
//           sessionContext: {
//             sessionIssuer: {
//               userName: "",
//             },
//           },
//         },
//         eventName: RequestType.Create,
//         eventTime: Date(),
//         requestParameters: {
//           tags: [],
//           parameters: [],
//           stackName: "teddy-test-2",
//         },
//         responseElements: {
//           stackId: "testing",
//         },
//       },
//     },
//     results: {
//       stackjanitor: "",
//     },
//   });
// })();
