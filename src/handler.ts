import { APIGatewayProxyHandler } from "aws-lambda";
import "source-map-support/register";

export const index: APIGatewayProxyHandler = async (event, _context) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "StackJanitor works!",
        input: event
      },
      null,
      2
    )
  };
};
