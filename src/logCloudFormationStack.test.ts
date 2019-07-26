// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { index } from "./logCloudFormationStack";

describe("logCloudFormationStack", () => {
  test("logCloudFormationStack should be called", () => {
    expect(index(null, null));
  });
});
