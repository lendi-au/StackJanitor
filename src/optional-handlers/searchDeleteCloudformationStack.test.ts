import {
  describeAllStacks,
  returnStackStatus,
  returnStackTags,
  isStackExpired,
  getStackName,
  deleteStack
} from "./searchDeleteCloudformationStack";

import * as sinon from "sinon";
import {
  CloudFormation,
  DescribeStacksOutput,
  Stack
} from "@aws-sdk/client-cloudformation";
import { mockClient } from "aws-sdk-client-mock";

const cfMock = mockClient(CloudFormation);
beforeEach(() => {
  cfMock.reset();
});

describe("describeAllStacks", () => {
  afterEach(() => {
    sinon.restore();
  });

  test("should test stub is working", async () => {
    const result: Stack[] = [];
    const mockResolves: DescribeStacksOutput = {};
    cfMock.resolves(mockResolves);
    const mystacks = await describeAllStacks();
    expect(mystacks).toEqual(result);
  });

  test("should run the mocks with sinon", async () => {
    const cfnMock = sinon.stub();
    cfnMock.resolves([]);

    const now = new Date();
    const first_output: DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test1",
          CreationTime: now,
          StackStatus: "CREATE_COMPLETE"
        }
      ],
      NextToken: "str1"
    };
    const second_output: DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test2",
          CreationTime: now,
          StackStatus: "UPDATE_COMPLETE"
        }
      ],
      NextToken: "str2"
    };
    const thrid_output: DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test3",
          CreationTime: now,
          StackStatus: "ROLLBACK_COMPLETE"
        }
      ]
    };

    let expected: Stack[] = [];
    expected = expected.concat(first_output.Stacks as Stack[]);
    expected = expected.concat(second_output.Stacks as Stack[]);
    expected = expected.concat(thrid_output.Stacks as Stack[]);

    cfnMock.onCall(0).resolves(first_output);
    cfnMock.onCall(1).resolves(second_output);
    cfnMock.onCall(2).resolves(thrid_output);
    const result = await describeAllStacks();
    expect(result).toEqual(expected);
  });

  test("it should run the mocks with matching params", async () => {
    const cfnMock = sinon.stub();
    AWSMock.mock("CloudFormation", "describeStacks", cfnMock);
    cfnMock.resolves();

    const creationtime = new Date();
    const first_output: CloudFormation.DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test1",
          CreationTime: creationtime,
          StackStatus: "CREATE_COMPLETE"
        }
      ],
      NextToken: "str1"
    };
    const second_output: CloudFormation.DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test2",
          CreationTime: creationtime,
          StackStatus: "UPDATE_COMPLETE"
        }
      ],
      NextToken: "str2"
    };
    const thrid_output: CloudFormation.DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test3",
          CreationTime: creationtime,
          StackStatus: "ROLLBACK_COMPLETE"
        }
      ]
    };
    const first_Args: AWS.CloudFormation.DescribeStacksInput = {
      NextToken: undefined
    };
    const second_Args: AWS.CloudFormation.DescribeStacksInput = {
      NextToken: first_output.NextToken
    };
    const third_Args: AWS.CloudFormation.DescribeStacksInput = {
      NextToken: second_output.NextToken
    };

    cfnMock.withArgs(first_Args).resolves(first_output);
    cfnMock.withArgs(second_Args).resolves(second_output);
    cfnMock.withArgs(third_Args).resolves(thrid_output);

    let expected: AWS.CloudFormation.Stacks = [];
    expected = expected.concat(first_output.Stacks);
    expected = expected.concat(second_output.Stacks);
    expected = expected.concat(thrid_output.Stacks);

    const allStacks = await describeAllStacks();
    expect(allStacks).toEqual(expected);
  });
});

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
