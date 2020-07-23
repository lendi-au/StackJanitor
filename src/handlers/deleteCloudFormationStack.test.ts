import { index } from "./deleteCloudFormationStack";
import { logger } from "../logger";
import { deleteStack } from "../cloudformation";

describe("deleteCloudFormationStack", () => {
  beforeEach(() => {
    (<any>deleteStack) = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });
  test("it should invoke cloudformation delete for remove event", async () => {
    const dynamoDBStreamEvent: any = {
      Records: [
        {
          eventID: "89a6db8b5fa9b0df5b67e2a6fd24cb76",
          eventName: "REMOVE",
          dynamodb: {
            Keys: {
              stackId: {
                S:
                  "arn:aws:cloudformation:ap-southeast-2:account-id:stack/stack-name/id"
              },
              stackName: {
                S: "stackname"
              }
            },
            OldImage: {
              expirationTime: {
                N: "1596090125"
              },
              stackId: {
                S:
                  "arn:aws:cloudformation:ap-southeast-2:account-id:stack/stack-name/id"
              },
              stackName: {
                S: "stackname"
              },
              tags: {
                S:
                  '[{"value":"your-app-name","key":"APP_NAME"},{"value":"4018","key":"BUILD_NUMBER"},{"value":"enabled","key":"stackjanitor"}]'
              }
            },
            StreamViewType: "NEW_AND_OLD_IMAGES"
          }
        }
      ],
      v: 1
    };

    await index(dynamoDBStreamEvent);
    expect(deleteStack).toHaveBeenNthCalledWith(1, "stackname");
  });
});
