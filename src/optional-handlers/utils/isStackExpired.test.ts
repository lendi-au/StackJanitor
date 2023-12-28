import { isStackExpired } from "./isStackExpired";

describe("isStackExpired", () => {
  test("it should return a correct stack list with creation/update time is older than 10 days", async () => {
    let lastupdatedtime_num = new Date().getTime() / 1000 - 5 * 24 * 60 * 60;
    let creationtime_num = new Date().getTime() / 1000 - 11 * 24 * 60 * 60;
    let creationtime = new Date(creationtime_num * 1000);
    let lastupdatedtime = new Date(lastupdatedtime_num * 1000);

    const stacks = [
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test1/2b549de0-0bb3-11ec-9a21-0aa93ce2a038",
        StackName: "test1",
        CreationTime: creationtime,
        LastUpdatedTime: lastupdatedtime,
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled",
          },
        ],
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test3/b26fc5b0-0961-11ec-9a95-06c05975dd5c",
        StackName: "test3",
        CreationTime: creationtime,
        StackStatus: "UPDATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled",
          },
        ],
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test2/8612c450-0960-11ec-a547-0268dfce7816",
        StackName: "test2",
        CreationTime: new Date(),
        StackStatus: "ROLLBACK_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled",
          },
        ],
      },
    ];
    const myStacks = isStackExpired(stacks);
    expect(myStacks).toStrictEqual([
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test3/b26fc5b0-0961-11ec-9a95-06c05975dd5c",
        StackName: "test3",
        CreationTime: creationtime,
        StackStatus: "UPDATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled",
          },
        ],
      },
    ]);
  });
});
