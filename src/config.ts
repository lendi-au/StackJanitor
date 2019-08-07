const SECONDS_IN_AN_HOUR = 60 * 60;

// days * hours = 7 days
const DEFAULT_EXPIRATION_HOURS = 7 * 24;

const config = {
  DEFAULT_DYNAMODB_TABLE: "stackJanitorTable",
  DEFAULT_EXPIRATION_HOURS,
  EXPIRATION_TIME:
    this.SECONDS_SINCE_EPOCH + DEFAULT_EXPIRATION_HOURS * SECONDS_IN_AN_HOUR,
  SECONDS_SINCE_EPOCH: (function() {
    return Math.round(Date.now() / 1000);
  })()
};

export default config;
