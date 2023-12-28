import { describeAllStacks } from "./describeAllStacks";

import {
  DescribeStacksOutput,
  Stack,
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { mockClient } from "aws-sdk-client-mock";

describe("describeAllStacks", () => {
  const cfMock = mockClient(CloudFormationClient);
  beforeEach(() => {
    cfMock.reset();
  });

  test("describe is working with empty stacks", async () => {
    const result: Stack[] = [];
    const mockResolves: DescribeStacksOutput = {};
    cfMock.on(DescribeStacksCommand).resolves(mockResolves);
    const mystacks = await describeAllStacks();
    expect(mystacks).toEqual(result);
  });

  test("describe is working with single large result", async () => {
    const now = new Date();
    const output: DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test1",
          CreationTime: now,
          StackStatus: "CREATE_COMPLETE",
        },
        {
          StackName: "test2",
          CreationTime: now,
          StackStatus: "UPDATE_COMPLETE",
        },
        {
          StackName: "test3",
          CreationTime: now,
          StackStatus: "ROLLBACK_COMPLETE",
        },
      ],
    };

    let expected: Stack[] = [];
    expected = expected.concat(output.Stacks as Stack[]);

    cfMock.on(DescribeStacksCommand).resolves(output);

    const result = await describeAllStacks();
    expect(result).toEqual(expected);
  });

  test("describe is working with multiple stacks and NextToken", async () => {
    const now = new Date();
    const first_output: DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test1",
          CreationTime: now,
          StackStatus: "CREATE_COMPLETE",
        },
      ],
      NextToken: "str1",
    };
    const second_output: DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test2",
          CreationTime: now,
          StackStatus: "UPDATE_COMPLETE",
        },
      ],
      NextToken: "str2",
    };
    const third_output: DescribeStacksOutput = {
      Stacks: [
        {
          StackName: "test3",
          CreationTime: now,
          StackStatus: "ROLLBACK_COMPLETE",
        },
      ],
    };

    let expected: Stack[] = [];
    expected = expected.concat(first_output.Stacks as Stack[]);
    expected = expected.concat(second_output.Stacks as Stack[]);
    expected = expected.concat(third_output.Stacks as Stack[]);

    cfMock.on(DescribeStacksCommand).resolves(first_output);
    cfMock
      .on(DescribeStacksCommand, { NextToken: "str1" })
      .resolves(second_output);
    cfMock
      .on(DescribeStacksCommand, { NextToken: "str2" })
      .resolves(third_output);

    const result = await describeAllStacks();
    expect(result).toEqual(expected);
  });
});
