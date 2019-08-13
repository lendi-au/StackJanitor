import { getExpirationTime, index } from "./monitorCloudFormationStack";

describe("monitorCloudFormationStack:getExpirationTime", () => {
  test("getExpirationTime should return correct expired EPOCH", () => {
    const eventTime = "2019-08-09T01:35:55Z";
    const expectedExpirationEpoch = 1565919355;

    expect(getExpirationTime(eventTime)).toEqual(expectedExpirationEpoch);
  });
});

describe("monitorCloudFormationStack:index", () => {
  beforeEach(() => {
    jest.resetModules();
  });

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
            "arn:aws:cloudformation:ap-southeast-2:702880128631:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70"
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
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("success");
  });

  test("monitorCloudFormationStack is ignored for unknown eventName", async () => {
    stackJanitorStatus.event.detail.eventName = "BumpStack";
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("ignore");
  });

  test("monitorCloudFormationStack should be successful for: UpdateStack", async () => {
    stackJanitorStatus.event.detail.eventName = "UpdateStack";
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("success");
  });

  test("monitorCloudFormationStack should be successful for: DeleteStack", async () => {
    stackJanitorStatus.event.detail.eventName = "DeleteStack";
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("success");
  });
});
