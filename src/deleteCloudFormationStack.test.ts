// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { index } from "./deleteCloudFormationStack";

describe("deleteCloudFormationStack", () => {
  test("deleteCloudFormationStack should be called", () => {
    expect(index(null, null));
  });
});
