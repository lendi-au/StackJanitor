const SECONDS_IN_AN_HOUR = 60 * 60;

// days * hours = 7 days
const DEFAULT_EXPIRATION_HOURS = 7 * 24;

const SECONDS_SINCE_EPOCH = Math.round(Date.now() / 1000);
const EXPIRATION_TIME =
  SECONDS_SINCE_EPOCH + DEFAULT_EXPIRATION_HOURS * SECONDS_IN_AN_HOUR;

const config = {
  DEFAULT_DYNAMODB_TABLE: "stackJanitorTable",
  DEFAULT_EXPIRATION_HOURS,
  EXPIRATION_TIME,
  SECONDS_SINCE_EPOCH
};

export default config;
