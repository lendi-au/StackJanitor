import * as dynogels from "dynogels";
import config from "../config";
import * as joi from "joi";

dynogels.AWS.config.update({ region: config.DEFAULT_AWS_REGION });

export const stackJanitorData = dynogels.define("stackJanitorData", {
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
