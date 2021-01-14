const SEVEN_DAYS = 7 * 24 * 60 * 60;
const DELETE_INTERVAL = 300; // 300 seconds = 5 mins

const config = {
  DEFAULT_REGION: process.env.DEFAULT_REGION || "ap-southeast-2",
  DEFAULT_DYNAMODB_TABLE:
    process.env.DEFAULT_DYNAMODB_TABLE || "stackJanitorTable",
  DEFAULT_EXPIRATION_PERIOD:
    process.env.DEFAULT_EXPIRATION_PERIOD || SEVEN_DAYS,
  MAX_CLEANUP_RETRY: process.env.MAX_CLEANUP_RETRY || 5,
  DELETE_INTERVAL
};

export default config;
