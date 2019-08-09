import { getExirationTime, index } from "./monitorCloudFormationStack";

describe("monitorCloudFormationStack:getExirationTime", () => {
  test("getExirationTime should return correct expired EPOCH", () => {
    const eventTime = "2019-08-08T00:22:00Z";
    const expectedExpirationEpoch = 1565828520;

    expect(getExirationTime(eventTime)).toEqual(expectedExpirationEpoch);
  });
});

describe("monitorCloudFormationStack:index", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const stackJanitorStatus = {
    event: {
      id: "8883c8f7-c987-7ab0-5a50-ab4ef26d26e9",
      detail: {
        eventName: "UpdateStack",
        eventTime: "2019-08-09T00:44:55Z",
        userIdentity: {
          type: "AssumedRole",
          sessionContext: {
            sessionIssuer: {
              userName: "development-poweruser"
            }
          }
        },
        requestParameters: {
          stackName:
            "webhook-delivery-classification-worker-COR-443-development"
        },
        responseElements: {
          stackId: "123"
        }
      }
    },
    results: {
      stackjanitor: "enabled"
    }
  };

  test("monitorCloudFormationStack should be successful for: CreateStack", async () => {
    stackJanitorStatus.event.detail.eventName = "CreateStack";
    const indexOutput = await index(stackJanitorStatus);
    expect(indexOutput).toEqual("success");
  });

  test("monitorCloudFormationStack is ignored for unknown eventName", async () => {
    stackJanitorStatus.event.detail.eventName = "BumpStack";
    const indexOutput = await index(stackJanitorStatus);
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
