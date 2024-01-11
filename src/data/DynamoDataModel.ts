import config from "../config";
import { Entity, Table } from "dynamodb-toolbox";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const DocumentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: config.DEFAULT_REGION }),
);

export const dynamoDataModel = new Table({
  name: config.DEFAULT_DYNAMODB_TABLE,
  partitionKey: "stackName",
  sortKey: "stackId",
  DocumentClient,
});

export const JanitorRecord: Entity = new Entity({
  name: "StackToDelete",
  attributes: {
    stackName: { type: "string", partitionKey: true }, // flag as partitionKey
    stackId: { type: "string", sortKey: true }, // flag as sortKey and mark hidden
    expirationTime: { type: "number" }, // set the attribute type
    tags: { type: "string" },
    deleteCount: { type: "number" },
  },
  table: dynamoDataModel,
});

export enum Actions {
  Create = "create",
  Update = "update",
  Destroy = "destroy",
  Get = "get",
}
