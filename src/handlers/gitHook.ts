import { APIGatewayEvent } from "aws-lambda";
import { logger } from "../logger";

// interface BitBucketMergeEvent {
//   repository: {
//     name: string;
//   };
// }

// const eventParser = (json: JSON) => {};

export const index = async (event: APIGatewayEvent) => {
  const body = event.body;
  logger.info(event);
  return {
    statusCode: 200,
    body: JSON.stringify(body)
  };
};
