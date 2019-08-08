const log = require("pino")();

export const logger = data => {
  log.info(data);
};
