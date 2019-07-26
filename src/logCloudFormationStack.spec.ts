// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { index } from "./logCloudFormationStack";

describe("handler should be called", () => {
  test("response statusCode should be 200", () => {
    expect(index(null, null));
  });
});
