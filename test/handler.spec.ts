// import * as mocha from "mocha";
import * as chai from "chai";
// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { index } from "../src/handler";

const expect = chai.expect;
// const should = chai.should();

describe("handler", () => {
  describe("hello", () => {
    it("should return Serverless boilerplate message", () => {
      index(null, null, (error: Error, result: any) => {
        expect(error).to.be.null;
        result.body.should.equal(
          '{"message":"StackJanitor works!","input":null}'
        );
      });
    });
  });
});
