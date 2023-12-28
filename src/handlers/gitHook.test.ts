import {
  bitBucketEventHandler,
  bitbucketEventParser,
  isBitbucketEvent,
  isInDesiredState,
} from "./gitHook";
import * as helpers from "../helpers";
jest.mock("../helpers");

beforeEach(() => {
  jest.resetAllMocks();
});

const bitbucketEvent = {
  pullrequest: {
    type: "pullrequest",
    source: {
      repository: {
        type: "repository",
        name: "test-repo",
        full_name: "lendi-dev/test-repo",
      },
      branch: {
        name: "feature/FUNNEL-1525-1",
      },
    },
    state: "DECLINED",
    reason: "TEST",
  },
  repository: {
    full_name: "lendi-dev/test-repo",
    type: "repository",
    name: "test-repo",
  },
};

describe("isInDesiredState", () => {
  test("it should return true for Merged State", () => {
    const state = "MERGED";
    expect(isInDesiredState(state)).toEqual(true);
  });
  test("it should return true for Declined State", () => {
    const state = "DECLINED";
    expect(isInDesiredState(state)).toEqual(true);
  });
  test("it should return false for Created State", () => {
    const state = "CREATED";
    expect(isInDesiredState(state)).toEqual(false);
  });
});

describe("bitbucketEventParser", () => {
  test("it should return true for Merged State", () => {
    const bitBucketEventData = {
      pullrequest: {
        destination: {
          repository: {
            name: "test-webhook",
            full_name: "khaledquadir/test-webhook",
          },
          branch: {
            name: "master",
          },
        },
        source: {
          repository: {
            name: "test-webhook",
            full_name: "khaledquadir/test-webhook",
          },
          branch: {
            name: "test-hook-12",
          },
        },
        state: "MERGED",
      },
      repository: {
        name: "test-webhook",
      },
    };
    expect(bitbucketEventParser(bitBucketEventData)).toEqual({
      repository: "test-webhook",
      branch: "test-hook-12",
    });
  });
});

describe("isBitbucketEvent", () => {
  test("it should return true bitbucket event", () => {
    const bitBucketEventData = {
      pullrequest: {},
      repository: {},
    };
    expect(isBitbucketEvent(bitBucketEventData)).toEqual(true);
  });
});

describe("bitBucketEventHandler", () => {
  test("it should return success response for bitbucket merged PR", () => {
    const bitBucketEventData = {
      pullrequest: {
        destination: {
          repository: {
            name: "test-webhook",
            full_name: "khaledquadir/test-webhook",
          },
          branch: {
            name: "master",
          },
        },
        source: {
          repository: {
            name: "test-webhook",
            full_name: "khaledquadir/test-webhook",
          },
          branch: {
            name: "test-hook-12",
          },
        },
        state: "MERGED",
      },
      repository: {
        name: "test-webhook",
      },
    };

    const spy = jest.spyOn(helpers, "findStacksFromTag");
    spy.mockResolvedValue([
      {
        stackName: "CloudJanitorTestV1",
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTestV1/f79269a0",
      },
    ]);

    expect(bitBucketEventHandler(bitBucketEventData)).toEqual(
      Promise.resolve({}),
    );
  });

  test("should delete stack for bitbucket webhook call", async () => {
    const deleteDynamoRow = jest.spyOn(helpers, "deleteDynamoRow");

    jest.spyOn(helpers, "findStacksFromTag").mockResolvedValue([
      {
        stackName: "stackname",
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTestV1/f79269a0",
      },
    ]);

    await bitBucketEventHandler(bitbucketEvent);

    expect(deleteDynamoRow).toHaveBeenNthCalledWith(1, {
      stackId:
        "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTestV1/f79269a0",
      stackName: "stackname",
    });
  });
});
