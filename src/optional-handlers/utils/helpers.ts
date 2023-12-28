import { Stack } from "@aws-sdk/client-cloudformation";

export const returnStackStatus = (stacks: Stack[]) => {
  const stackStatus = [
    "CREATE_COMPLETE",
    "UPDATE_COMPLETE",
    "CREATE_FAILED",
    "ROLLBACK_FAILED",
    "ROLLBACK_COMPLETE",
    "DELETE_FAILED",
    "UPDATE_ROLLBACK_FAILED",
    "UPDATE_ROLLBACK_COMPLETE",
    "IMPORT_ROLLBACK_FAILED",
    "IMPORT_ROLLBACK_COMPLETE",
  ];
  return stacks.filter((stack) => {
    return stackStatus.includes(String(stack.StackStatus));
  });
};

export const returnStackTags = (stacks: Stack[]) => {
  return stacks.filter((stack) => {
    return (
      stack.Tags &&
      stack.Tags.find((tag) => tag.Key === "stackjanitor")?.Value === "enabled"
    );
  });
};

export const getStackName = (stack: Stack[]): string[] => {
  const stackNames = stack.map((stack) => {
    const stackName = stack.StackName;
    return stackName;
  });
  return stackNames as string[];
};
