import { handler } from "./searchDeleteCloudformationStack";

import { Stack } from "@aws-sdk/client-cloudformation";

import * as helpers from "./utils/helpers";
import * as isStackExpired from "./utils/isStackExpired";
import * as cf from "../cloudformation";
import * as describeAllStacks from "./utils/describeAllStacks";

import * as sinon from "sinon";

beforeEach(() => {
  sinon.reset();
});

describe("basic handler calls", () => {
  test("handler with no stacks", async () => {
    const stacksStub = sinon.stub(describeAllStacks, "describeAllStacks");
    const deleteStub = sinon.stub(cf, "deleteStack");
    const stackNameStub = sinon.stub(helpers, "getStackName");
    const returnStackStatusStub = sinon.stub(helpers, "returnStackStatus");
    stacksStub.resolves([]);
    await handler();
    expect(deleteStub.notCalled).toBeTruthy();
    expect(stackNameStub.notCalled).toBeTruthy();
    expect(returnStackStatusStub.notCalled).toBeTruthy();
    sinon.reset();
    sinon.restore();
  });

  test("handler with a stack returned", async () => {
    const stacksStub = sinon.stub(describeAllStacks, "describeAllStacks");
    const deleteStub = sinon.stub(cf, "deleteStack");
    const now = new Date("December 17, 1995 03:24:00"); // very old stack
    const returnedValue: Stack[] = [
      {
        StackName: "test1",
        CreationTime: now,
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled",
          },
        ],
      },
    ];
    stacksStub.resolves(returnedValue);
    await handler();
    expect(deleteStub.calledOnce).toBeTruthy();
    sinon.reset();
    sinon.restore();
  });

  test("handler with a stack returned", async () => {
    const stacksStub = sinon.stub(describeAllStacks, "describeAllStacks");
    const deleteStub = sinon.stub(cf, "deleteStack");
    const now = new Date(); // now!
    const returnedValue: Stack[] = [
      {
        StackName: "test1",
        CreationTime: now,
        StackStatus: "CREATE_COMPLETE",
        Tags: [
          {
            Key: "stackjanitor",
            Value: "enabled",
          },
        ],
      },
    ];
    stacksStub.resolves(returnedValue);
    await handler();
    expect(deleteStub.notCalled).toBeTruthy();
    sinon.reset();
    sinon.restore();
  });
});
