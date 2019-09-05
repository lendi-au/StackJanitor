import {
  bitBucketEventHandler,
  bitbucketEventParser,
  isBitbucketEvent,
  isInDesiredState
} from "./gitHook";
import * as helpers from "../helpers";

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
            full_name: "khaledquadir/test-webhook"
          },
          branch: {
            name: "master"
          }
        },
        source: {
          repository: {
            name: "test-webhook",
            full_name: "khaledquadir/test-webhook"
          },
          branch: {
            name: "test-hook-12"
          }
        },
        state: "MERGED"
      },
      repository: {
        name: "test-webhook"
      }
    };
    expect(bitbucketEventParser(bitBucketEventData)).toEqual({
      repository: "test-webhook",
      branch: "test-hook-12"
    });
  });
});

describe("isBitbucketEvent", () => {
  test("it should return true bitbucket event", () => {
    const bitBucketEventData = {
      pullrequest: {},
      repository: {}
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
            full_name: "khaledquadir/test-webhook"
          },
          branch: {
            name: "master"
          }
        },
        source: {
          repository: {
            name: "test-webhook",
            full_name: "khaledquadir/test-webhook"
          },
          branch: {
            name: "test-hook-12"
          }
        },
        state: "MERGED"
      },
      repository: {
        name: "test-webhook"
      }
    };

    const mockDataMapper = {
      create: (arg: any) => Promise.resolve(arg),
      update: (arg: any) => Promise.resolve(arg),
      destroy: (arg: any) => Promise.resolve(arg),
      get: (arg: any) => Promise.resolve(arg)
    };
    const spy = jest.spyOn(helpers, "findStacksFromTag");
    spy.mockResolvedValue([
      {
        stackName: "CloudJanitorTestV1",
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTestV1/f79269a0"
      }
    ]);

    expect(bitBucketEventHandler(bitBucketEventData, mockDataMapper)).toEqual(
      Promise.resolve({})
    );
  });
});
