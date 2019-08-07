import { checkExpirationTime, index } from "./monitorCloudFormationStack";
import config from "./config";

describe("monitorCloudFormationStack:checkExpirationTime", () => {
  test("checkExpirationTime should return true if EXPIRATION_TIME > current epoch seconds", () => {
    const SECONDS_IN_AN_HOUR = 60 * 60;
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const ExpirationTime =
      secondsSinceEpoch + config.DEFAULT_EXPIRATION_HOURS * SECONDS_IN_AN_HOUR;
    expect(checkExpirationTime(ExpirationTime)).toEqual(true);
  });

  test("checkExpirationTime should return false if EXPIRATION_TIME = current epoch seconds", () => {
    const ExpirationTime = Math.round(Date.now() / 1000);
    expect(checkExpirationTime(ExpirationTime)).toEqual(false);
  });

  test("checkExpirationTime should return false if EXPIRATION_TIME < current epoch seconds", () => {
    const ExpirationTime = Math.round(Date.now() / 1000) - 1000;
    expect(checkExpirationTime(ExpirationTime)).toEqual(false);
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
