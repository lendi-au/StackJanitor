import {
  generateDeleteItem,
  generateItemFromEvent,
  getExpirationTime,
  index
} from "./monitorCloudFormationStack";
import util from "util";

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
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/lendi-datadog-log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a"
        },
        responseElements: null
      }
    };
    expect(generateDeleteItem(event)).toStrictEqual({
      stackName: "lendi-datadog-log-archive-management",
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/lendi-datadog-log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a"
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
      tags: [
        {
          value: "enabled",
          key: "stackjanitor"
        },
        {
          value: "1",
          key: "v1"
        }
      ]
    });
  });
});

describe("monitorCloudFormationStack:index", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  // Mocks
  const mkdirMock = jest.fn();
  jest.spyOn(util, "promisify").mockImplementation(() => mkdirMock);

  const stackJanitorStatus = {
    level: 30,
    time: 1565315802430,
    event: {
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
    },
    results: {
      stackjanitor: "enabled"
    },
    v: 1
  };

  test("monitorCloudFormationStack should be successful for: CreateStack", async () => {
    stackJanitorStatus.event.detail.eventName = "CreateStack";
    const indexOutput = await index(stackJanitorStatus);
    expect(indexOutput).toEqual("success");
  });

  test("monitorCloudFormationStack is ignored for unknown eventName", async () => {
    stackJanitorStatus.event.detail.eventName = "BumpStack";
    const indexOutput = index(stackJanitorStatus);
    expect(indexOutput).toEqual("ignore");
  });

  test("monitorCloudFormationStack should be successful for: UpdateStack", async () => {
    stackJanitorStatus.event.detail.eventName = "UpdateStack";
    const indexOutput = await index(stackJanitorStatus);
    expect(indexOutput).toEqual("success");
  });

  test("monitorCloudFormationStack should be successful for: DeleteStack", async () => {
    stackJanitorStatus.event.detail.eventName = "DeleteStack";
    const indexOutput = await index(stackJanitorStatus);
    expect(indexOutput).toEqual("success");
  });
});
