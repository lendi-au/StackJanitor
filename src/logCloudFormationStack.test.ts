import {
  getTagsFromStacks,
  getStackJanitorStatus,
  index,
  getStackJanitorStatusForCreateStack
} from "./logCloudFormationStack";

describe("logCloudFormationStack:getTagsFromStacks", () => {
  test("getTagsFromStacks should return tags from Stack[]", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `stackjanitor`,
            Value: "enabled"
          }
        ]
      }
    ];

    const tags = await getTagsFromStacks(Stacks);
    expect(tags).toStrictEqual([
      {
        Key: "stackjanitor",
        Value: "enabled"
      }
    ]);
  });

  test("getTagsFromStacks should return tags from Stack[] for multiple Stack", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `stackjanitor`,
            Value: "enabled"
          }
        ]
      },

      {
        StackName: "Test-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `v1`,
            Value: "1.0.5"
          }
        ]
      }
    ];

    const tags = await getTagsFromStacks(Stacks);
    expect(tags.sort()).toEqual([
      { Key: "v1", Value: "1.0.5" },
      { Key: "stackjanitor", Value: "enabled" }
    ]);
  });

  test("getTagsFromStacks should return tags from Stack[] for multiple Tags", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: `stackjanitor`,
            Value: "enabled"
          },
          {
            Key: `v1`,
            Value: "1.0.5"
          }
        ]
      }
    ];

    const tags = await getTagsFromStacks(Stacks);
    expect(tags.sort()).toEqual([
      { Key: "stackjanitor", Value: "enabled" },
      { Key: "v1", Value: "1.0.5" }
    ]);
  });

  test("getTagsFromStacks should return empty tags from Stack[] for no Tags", async () => {
    const Stacks = [
      {
        StackName: "StackJanitor-dev",
        CreationTime: new Date(),
        StackStatus: "CREATE_COMPLETE",
        Tags: []
      }
    ];

    const tags = await getTagsFromStacks(Stacks);
    expect(tags).toEqual([]);
  });
});

describe("logCloudFormationStack:getStackJanitorStatus", () => {
  test("getStackJanitorStatus should return stackjanitor tag from Stack[]", async () => {
    const Tags = [
      {
        Key: `stackjanitor`,
        Value: "enabled"
      },
      {
        Key: `test`,
        Value: "disabled"
      }
    ];

    const Status = await getStackJanitorStatus(Tags);
    expect(Status).toEqual("enabled");
  });

  test("getStackJanitorStatus should return stackjanitor tag from Stack[]", async () => {
    const Tags = [
      {
        Key: `stackjanitor`,
        Value: "disabled"
      },
      {
        Key: `test`,
        Value: "disabled"
      }
    ];

    const Status = await getStackJanitorStatus(Tags);
    expect(Status).toEqual("disabled");
  });

  test("getStackJanitorStatus should return stackjanitor tag from Stack[]", async () => {
    const Tags = [
      {
        Key: `v1`,
        Value: "1.0.5"
      }
    ];

    const Status = await getStackJanitorStatus(Tags);
    expect(Status).toEqual("disabled");
  });

  test("getStackJanitorStatus should return stackjanitor tag for CreateStack event", async () => {
    const Tags = [
      {
        key: `stackjanitor`,
        value: "enabled"
      },
      {
        key: `test`,
        value: "disabled"
      }
    ];

    const Status = await getStackJanitorStatus(Tags);
    expect(Status).toEqual("enabled");
  });
});

describe("logCloudFormationStack:index", () => {
  test("index should return stackjanitor tag value", async () => {
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
          stackName: "stackjanitor"
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:702880128631:stack/test/36ad7930-b8c4-11e9-aadd-0ae3f52010f8"
        }
      }
    };

    const logStackOutput = await index(sample_event, null);

    expect(logStackOutput).toHaveProperty("results");
    expect(logStackOutput.results).toStrictEqual({
      stackjanitor: "enabled"
    });
    expect(logStackOutput).toHaveProperty("event");
  });

  test("index should return array of Tag", async () => {
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

    const logStackOutput = await index(sample_event, null);
    expect(logStackOutput).toHaveProperty("results");
    expect(logStackOutput.results).toStrictEqual({
      stackjanitor: "disabled"
    });
    expect(logStackOutput).toHaveProperty("event");
  });
});

describe("logCloudFormationStack:getStackJanitorStatusForCreateStack", () => {
  test("it should return response with stackjanitor enabled if enabled", async () => {
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
        eventName: "CreateStack",
        requestParameters: {
          tags: [
            {
              value: "enabled",
              key: "stackjanitor"
            },
            {
              value: "4",
              key: "v1"
            },
            {
              value: "platform",
              key: "LENDI_TEAM"
            },
            {
              value: "lendi-platform-team",
              key: "REPOSITORY"
            },
            {
              value: "feat/add-lambda-function-guardduty-trigger",
              key: "BRANCH"
            }
          ],
          stackName: "CloudJanitorTestV1"
        }
      }
    };

    const status = getStackJanitorStatusForCreateStack(sample_event);

    expect(status).toHaveProperty("results");
    expect(status.results.stackjanitor).toEqual("enabled");
  });
});
