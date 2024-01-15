import {
  getTagsFromStacks,
  getStackJanitorStatus,
  index,
} from "./logCloudFormationStack";

import * as mcfs from "./monitorCloudFormationStack";
import * as sinon from "sinon";
import { mockClient } from "aws-sdk-client-mock";
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";

jest.useFakeTimers();
jest.mock("./monitorCloudFormationStack");

const textStub = sinon.stub(mcfs, "handleDataItem");
textStub.resolves();

describe("logCloudFormationStack:getTagsFromStacks", () => {
  test("it should return tags from Stack[]", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `stackjanitor`,
            Value: "enabled",
          },
        ],
      },
    ];

    const tags = getTagsFromStacks(Stacks);
    expect(tags).toStrictEqual([
      {
        Key: "stackjanitor",
        Value: "enabled",
      },
    ]);
  });

  test("it should return tags from Stack[] for multiple Stack", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `stackjanitor`,
            Value: "enabled",
          },
        ],
      },

      {
        StackName: "Test-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `v1`,
            Value: "1.0.5",
          },
        ],
      },
    ];

    const tags = getTagsFromStacks(Stacks);
    expect(tags.sort()).toEqual([
      { Key: "v1", Value: "1.0.5" },
      { Key: "stackjanitor", Value: "enabled" },
    ]);
  });

  test("it should return tags from Stack[] for multiple Tags", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `stackjanitor`,
            Value: "enabled",
          },
          {
            Key: `v1`,
            Value: "1.0.5",
          },
        ],
      },
    ];

    const tags = getTagsFromStacks(Stacks);
    expect(tags.sort()).toEqual([
      { Key: "stackjanitor", Value: "enabled" },
      { Key: "v1", Value: "1.0.5" },
    ]);
  });

  test("it should return empty tags from Stack[] for no Tags", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [],
      },
    ];

    const tags = getTagsFromStacks(Stacks);
    expect(tags).toEqual([]);
  });
});

describe("logCloudFormationStack:getStackJanitorStatus", () => {
  test("it should return stackjanitor tag from Stack[]", async () => {
    const Tags = [
      {
        key: `stackjanitor`,
        value: "enabled",
      },
      {
        key: `test`,
        value: "disabled",
      },
    ];

    const Status = getStackJanitorStatus(Tags);
    expect(Status).toEqual("enabled");
  });

  test("it should return stackjanitor tag from Stack[]", async () => {
    const Tags = [
      {
        Key: `stackjanitor`,
        Value: "disabled",
      },
      {
        Key: `test`,
        Value: "disabled",
      },
    ];

    const Status = getStackJanitorStatus(Tags);
    expect(Status).toEqual("disabled");
  });

  test("it should return stackjanitor tag from Stack[]", async () => {
    const Tags = [
      {
        Key: `v1`,
        Value: "1.0.5",
      },
    ];

    const Status = getStackJanitorStatus(Tags);
    expect(Status).toEqual("disabled");
  });
});

describe("logCloudFormationStack", () => {
  test("it should return stackjanitor tag value", async () => {
    const sample_event = {
      id: "71e8ce4c-d880-c5b9-f14d-672607e28830",
      source: "aws.cloudformation",
      detail: {
        eventVersion: "1.05",
        userIdentity: {
          type: "AssumedRole",
          sessionContext: {
            sessionIssuer: {
              userName: "development-deployer",
            },
          },
        },
        eventName: "UpdateStack",
        requestParameters: {
          parameters: null,
          stackName: "stackjanitor",
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:12345:stack/test/36ad7930-b8c4-11e9-aadd-0ae3f52010f8",
        },
      },
    };

    const cfMock = mockClient(CloudFormationClient);
    cfMock.on(DescribeStacksCommand).resolves({
      Stacks: [
        {
          StackName: "StackJanitor-dev",
          CreationTime: new Date(),
          StackStatus: "CREATE_COMPLETE",
          Tags: [
            {
              Key: `stackjanitor`,
              Value: "enabled",
            },
            {
              Key: `v1`,
              Value: "1.0.5",
            },
          ],
        },
      ],
    });

    const logStackOutput = await index(sample_event);

    expect(logStackOutput).toHaveProperty("results");
    expect(logStackOutput.results).toStrictEqual({
      stackjanitor: "enabled",
    });
    expect(logStackOutput).toHaveProperty("event");
  });
});
