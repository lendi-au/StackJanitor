import {
  generateDeleteItem,
  generateItemFromEvent,
  getExpirationTime,
  monitorCloudFormationStack,
  MonitoringResultStatus
} from "./monitorCloudFormationStack";

describe("monitorCloudFormationStack:generateDeleteItem", () => {
  test("it should return correct format for deleteStack event", () => {
    const event = {
      detail: {
        userIdentity: {
          userName: "jordan.simonovski"
        },
        eventTime: "2019-07-21T22:41:21Z",
        eventName: "DeleteStack",
        requestParameters: {
          stackName:
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a"
        },
        responseElements: null
      }
    };
    expect(generateDeleteItem(event)).toStrictEqual({
      stackName: "log-archive-management",
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a"
    });
  });

  test("it should return correct format for deleteStack event", () => {
    const event = {
      detail: {
        userIdentity: {
          userName: "test_user"
        },
        eventTime: "2019-07-21T22:41:21Z",
        eventName: "UpdateStack",
        requestParameters: {
          stackName: "product-api-latest-development"
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/product-api-latest-development/8c0e2370-b9a5-11e9-abf5-02afb887c468"
        }
      }
    };
    expect(generateDeleteItem(event)).toStrictEqual({
      stackName: "product-api-latest-development",
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/product-api-latest-development/8c0e2370-b9a5-11e9-abf5-02afb887c468"
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
              userName: "development-poweruser"
            }
          }
        },
        eventTime: "2019-08-09T01:56:24Z",
        eventName: "CreateStack",

        requestParameters: {
          tags: [
            {
              value: "enabled",
              key: "stackjanitor"
            },
            {
              value: "1",
              key: "v1"
            }
          ],
          stackName: "CloudJanitorTest"
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70"
        }
      }
    };
    expect(generateItemFromEvent(event)).toEqual({
      stackName: "CloudJanitorTest",
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70",
      expirationTime: 1565920584,
      tags:
        '[{"value":"enabled","key":"stackjanitor"},{"value":"1","key":"v1"}]'
    });
  });
});

describe("monitorCloudFormationStack", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const event = {
    time: "2019-08-09T01:56:24Z",
    detail: {
      userIdentity: {
        sessionContext: {
          sessionIssuer: {
            userName: "development-poweruser"
          }
        }
      },
      eventTime: "2019-08-09T01:56:24Z",
      eventName: "CreateStack",

      requestParameters: {
        tags: [
          {
            value: "enabled",
            key: "stackjanitor"
          },
          {
            value: "1",
            key: "v1"
          }
        ],
        stackName: "CloudJanitorTest"
      },
      responseElements: {
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70"
      }
    }
  };

  const mockDataMapper = {
    create: (arg: any) => Promise.resolve(arg),
    update: (arg: any) => Promise.resolve(arg),
    destroy: (arg: any) => Promise.resolve(arg),
    get: (arg: any) => Promise.resolve(arg)
  };

  test("monitorCloudFormationStack should be successful for: CreateStack", async () => {
    event.detail.eventName = "CreateStack";
    const status = await monitorCloudFormationStack(event, mockDataMapper);
    expect(status).toEqual(MonitoringResultStatus.Success);
  });

  test("monitorCloudFormationStack should be successful for: UpdateStack", async () => {
    event.detail.eventName = "UpdateStack";
    const status = await monitorCloudFormationStack(event, mockDataMapper);
    expect(status).toEqual(MonitoringResultStatus.Success);
  });

  test("monitorCloudFormationStack should be successful for: DeleteStack", async () => {
    event.detail.eventName = "DeleteStack";
    const status = await monitorCloudFormationStack(event, mockDataMapper);
    expect(status).toEqual(MonitoringResultStatus.Success);
  });

  test("monitorCloudFormationStack should be ignored for other eventName", async () => {
    event.detail.eventName = "BumpStack";
    const status = await monitorCloudFormationStack(event, mockDataMapper);
    expect(status).toEqual(MonitoringResultStatus.Ignore);
  });
});
