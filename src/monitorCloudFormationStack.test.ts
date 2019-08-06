// import { APIGatewayEvent, Handler, Callback, Context } from "aws-lambda";
import { putItem } from "./monitorCloudFormationStack";

describe("monitorCloudFormationStack:putItem", () => {
  test("monitorCloudFormationStack should be called", () => {
    const inputParams = {
      TableName: "stackJanitorTable",
      Item: {
        stackName: "stackJanitorTest",
        expirationTime: new Date().getTime()
      }
    };
    putItem(inputParams);
  });
});
