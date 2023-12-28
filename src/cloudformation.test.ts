import {
  CloudFormationClient,
  DeleteStackCommand,
} from "@aws-sdk/client-cloudformation";
import { mockClient } from "aws-sdk-client-mock";
import { deleteStack } from "./cloudformation";
import "aws-sdk-client-mock-jest";

describe("deleteStack", () => {
  const cfMock = mockClient(CloudFormationClient);
  beforeEach(() => {
    cfMock.reset();
  });

  test("delete a single stack", async () => {
    cfMock.on(DeleteStackCommand, { StackName: "test" }).resolves({});
    await deleteStack("test");
    expect(cfMock).toHaveReceivedCommandWith(DeleteStackCommand, {
      StackName: "test",
    });
  });
});
