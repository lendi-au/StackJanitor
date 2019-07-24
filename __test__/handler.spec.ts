// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { index } from "../src/handler";

describe("handler", () => {
  test("index", () => {
    expect(
      index(null, null, (error: Error, result: any) => {
        expect(error).toBeNull();
        expect(result.statusCode).toEqual(200);
      })
    );
  });
});
