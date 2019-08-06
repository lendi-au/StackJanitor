import { DynamoDBStreamEvent } from "aws-lambda";

export const index = async (event: DynamoDBStreamEvent, _context) => {
  console.log(event.Records[0].dynamodb);
  console.log(_context);
};
