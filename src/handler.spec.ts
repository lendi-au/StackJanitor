// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { index } from "./handler";

describe("handler should be called", () => {
  test("response statusCode should be 200", () => {
    expect(
      index(null, null, (error: Error, result: any) => {
        expect(error).toBeNull();
        expect(result.statusCode).toEqual(200);
      })
    );
  });
});
