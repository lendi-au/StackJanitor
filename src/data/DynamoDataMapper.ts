import * as dynogels from "dynogels";
import config from "../config";
import * as joi from "joi";
import { Item } from "dynogels";
import { Model } from "dynogels";
import { promisify } from "util";

dynogels.AWS.config.update({ region: config.DEFAULT_REGION });

const DynamoDataMapper: dynogels.Model = dynogels.define("DynamoDataMapper", {
  tableName: config.DEFAULT_DYNAMODB_TABLE,
  hashKey: "stackName",
  rangeKey: "stackId",
  schema: {
    stackName: joi.string(),
    stackId: joi.string(),
    expirationTime: joi.number(),
    tags: joi.array().items(joi.object())
  }
});

export enum Actions {
  Create = "create",
  Update = "update",
  Destroy = "destroy",
  Get = "get"
}

export interface ActionHandler {
  (arg: any): Promise<Item>;
}

export type DataMapper = { [K in Actions]: ActionHandler };

const promisifyDataMapper = (dataMapper: Model): DataMapper => ({
  create: promisify(dataMapper.create),
  update: promisify(dataMapper.update),
  destroy: promisify(dataMapper.destroy),
  get: promisify(dataMapper.get)
});

export const dataMapper = promisifyDataMapper(DynamoDataMapper);
