import {
  deleteItem,
  generateDeleteParams,
  generateInputParams,
  getExpirationTime,
  index,
  putItem,
  updateItem
} from "./monitorCloudFormationStack";
import config from "./config";

describe("monitorCloudFormationStack:generateDeleteParams", () => {
  test("generateDeleteParams should return correct deleteParams for delete eventType", () => {
    const event = {
      detail: {
        userIdentity: {
          userName: "jordan.simonovski"
        },
        eventTime: "2019-07-21T22:41:21Z",
        eventName: "DeleteStack",
        requestParameters: {
          stackName:
            "arn:aws:cloudformation:ap-southeast-2:291089888569:stack/lendi-datadog-log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a"
        },
        responseElements: null
      }
    };
    expect(generateDeleteParams(event)).toStrictEqual({
      Key: {
        stackName: {
          S: "lendi-datadog-log-archive-management"
        },
        stackId: {
          S:
            "arn:aws:cloudformation:ap-southeast-2:291089888569:stack/lendi-datadog-log-archive-management/16921510-a9e8-11e9-a24e-02d286d7265a"
        }
      },
      TableName: config.DEFAULT_DYNAMODB_TABLE
    });
  });

  test("generateDeleteParams should return correct deleteParams for update eventType", () => {
    const event = {
      detail: {
        userIdentity: {
          userName: "jordan.simonovski"
        },
        eventTime: "2019-07-21T22:41:21Z",
        eventName: "UpdateStack",
        requestParameters: {
          stackName: "product-api-latest-development"
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:702880128631:stack/product-api-latest-development/8c0e2370-b9a5-11e9-abf5-02afb887c468"
        }
      }
    };
    expect(generateDeleteParams(event)).toStrictEqual({
      Key: {
        stackName: {
          S: "product-api-latest-development"
        },
        stackId: {
          S:
            "arn:aws:cloudformation:ap-southeast-2:702880128631:stack/product-api-latest-development/8c0e2370-b9a5-11e9-abf5-02afb887c468"
        }
      },
      TableName: config.DEFAULT_DYNAMODB_TABLE
    });
  });
});

describe("monitorCloudFormationStack:getExpirationTime", () => {
  test("getExpirationTime should return correct expired EPOCH", () => {
    const eventTime = "2019-08-09T01:35:55Z";
    const expectedExpirationEpoch = 1565919355;

    expect(getExpirationTime(eventTime)).toEqual(expectedExpirationEpoch);
  });
});

describe("monitorCloudFormationStack:generateInputParams", () => {
  const event = {
    detail: {
      userIdentity: {
        sessionContext: {
          sessionIssuer: {
            userName: "development-poweruser"
          }
        }
      },
      eventTime: "2019-08-09T01:56:24Z",
      eventName: "CreateStack",
      requestParameters: {
        tags: [
          {
            key: "BRANCH",
            value: "feat/add-lambda-function-guardduty-trigger"
          },
          {
            key: "LENDI_TEAM",
            value: "platform"
          },
          {
            key: "REPOSITORY",
            value: "lendi-platform-team"
          },
          {
            key: "stackjanitor",
            value: "enabled"
          }
        ],
        stackName: "CloudJanitorTest"
      },
      responseElements: {
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:702880128631:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70"
      }
    }
  };

  const expirationTime = getExpirationTime(event.detail.eventTime);

  test("generateInputParams should concatenate all tags into DD input params ", () => {
    const dynamoDbLog = {
      event,
      expirationTime
    };

    expect(generateInputParams(dynamoDbLog)).toStrictEqual({
      TableName: config.DEFAULT_DYNAMODB_TABLE,
      Item: {
        stackName: {
          S: event.detail.requestParameters.stackName
        },
        stackId: {
          S: event.detail.responseElements.stackId
        },
        BRANCH: {
          S: "feat/add-lambda-function-guardduty-trigger"
        },
        LENDI_TEAM: {
          S: "platform"
        },
        REPOSITORY: {
          S: "lendi-platform-team"
        },
        stackjanitor: {
          S: "enabled"
        },
        expirationTime: {
          N: "" + expirationTime
        }
      }
    });
  });
});

describe("monitorCloudFormationStack:index", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  const stackJanitorStatus = {
    level: 30,
    time: 1565315802430,
    event: {
      time: "2019-08-09T01:56:24Z",
      detail: {
        userIdentity: {
          sessionContext: {
            sessionIssuer: {
              userName: "development-poweruser"
            }
          }
        },
        eventTime: "2019-08-09T01:56:24Z",
        eventName: "CreateStack",

        requestParameters: {
          tags: [
            {
              value: "enabled",
              key: "stackjanitor"
            },
            {
              value: "1",
              key: "v1"
            }
          ],
          stackName: "CloudJanitorTest"
        },
        responseElements: {
          stackId:
            "arn:aws:cloudformation:ap-southeast-2:702880128631:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70"
        }
      }
    },
    results: {
      stackjanitor: "enabled"
    },
    v: 1
  };

  test("monitorCloudFormationStack should be successful for: CreateStack", async () => {
    stackJanitorStatus.event.detail.eventName = "CreateStack";
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("success");
  });

  test("monitorCloudFormationStack is ignored for unknown eventName", async () => {
    stackJanitorStatus.event.detail.eventName = "BumpStack";
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("ignore");
  });

  test("monitorCloudFormationStack should be successful for: UpdateStack", async () => {
    stackJanitorStatus.event.detail.eventName = "UpdateStack";
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("success");
  });

  test("monitorCloudFormationStack should be successful for: DeleteStack", async () => {
    stackJanitorStatus.event.detail.eventName = "DeleteStack";
    const indexOutput = await index(stackJanitorStatus, null);
    expect(indexOutput).toEqual("success");
  });
});

describe("monitorCloudFormationStack:tests", () => {
  const event = {
    time: "2019-08-09T01:56:24Z",
    detail: {
      userIdentity: {
        sessionContext: {
          sessionIssuer: {
            userName: "development-poweruser"
          }
        }
      },
      eventTime: "2019-08-09T01:56:24Z",
      eventName: "CreateStack",
      requestParameters: {
        tags: [
          {
            value: "enabled",
            key: "stackjanitor"
          },
          {
            value: "1",
            key: "v1"
          }
        ],
        stackName: "CloudJanitorTest"
      },
      responseElements: {
        stackId:
          "arn:aws:cloudformation:ap-southeast-2:702880128631:stack/CloudJanitorTest/e46581a0-ba48-11e9-a48c-0a4631dffc70"
      }
    }
  };

  const expirationTime = getExpirationTime(event.detail.eventTime);

  test("putItem should return add stack event in DB", async () => {
    const dynamoDbLog = {
      event,
      expirationTime
    };

    expect(await putItem(dynamoDbLog)).toEqual(true);
  });

  test("updateItem should return update stack row in DB", async () => {
    event.detail.eventName = "UpdateStack";
    const dynamoDbLog = {
      event,
      expirationTime
    };
    expect(await updateItem(dynamoDbLog)).toEqual(true);
  });

  test("deleteItem should delete stack row from DB", async () => {
    event.detail.eventName = "DeleteStack";
    expect(await deleteItem(event)).toEqual(true);
  });
});
