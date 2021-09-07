import {
  returnStackStatus,
  returnStackTags,
  isStackExpired,
  getStackName,
  deleteStack
} from "./searchDeleteCloudformationStack";

import * as AWSMock from "aws-sdk-mock";
import * as sinon from "sinon";
import * as AWS from "aws-sdk";

AWSMock.setSDKInstance(AWS);

describe("returnStackStatus", () => {
  test("it should return a correct stack list with desired stack status", async () => {
    const creationtime = new Date();
    const stacks = [
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test1/2b549de0-0bb3-11ec-9a21-0aa93ce2a038",
        StackName: "test1",
        CreationTime: creationtime,
        StackStatus: "CREATE_COMPLETE"
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test3/b26fc5b0-0961-11ec-9a95-06c05975dd5c",
        StackName: "test3",
        CreationTime: creationtime,
        StackStatus: "UPDATE_COMPLETE"
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test2/8612c450-0960-11ec-a547-0268dfce7816",
        StackName: "test2",
        CreationTime: creationtime,
        StackStatus: "ROLLBACK_COMPLETE"
      },
      {
        StackName: "test5",
        CreationTime: creationtime,
        StackStatus: "DELETE_COMPLETE"
      }
    ];
    const myStacks = await returnStackStatus(stacks);
    expect(myStacks).toStrictEqual([
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test1/2b549de0-0bb3-11ec-9a21-0aa93ce2a038",
        StackName: "test1",
        CreationTime: creationtime,
        StackStatus: "CREATE_COMPLETE"
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test3/b26fc5b0-0961-11ec-9a95-06c05975dd5c",
        StackName: "test3",
        CreationTime: creationtime,
        StackStatus: "UPDATE_COMPLETE"
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test2/8612c450-0960-11ec-a547-0268dfce7816",
        StackName: "test2",
        CreationTime: creationtime,
        StackStatus: "ROLLBACK_COMPLETE"
      }
    ]);
  });
});

describe("returnStackTags", () => {
  test("it should return a correct stack list with the tag 'stackjanitor' enabled ", async () => {
    const creationtime = new Date();
    const stacks = [
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test1/2b549de0-0bb3-11ec-9a21-0aa93ce2a038",
        StackName: "test1",
        CreationTime: creationtime,
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled"
          }
        ]
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
            Value: "disabled"
          }
        ]
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test2/8612c450-0960-11ec-a547-0268dfce7816",
        StackName: "test2",
        CreationTime: creationtime,
        StackStatus: "ROLLBACK_COMPLETE"
      }
    ];
    const myStacks = await returnStackTags(stacks);
    expect(myStacks).toStrictEqual([
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test1/2b549de0-0bb3-11ec-9a21-0aa93ce2a038",
        StackName: "test1",
        CreationTime: creationtime,
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled"
          }
        ]
      }
    ]);
  });
});

describe("isStackExpired", () => {
  test("it should return a correct stack list with creation/update time is older than 7 days", async () => {
    const lastupdatedtime = new Date("2021-08-25T07:12:55");
    const creationtime = new Date("2021-08-25T04:12:55");
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
            Value: "enabled"
          }
        ]
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
            Value: "enabled"
          }
        ]
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
            Value: "enabled"
          }
        ]
      }
    ];
    const myStacks = await isStackExpired(stacks);
    expect(myStacks).toStrictEqual([
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
            Value: "enabled"
          }
        ]
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
            Value: "enabled"
          }
        ]
      }
    ]);
  });
});

describe("getStackName", () => {
  test("it should return a correct stack name list", async () => {
    const stacks = [
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test1/2b549de0-0bb3-11ec-9a21-0aa93ce2a038",
        StackName: "test1",
        CreationTime: new Date("2021-08-25T04:12:55"),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled"
          }
        ]
      },
      {
        StackId:
          "arn:aws:cloudformation:ap-southeast-2:019550661163:stack/test3/b26fc5b0-0961-11ec-9a95-06c05975dd5c",
        StackName: "test3",
        CreationTime: new Date("2021-08-24T04:12:55"),
        StackStatus: "UPDATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled"
          }
        ]
      }
    ];
    const myStacks = await getStackName(stacks);
    expect(myStacks).toStrictEqual(["test1", "test3"]);
  });
});

describe("deleteStack", () => {
  test("it should mock deleteStack from Cloudformation", async () => {
    const stub = sinon.stub();
    AWSMock.mock("CloudFormation", "deleteStack", stub);
    stub.resolves();
    const stackNames = ["test1", "test3"];

    stackNames.forEach(async (stackname: string) => {
      await deleteStack(stackname);
    });
    expect(stub.calledTwice).toBeTruthy();
    expect(stub.calledWith({ StackName: stackNames[0] })).toBeTruthy();
    expect(stub.calledWith({ StackName: stackNames[1] })).toBeTruthy();
  });
});
