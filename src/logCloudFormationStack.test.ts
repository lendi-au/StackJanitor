import { getStackTags, index } from "./logCloudFormationStack";

describe("logCloudFormationStack", () => {
  test("logCloudFormationStack should be called", () => {
    expect(index(null, null));
  });
});

describe("logCloudFormationStack:getStackTags", () => {
  test("getStackTags should reject if the event does not have stackName", () => {
    const sample_event = {
      id: "71e8ce4c-d880-c5b9-f14d-672607e28830",
      source: "aws.cloudformation",
      detail: {
        eventVersion: "1.05",
        userIdentity: {
          type: "AssumedRole",
          sessionContext: {
            sessionIssuer: {
              userName: "development-deployer"
            }
          }
        },
        eventName: "UpdateStack",
        requestParameters: {
          parameters: null,
          stackName: null
        }
      }
    };

    getStackTags(sample_event).catch(e => {
      expect(e).toThrowError();
    });
  });

  test("getStackTags should return array of Tag", async () => {
    const sample_event = {
      id: "71e8ce4c-d880-c5b9-f14d-672607e28830",
      source: "aws.cloudformation",
      detail: {
        eventVersion: "1.05",
        userIdentity: {
          type: "AssumedRole",
          sessionContext: {
            sessionIssuer: {
              userName: "development-deployer"
            }
          }
        },
        eventName: "UpdateStack",
        requestParameters: {
          parameters: null,
          stackName: "StackJanitor"
        }
      }
    };

    const tags = await getStackTags(sample_event);
    expect(tags).toEqual([{ Key: "StackJanitor", Value: "enabled" }]);
  });
});
