import { DataItem, DynamoSearchResult, GitTag } from "stackjanitor";
import {
  Actions,
  JanitorRecord,
  dynamoDataModel,
} from "./data/DynamoDataModel";
import { handleDataItem } from "./handlers/monitorCloudFormationStack";
import {
  marshall as sdkMarshall,
  marshallOptions,
  NativeAttributeValue,
  unmarshall as sdkUnmarshall,
  unmarshallOptions,
} from "@aws-sdk/util-dynamodb";
import { AttributeValue as LambdaAttributeValue } from "aws-lambda";
import { AttributeValue as SdkAttributeValue } from "@aws-sdk/client-dynamodb";
import { TextDecoder, TextEncoder } from "util";

export const findStacksFromTag = async (
  gitTag: GitTag,
  keyName: string,
): Promise<DataItem[]> => {
  const returnVal: DataItem[] = [];
  const result = (await dynamoDataModel.scan({
    filters: [
      {
        attr: keyName,
        contains: gitTag.repository,
      },
      {
        attr: keyName,
        contains: gitTag.branch,
      },
    ],
  })) as DynamoSearchResult;

  result.Items?.map((item: DataItem) => returnVal.push(item));

  return returnVal;
};

export const deleteDynamoRow = async (dataItem: DataItem) =>
  handleDataItem(
    {
      stackName: dataItem.stackName,
      stackId: dataItem.stackId,
    },
    JanitorRecord,
    Actions.Destroy,
  );

/// marshall that produces output according to the types used by aws-lambda
export function marshall<T extends { [K in keyof T]: NativeAttributeValue }>(
  data: T,
  options?: marshallOptions,
): { [key: string]: LambdaAttributeValue } {
  const sdkResult = sdkMarshall(data, options);

  const result = Object.fromEntries(
    Object.entries(sdkResult).map(([key, value]) => {
      return [key, sdkToLambdaAttr(value)];
    }),
  );

  return result;
}

function sdkToLambdaAttr(a: SdkAttributeValue): LambdaAttributeValue {
  if (a.B) {
    return { B: new TextDecoder().decode(a.B) };
  }

  if (a.BS) {
    return { BS: a.BS.map((item) => new TextDecoder().decode(item)) };
  }

  if (a.L) {
    return { L: a.L.map(sdkToLambdaAttr) };
  }

  if (a.M) {
    return {
      M: Object.fromEntries(
        Object.entries(a.M).map(([key, value]) => [
          key,
          sdkToLambdaAttr(value),
        ]),
      ),
    };
  }

  return a;
}

/// unmarshall that takes input according to the types used by aws-lambda
export function unmarshall(
  data: { [key: string]: LambdaAttributeValue },
  options?: unmarshallOptions,
): { [key: string]: NativeAttributeValue } {
  const input = Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      return [key, lambdaToSdkAttr(value)];
    }),
  );

  return sdkUnmarshall(input, options);
}

function lambdaToSdkAttr(a: LambdaAttributeValue): SdkAttributeValue {
  if (typeof a.B !== "undefined") {
    return { B: new TextEncoder().encode(a.B) };
  }

  if (typeof a.BS !== "undefined") {
    return { BS: a.BS.map((item) => new TextEncoder().encode(item)) };
  }

  if (typeof a.BOOL !== "undefined") {
    return { BOOL: a.BOOL };
  }

  if (typeof a.L !== "undefined") {
    return { L: a.L.map(lambdaToSdkAttr) };
  }

  if (typeof a.M !== "undefined") {
    return {
      M: Object.fromEntries(
        Object.entries(a.M).map(([key, value]) => [
          key,
          lambdaToSdkAttr(value),
        ]),
      ),
    };
  }

  if (typeof a.N !== "undefined") {
    return { N: a.N };
  }

  if (typeof a.NS !== "undefined") {
    return { NS: a.NS };
  }

  if (typeof a.NULL !== "undefined") {
    return { NULL: true };
  }

  if (typeof a.S !== "undefined") {
    return { S: a.S };
  }

  if (a.SS) {
    return { SS: a.SS };
  }

  throw new Error(`Unrecognized attribute value type: ${JSON.stringify(a)}`);
}
