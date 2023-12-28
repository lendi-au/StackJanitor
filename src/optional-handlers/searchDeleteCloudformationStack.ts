import { deleteStack } from "../cloudformation";
import { describeAllStacks } from "./utils/describeAllStacks";
import {
  getStackName,
  returnStackStatus,
  returnStackTags,
} from "./utils/helpers";
import { isStackExpired } from "./utils/isStackExpired";

export const handler = async () => {
  const allStacks = await describeAllStacks();
  if (allStacks.length > 0) {
    const desiredStacks = returnStackStatus(allStacks);
    const stackjanitorEnabledStacks = returnStackTags(desiredStacks);
    const expiredStacks = isStackExpired(stackjanitorEnabledStacks);
    const stackNames = getStackName(expiredStacks);
    stackNames.forEach(async (stackname: string) => {
      await deleteStack(stackname);
    });
  }
};
