import { Stack } from "@aws-sdk/client-cloudformation";
import config from "../../config";

export const isStackExpired = (stack: Stack[]) => {
  const DefaultSearchDeletePeriod =
    Number(config.DEFAULT_EXPIRATION_PERIOD) + 259200; // 259200 seconds === 3 days
  const expiredStacks = stack.filter((stack) => {
    let dateTime = new Date().getTime() / 1000;
    if (stack.LastUpdatedTime) {
      const UpdateExpirationTime =
        new Date(stack.LastUpdatedTime).getTime() / 1000 +
        DefaultSearchDeletePeriod;
      if (UpdateExpirationTime < dateTime) {
        return stack;
      }
    } else if (stack.CreationTime) {
      const CreateExpirationTime =
        new Date(stack.CreationTime).getTime() / 1000 +
        DefaultSearchDeletePeriod;
      if (CreateExpirationTime < dateTime) {
        return stack;
      }
    } else {
      // no create/update time available return stack for deletion as we don't want it!
      return stack;
    }
  });
  return expiredStacks;
};
