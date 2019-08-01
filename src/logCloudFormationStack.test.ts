// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
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

    const describeStacks = jest.fn();

    getStackTags(sample_event, describeStacks).catch(e => {
      expect(e).toThrowError();
    });
  });

  test("getStackTags should return stackTags with correct inputs", () => {
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
          stackName: "test"
        }
      }
    };

    const params = {
      StackName: "test"
    };

    const data = {
      Stacks: [
        {
          StackName: "test",
          Tags: [
            {
              stackjanitor: "enabled"
            }
          ]
        }
      ]
    };

    const describeStacks = jest.fn(cb => cb(params, data));

    getStackTags(sample_event, describeStacks).then(tags => {
      console.log(tags);
      expect(tags).toEqual(data.Stacks[0].Tags);
    });
  });
});
