const SEVEN_DAYS = 7 * 24 * 60 * 60;

const config = {
  DEFAULT_AWS_REGION: process.env.DEFAULT_AWS_REGION || "ap-southeast-2",
  DEFAULT_DYNAMODB_TABLE:
    process.env.DEFAULT_DYNAMODB_TABLE || "stackJanitorTable",
  DEFAULT_EXPIRATION_PERIOD: process.env.DEFAULT_EXPIRATION_PERIOD || SEVEN_DAYS
};

export default config;
