jest.mock("aws-sdk");
import { getStackNamesFromStreamEvent } from "./deleteCloudFormationStack";
import { DynamoDBStreamEvent } from "aws-lambda";

describe("deleteCloudFormationStack:getStackNamesFromStreamEvent", () => {
  test("deleteCloudFormationStack should return stackName for single Key", () => {
    const dynamoDBStreamEvent: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "REMOVE",
          dynamodb: {
            Keys: {
              stackName: {
                S: "test"
              }
            }
          }
        }
      ]
    };

    expect(getStackNamesFromStreamEvent(dynamoDBStreamEvent)).toEqual(["test"]);
  });

  test("deleteCloudFormationStack should return stackName for multiple Keys", () => {
    const dynamoDBStreamEvent: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "REMOVE",
          dynamodb: {
            Keys: {
              stackName: {
                S: "test1"
              }
            }
          }
        },
        {
          eventName: "REMOVE",
          dynamodb: {
            Keys: {
              stackName: {
                S: "test2"
              }
            }
          }
        }
      ]
    };

    expect(getStackNamesFromStreamEvent(dynamoDBStreamEvent)).toEqual([
      "test1",
      "test2"
    ]);
  });

  test("deleteCloudFormationStack should return [] for non-REMOVE events", () => {
    const dynamoDBStreamEvent: DynamoDBStreamEvent = {
      Records: [
        {
          eventName: "INSERT",
          dynamodb: {
            Keys: {
              stackName: {
                S: "test"
              }
            }
          }
        }
      ]
    };

    expect(getStackNamesFromStreamEvent(dynamoDBStreamEvent)).toEqual([]);
  });
});
