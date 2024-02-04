import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  generateDeleteItem,
  generateItemFromEvent,
  getExpirationTime,
  monitorCloudFormationStack,
  MonitoringResultStatus,
} from "./monitorCloudFormationStack";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Entity, Table } from "dynamodb-toolbox";

describe("monitorCloudFormationStack:generateDeleteItem", () => {
  test("it should return correct format for deleteStack event", async () => {
    const event = {
      detail: {
        userIdentity: {
          userName: "jordan.simonovski",
        },
        eventTime: "2019-07-21T22:41:21Z",
        eventName: "DeleteStack",
        requestParameters: {
          stackName:
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a",
        },
        responseElements: null,
      },
    };
    expect(await generateDeleteItem(event)).toStrictEqual({
      stackName: "log-archive-management",
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a",
    });
  });

  test("it should return correct format for deleteStack event", async () => {
    const event = {
      detail: {
        userIdentity: {
          userName: "test_user",
        },
        eventTime: "2019-07-21T22:41:21Z",
        eventName: "UpdateStack",
        requestParameters: {
          stackName: "product-api-latest-development",
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/product-api-latest-development/8c0e2370-b9a5-11e9-abf5-02afb887c468",
        },
      },
    };
    expect(await generateDeleteItem(event)).toStrictEqual({
      stackName: "product-api-latest-development",
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/product-api-latest-development/8c0e2370-b9a5-11e9-abf5-02afb887c468",
    });
  });
});

describe("monitorCloudFormationStack:getExpirationTime", () => {
  test("it should return correct expired EPOCH", () => {
    const eventTime = "2019-08-09T01:35:55Z";
    const expectedExpirationEpoch = 1565919355;

    expect(getExpirationTime(eventTime)).toEqual(expectedExpirationEpoch);
  });
});

describe("monitorCloudFormationStack:generateItemFromEvent", () => {
  test("it should return correct item format from CloudFormation event", () => {
    const event = {
      time: "2019-08-09T01:56:24Z",
      detail: {
        userIdentity: {
          sessionContext: {
            sessionIssuer: {
              userName: "development-poweruser",
            },
          },
        },
        eventTime: "2019-08-09T01:56:24Z",
        eventName: "CreateStack",

        requestParameters: {
          tags: [
            {
              value: "enabled",
              key: "stackjanitor",
            },
            {
              value: "1",
              key: "v1",
            },
          ],
          stackName: "CloudJanitorTest",
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70",
        },
      },
    };
    expect(generateItemFromEvent(event)).toEqual({
      deleteCount: 0,
      stackName: "CloudJanitorTest",
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70",
      expirationTime: 1565920584,
      tags: '[{"value":"enabled","key":"stackjanitor"},{"value":"1","key":"v1"}]',
    });
  });
});

describe("monitorCloudFormationStack", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const event = {
    time: "2019-08-09T01:56:24Z",
    detail: {
      userIdentity: {
        sessionContext: {
          sessionIssuer: {
            userName: "development-poweruser",
          },
        },
      },
      eventTime: "2019-08-09T01:56:24Z",
      eventName: "CreateStack",

      requestParameters: {
        tags: [
          {
            value: "enabled",
            key: "stackjanitor",
          },
          {
            value: "1",
            key: "v1",
          },
        ],
        stackName: "CloudJanitorTest",
        parameters: [],
      },
      responseElements: {
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70",
      },
    },
  };

  const marshallOptions = {
    // Whether to automatically convert empty strings, blobs, and sets to `null`.
    convertEmptyValues: false, // false, by default.
    // Whether to remove undefined values while marshalling.
    removeUndefinedValues: false, // false, by default.
    // Whether to convert typeof object to map attribute.
    convertClassInstanceToMap: false, // false, by default.
  };

  const unmarshallOptions = {
    // Whether to return numbers as a string instead of converting them to native JavaScript numbers.
    wrapNumbers: false, // false, by default.
  };

  const translateConfig = { marshallOptions, unmarshallOptions };

  const DocumentClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      endpoint: "http://localhost:4567",
      region: "us-east-1",
      credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
      },
    }),
    translateConfig,
  );

  const TestTable = new Table({
    name: "test-table",
    partitionKey: "stackName",
    sortKey: "stackId",
    DocumentClient,
  });

  const TestEntity = new Entity({
    name: "TestEntity",
    autoExecute: false,
    attributes: {
      stackName: { type: "string", partitionKey: true }, // flag as partitionKey
      stackId: { type: "string", sortKey: true }, // flag as sortKey and mark hidden
      expirationTime: { type: "number" }, // set the attribute type
      tags: { type: "string" },
      deleteCount: { type: "number" },
    },
    table: TestTable,
  });

  test("monitorCloudFormationStack should be successful for: CreateStack", async () => {
    event.detail.eventName = "CreateStack";
    const status = await monitorCloudFormationStack(event, TestEntity);
    expect(status).toEqual(MonitoringResultStatus.Success);
  });

  test("monitorCloudFormationStack should be successful for: UpdateStack", async () => {
    event.detail.eventName = "UpdateStack";
    const status = await monitorCloudFormationStack(event, TestEntity);
    expect(status).toEqual(MonitoringResultStatus.Success);
  });

  test("monitorCloudFormationStack should be successful for: DeleteStack", async () => {
    event.detail.eventName = "DeleteStack";
    event.detail.requestParameters.stackName = "arn:other:teddy/my-stack";
    const status = await monitorCloudFormationStack(event, TestEntity);
    expect(status).toEqual(MonitoringResultStatus.Success);
  });

  test("monitorCloudFormationStack should be ignored for other eventName", async () => {
    event.detail.eventName = "BumpStack";
    const status = await monitorCloudFormationStack(event, TestEntity);
    expect(status).toEqual(MonitoringResultStatus.Ignore);
  });
});
