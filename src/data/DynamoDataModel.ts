import * as dynogels from "dynogels";
import config from "../config";
import * as joi from "joi";
import { Item } from "dynogels";
import { Model } from "dynogels";
import { promisify } from "util";

dynogels.AWS.config.update({ region: config.DEFAULT_REGION });

export const dynamoDataModel: dynogels.Model = dynogels.define(
  "DynamoDataMapper",
  {
    tableName: config.DEFAULT_DYNAMODB_TABLE,
    hashKey: "stackName",
    rangeKey: "stackId",
    schema: {
      stackName: joi.string(),
      stackId: joi.string(),
      expirationTime: joi.number(),
      tags: joi.string()
    }
  }
);

export enum Actions {
  Create = "create",
  Update = "update",
  Destroy = "destroy",
  Get = "get"
}

export interface ActionHandler {
  (arg: any): Promise<Item>;
}

export type DataModel = { [K in Actions]: ActionHandler };

const promisifyDataMapper = (dataMapper: Model): DataModel => ({
  create: promisify(dataMapper.create),
  update: promisify(dataMapper.update),
  destroy: promisify(dataMapper.destroy),
  get: promisify(dataMapper.get)
});

export const dataModel = promisifyDataMapper(dynamoDataModel);
