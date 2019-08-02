import {
  getTagsFromStacks,
  getStackJanitorStatus,
  index
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
        }
      }
    };

    const stackJanitorStatus = await index(sample_event, null);
    expect(stackJanitorStatus).toStrictEqual({
      results: { stackjanitor: "enabled" }
    });
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

    const stackJanitorStatus = await index(sample_event, null);
    expect(stackJanitorStatus).toStrictEqual({
      results: { stackjanitor: "disabled" }
    });
  });
});
