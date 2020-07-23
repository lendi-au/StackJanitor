import {
  bitBucketEventHandler,
  bitbucketEventParser,
  isBitbucketEvent,
  isInDesiredState
} from "./gitHook";
import * as helpers from "../helpers";

const bitbucketEvent = {
  pullrequest: {
    rendered: {
      reason: {
        raw: "TEST",
        markup: "markdown",
        html: "<p>TEST</p>",
        type: "rendered"
      },
      description: {
        raw: "",
        markup: "markdown",
        html: "",
        type: "rendered"
      },
      title: {
        raw:
          "Dont approve - just -test - check why CFN not deleting on PR merge / decline",
        markup: "markdown",
        html:
          "<p>Dont approve - just -test - check why CFN not deleting on PR merge / decline</p>",
        type: "rendered"
      }
    },
    type: "pullrequest",
    description: "",
    links: {
      decline: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235/decline"
      },
      diffstat: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/diffstat/lendi-dev/applicants-service:d3e2c9364052%0D6ba4e4405b71?from_pullrequest_id=235"
      },
      commits: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235/commits"
      },
      self: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235"
      },
      comments: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235/comments"
      },
      merge: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235/merge"
      },
      html: {
        href:
          "https://bitbucket.org/lendi-dev/applicants-service/pull-requests/235"
      },
      activity: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235/activity"
      },
      diff: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/diff/lendi-dev/applicants-service:d3e2c9364052%0D6ba4e4405b71?from_pullrequest_id=235"
      },
      approve: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235/approve"
      },
      statuses: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/pullrequests/235/statuses"
      }
    },
    title:
      "Dont approve - just -test - check why CFN not deleting on PR merge / decline",
    close_source_branch: false,
    reviewers: [
      {
        display_name: "Core Team Automations",
        account_id: "5d2d2b03f3471e0c800c5261",
        links: {
          self: {
            href:
              "https://api.bitbucket.org/2.0/users/%7B14d48643-30c8-408d-bd04-677d72bbe17b%7D"
          },
          html: {
            href:
              "https://bitbucket.org/%7B14d48643-30c8-408d-bd04-677d72bbe17b%7D/"
          },
          avatar: {
            href:
              "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5d2d2b03f3471e0c800c5261/c6485e14-e1ca-4f72-9087-0e8055eab1d9/128"
          }
        },
        nickname: "Core Team Automations",
        type: "user",
        uuid: "{14d48643-30c8-408d-bd04-677d72bbe17b}"
      }
    ],
    id: 235,
    destination: {
      commit: {
        hash: "6ba4e4405b71",
        type: "commit",
        links: {
          self: {
            href:
              "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/commit/6ba4e4405b71"
          },
          html: {
            href:
              "https://bitbucket.org/lendi-dev/applicants-service/commits/6ba4e4405b71"
          }
        }
      },
      repository: {
        links: {
          self: {
            href:
              "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service"
          },
          html: {
            href: "https://bitbucket.org/lendi-dev/applicants-service"
          },
          avatar: {
            href:
              "https://bytebucket.org/ravatar/%7B17a53358-1677-4a1e-a635-b4c55e2202ed%7D?ts=2308598"
          }
        },
        type: "repository",
        name: "applicants-service",
        full_name: "lendi-dev/applicants-service",
        uuid: "{17a53358-1677-4a1e-a635-b4c55e2202ed}"
      },
      branch: {
        name: "develop"
      }
    },
    created_on: "2020-07-17T00:52:30.697121+00:00",
    summary: {
      raw: "",
      markup: "markdown",
      html: "",
      type: "rendered"
    },
    source: {
      commit: {
        hash: "d3e2c9364052",
        type: "commit",
        links: {
          self: {
            href:
              "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service/commit/d3e2c9364052"
          },
          html: {
            href:
              "https://bitbucket.org/lendi-dev/applicants-service/commits/d3e2c9364052"
          }
        }
      },
      repository: {
        links: {
          self: {
            href:
              "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service"
          },
          html: {
            href: "https://bitbucket.org/lendi-dev/applicants-service"
          },
          avatar: {
            href:
              "https://bytebucket.org/ravatar/%7B17a53358-1677-4a1e-a635-b4c55e2202ed%7D?ts=2308598"
          }
        },
        type: "repository",
        name: "applicants-service",
        full_name: "lendi-dev/applicants-service",
        uuid: "{17a53358-1677-4a1e-a635-b4c55e2202ed}"
      },
      branch: {
        name: "feature/FUNNEL-1525-1"
      }
    },
    comment_count: 1,
    state: "DECLINED",
    task_count: 0,
    participants: [
      {
        role: "REVIEWER",
        participated_on: "2020-07-17T00:55:13.260119+00:00",
        type: "participant",
        user: {
          display_name: "Core Team Automations",
          account_id: "5d2d2b03f3471e0c800c5261",
          links: {
            self: {
              href:
                "https://api.bitbucket.org/2.0/users/%7B14d48643-30c8-408d-bd04-677d72bbe17b%7D"
            },
            html: {
              href:
                "https://bitbucket.org/%7B14d48643-30c8-408d-bd04-677d72bbe17b%7D/"
            },
            avatar: {
              href:
                "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/5d2d2b03f3471e0c800c5261/c6485e14-e1ca-4f72-9087-0e8055eab1d9/128"
            }
          },
          nickname: "Core Team Automations",
          type: "user",
          uuid: "{14d48643-30c8-408d-bd04-677d72bbe17b}"
        },
        approved: false
      }
    ],
    reason: "TEST",
    updated_on: "2020-07-17T00:57:48.920374+00:00",
    author: {
      display_name: "Khaled Quadir",
      account_id: "5d0c2ecbfab9db0c579811d4",
      links: {
        self: {
          href:
            "https://api.bitbucket.org/2.0/users/%7Bf1f881fc-73b0-414e-9480-7764e2e69ae5%7D"
        },
        html: {
          href:
            "https://bitbucket.org/%7Bf1f881fc-73b0-414e-9480-7764e2e69ae5%7D/"
        },
        avatar: {
          href:
            "https://secure.gravatar.com/avatar/c9a641836cea0c2109e6cdb505008f6d?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FKQ-1.png"
        }
      },
      nickname: "khaled.quadir",
      type: "user",
      uuid: "{f1f881fc-73b0-414e-9480-7764e2e69ae5}"
    },
    merge_commit: null,
    closed_by: {
      display_name: "Khaled Quadir",
      account_id: "5d0c2ecbfab9db0c579811d4",
      links: {
        self: {
          href:
            "https://api.bitbucket.org/2.0/users/%7Bf1f881fc-73b0-414e-9480-7764e2e69ae5%7D"
        },
        html: {
          href:
            "https://bitbucket.org/%7Bf1f881fc-73b0-414e-9480-7764e2e69ae5%7D/"
        },
        avatar: {
          href:
            "https://secure.gravatar.com/avatar/c9a641836cea0c2109e6cdb505008f6d?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FKQ-1.png"
        }
      },
      nickname: "khaled.quadir",
      type: "user",
      uuid: "{f1f881fc-73b0-414e-9480-7764e2e69ae5}"
    }
  },
  repository: {
    scm: "git",
    website: null,
    uuid: "{17a53358-1677-4a1e-a635-b4c55e2202ed}",
    links: {
      self: {
        href:
          "https://api.bitbucket.org/2.0/repositories/lendi-dev/applicants-service"
      },
      html: {
        href: "https://bitbucket.org/lendi-dev/applicants-service"
      },
      avatar: {
        href:
          "https://bytebucket.org/ravatar/%7B17a53358-1677-4a1e-a635-b4c55e2202ed%7D?ts=2308598"
      }
    },
    project: {
      links: {
        self: {
          href:
            "https://api.bitbucket.org/2.0/workspaces/lendi-dev/projects/FUN"
        },
        html: {
          href: "https://bitbucket.org/lendi-dev/workspace/projects/FUN"
        },
        avatar: {
          href:
            "https://bitbucket.org/account/user/lendi-dev/projects/FUN/avatar/32?ts=1553749042"
        }
      },
      type: "project",
      name: "Funnel",
      key: "FUN",
      uuid: "{bd1e11cd-9d43-4e24-86f1-7c70a9bea99c}"
    },
    full_name: "lendi-dev/applicants-service",
    owner: {
      username: "lendi-dev",
      display_name: "Lendi",
      type: "team",
      uuid: "{211000b1-f6b8-4a2b-a714-873aa2d1de40}",
      links: {
        self: {
          href:
            "https://api.bitbucket.org/2.0/teams/%7B211000b1-f6b8-4a2b-a714-873aa2d1de40%7D"
        },
        html: {
          href:
            "https://bitbucket.org/%7B211000b1-f6b8-4a2b-a714-873aa2d1de40%7D/"
        },
        avatar: {
          href: "https://bitbucket.org/account/lendi-dev/avatar/"
        }
      }
    },
    workspace: {
      name: "Lendi",
      type: "workspace",
      uuid: "{211000b1-f6b8-4a2b-a714-873aa2d1de40}",
      links: {
        self: {
          href: "https://api.bitbucket.org/2.0/workspaces/lendi-dev"
        },
        html: {
          href: "https://bitbucket.org/lendi-dev/"
        },
        avatar: {
          href:
            "https://bitbucket.org/workspaces/lendi-dev/avatar/?ts=1543669308"
        }
      },
      slug: "lendi-dev"
    },
    type: "repository",
    is_private: true,
    name: "applicants-service"
  },
  actor: {
    display_name: "Khaled Quadir",
    account_id: "5d0c2ecbfab9db0c579811d4",
    links: {
      self: {
        href:
          "https://api.bitbucket.org/2.0/users/%7Bf1f881fc-73b0-414e-9480-7764e2e69ae5%7D"
      },
      html: {
        href:
          "https://bitbucket.org/%7Bf1f881fc-73b0-414e-9480-7764e2e69ae5%7D/"
      },
      avatar: {
        href:
          "https://secure.gravatar.com/avatar/c9a641836cea0c2109e6cdb505008f6d?d=https%3A%2F%2Favatar-management--avatars.us-west-2.prod.public.atl-paas.net%2Finitials%2FKQ-1.png"
      }
    },
    nickname: "khaled.quadir",
    type: "user",
    uuid: "{f1f881fc-73b0-414e-9480-7764e2e69ae5}"
  }
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

    const spy = jest.spyOn(helpers, "findStacksFromTag");
    spy.mockResolvedValue([
      {
        stackName: "CloudJanitorTestV1",
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTestV1/f79269a0"
      }
    ]);

    expect(bitBucketEventHandler(bitBucketEventData)).toEqual(
      Promise.resolve({})
    );
  });

  test("should delte stack for bitbucket webhook call", async () => {
    const deleteDynamoRow = jest.spyOn(helpers, "deleteDynamoRow");

    jest.spyOn(helpers, "findStacksFromTag").mockResolvedValue([
      {
        stackName: "applicants-api-FUNNEL-1525-1-development",
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:12345:stack/CloudJanitorTestV1/f79269a0"
      }
    ]);

    await bitBucketEventHandler(bitbucketEvent);

    expect(deleteDynamoRow).toHaveBeenNthCalledWith(1, {});
  });
});
