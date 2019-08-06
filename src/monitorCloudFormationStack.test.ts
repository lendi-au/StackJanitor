// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { index } from "./monitorCloudFormationStack";

describe("monitorCloudFormationStack", () => {
  test("monitorCloudFormationStack should be called", () => {
    expect(index(null));
  });
});
