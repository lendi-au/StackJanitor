import * as dynogels from "dynogels";
import config from "../config";
import * as joi from "joi";
import { Item } from "dynogels";
import { Model } from "dynogels";
import { promisify } from "util";

dynogels.AWS.config.update({ region: config.DEFAULT_AWS_REGION });

const DynamoDataMapper: dynogels.Model = dynogels.define("stackJanitorData", {
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

export interface DataMapper {
  create(arg: any): Promise<Item>;
  update(arg: any): Promise<Item>;
  destroy(arg: any): Promise<Item>;
  get(arg: any): Promise<Item>;
}

const promisifyDataMapper = (dataMapper: Model): DataMapper => ({
  create: promisify(dataMapper.create),
  update: promisify(dataMapper.update),
  destroy: promisify(dataMapper.destroy),
  get: promisify(dataMapper.get)
});

export const dataMapper = promisifyDataMapper(DynamoDataMapper);
